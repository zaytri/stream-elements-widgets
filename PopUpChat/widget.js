const REGEX_BEFORE = '(?<=\\s|^)'
const REGEX_AFTER = '(?=\\s|$|[.,!])'

const PART_TYPE = {
  TEXT: 'text',
  EMOTE: 'emote',
}

const MESSAGE_TYPE = {
  MESSAGE: 'message',
  ACTION: 'action',
  HIGHLIGHT: 'highlight',
}

const CLASS = {
  CONTAINER: 'container',
  CONTAINER_BACKGROUND: 'container-background',
  HEADER: 'header',
  TITLE: 'title',
  MESSAGE: 'message',
  MESSAGE_WRAPPER: 'message-wrapper',
  HIGHLIGHT: 'highlight',
  ACTION: 'action',
  TEXT: 'text',
  USER_COLOR_DARK: 'user-color-dark',
  EMOTE: size => `emote emote-${size}`,
  SHOW_PADDING: 'show-padding',
  ANIMATE: 'animate',
  DARK: 'dark',
}

const DATA = attribute => `data-${attribute}`
DATA.MESSAGE_ID = DATA('message-id')
DATA.USER_ID = DATA('user-id')

const DEFAULT_COLORS = [
  '#ff4a80', '#ff7070', '#fa8e4b', '#fee440',
  '#5fff77', '#00f5d4', '#00bbf9', '#4371fb',
  '#9b5de5', '#f670dd',
]

let WINDOW_WIDTH = 1920
let WINDOW_HEIGHT = 1080

const FIELD_DATA = {
  LIFETIME: 10,
  DELAY: 1,
  SPACING: 30,
  SOUND_URL: '',
  VOLUME: 50,
  DARK: true,
}

window.addEventListener('onWidgetLoad', obj => {
  const main = $('main')
  window.setTimeout(_ => {
    WINDOW_WIDTH = main.innerWidth()
  	WINDOW_HEIGHT = main.innerHeight()
  }, 1000)

  const {
    lifetime, delay, spacing, soundUrl,
    volume, dark,
  } = obj.detail.fieldData

  FIELD_DATA.LIFETIME = lifetime
  FIELD_DATA.DELAY = delay
  FIELD_DATA.SPACING = spacing
  FIELD_DATA.SOUND_URL = soundUrl
  FIELD_DATA.VOLUME = volume
  FIELD_DATA.DARK = dark === 'true'

  if (FIELD_DATA.DARK) main.addClass(CLASS.DARK)
  else main.removeClass(CLASS.DARK)
})

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail
  switch(listener) {
    case 'message': onMessage(event)
      break
    case 'delete-message': deleteMessage(event.msgId)
      break
    case 'delete-messages': deleteMessages(event.userId)
      break
    case 'event:test': onTest(event)
      break
    default: return
  }
})

// ---------------------
//    Event Functions
// ---------------------

function onMessage(event) {
  const {
    badges, emotes, tags,
    msgId, userId, isAction,
    displayColor: color,
    displayName: name,
    text: rawText,
  } = event.data
  const text = htmlEncode(rawText)

  let messageType = MESSAGE_TYPE.MESSAGE
  if (isAction) messageType = MESSAGE_TYPE.ACTION
  if (tags['msg-id'] === 'highlighted-message') messageType = MESSAGE_TYPE.HIGHLIGHT

  const parsed = parse(text, emotes)
  const size = emoteSize(parsed)

  const elementData = {
    messageType, color, badges, name,
    msgId, userId, size, parsed,
  }

  $('main').append(MessageComponent({ ...elementData }))
  const currentMessage = `.${CLASS.CONTAINER}[${DATA.MESSAGE_ID}=${msgId}]`

  const sound = new Audio(FIELD_DATA.SOUND_URL)
  sound.volume = parseInt(FIELD_DATA.VOLUME) / 100

  window.setTimeout(_ => {
    const width = $(currentMessage).outerWidth()
    const height = $(currentMessage).outerHeight()
    const [left, top] = calcPosition(width, height)

    const maxWidth = $(`${currentMessage} .${CLASS.MESSAGE_WRAPPER}`).width() + 1
    const minWidth = $(`${currentMessage} .${CLASS.TITLE}`).outerWidth()

    $(`${currentMessage} .${CLASS.MESSAGE}`).css({
      '--dynamicWidth': Math.max(minWidth, maxWidth),
    })

    window.setTimeout(_ => {
      $(currentMessage).css({ left, top })
    }, 300)
  }, 300)

  window.setTimeout(_ => {
    sound.play()
    $(currentMessage).addClass(CLASS.ANIMATE)

    window.setTimeout(_ => {
      deleteMessage(msgId)
    }, FIELD_DATA.LIFETIME * 1000 )
  }, FIELD_DATA.DELAY * 1000)
}

function deleteMessage(msgId) {
  $(`.${CLASS.CONTAINER}[${DATA.MESSAGE_ID}=${msgId}]`).remove()
}

function deleteMessages(userId) {
  $(`.${CLASS.CONTAINER}[${DATA.USER_ID}=${userId}]`).remove()
}

function onTest(event) {
  const { listener, field } = event
  if (listener === 'widget-button' && field === 'spacingButton') {
    $('main').toggleClass(CLASS.SHOW_PADDING)
  }
}

// -------------------------
//    Component Functions
// -------------------------

function MessageComponent(props) {
  const {
    hidden, parsed, color: userColor, badges,
    name, msgId, userId, messageType, size,
  } = props

  const color = userColor || generateColor(name)

  const tColor = tinycolor(color)
  const isDark = tColor.isDark()

  const parsedElements = parsed.map(({ type, data }) => {
    switch(type) {
      case PART_TYPE.EMOTE: return EmoteComponent(data, size)
      case PART_TYPE.TEXT:
      default: return TextComponent(data)
    }
  })

  let containerClasses = [CLASS.CONTAINER]
  switch (messageType) {
    case MESSAGE_TYPE.HIGHLIGHT: containerClasses.push(CLASS.HIGHLIGHT)
      break
    case MESSAGE_TYPE.ACTION: containerClasses.push(CLASS.ACTION)
      break
    default: // nothing
  }

  if (tColor.isDark()) containerClasses.push(CLASS.USER_COLOR_DARK)

  return Component('section', {
    class: containerClasses,
    style: { '--userColor': color },
    [DATA.MESSAGE_ID]: msgId,
    [DATA.USER_ID]: userId,
    children: [
      Component('div', { class: CLASS.CONTAINER_BACKGROUND }),
      Component('div', { class: CLASS.HEADER, children:
        Component('h2', { class: CLASS.TITLE, children: name })
      }),
      Component('div', { class: CLASS.MESSAGE, children:
        Component('span', { class: CLASS.MESSAGE_WRAPPER, children: parsedElements })
      }),
    ],
  })
}

function TextComponent(text) {
  return Component('span', { class: CLASS.TEXT, children: [text] })
}

function EmoteComponent({ urls: { '4': url }, name }, size = 2) {
  return Component('img', { class: CLASS.EMOTE(size), src: url, alt: name })
}

function Component(tag, props) {
  const { children, 'class': classes, style, ...rest } = props

  if (classes) {
    rest.class = joinIfArray(classes, ' ')
  }
  if (style) {
    rest.style = Object.entries(style).map(([key, value]) => `${key}: ${value}`).join(';')
  }

  const attributes = Object.entries(rest)
    .reduce((acc, [attr, value]) => `${acc} ${attr}='${value}'`, '')
  const start = `<${tag}${attributes}`
  const end = children ? `>${joinIfArray(children)}</${tag}>` : ' />'
  return `${start}${end}`
}

// ---------------------
//    Parse Functions
// ---------------------

function parse(text, emotes) {
  if (!emotes || emotes.length === 0) return [TextPart(text)]

  const regex = createRegex(emotes.map(e => e.name))

  const textParts = text.split(regex).map(text => TextPart(text))
  const last = textParts.pop()

  const parsed = textParts.reduce((acc, textPart, index) => {
    return [...acc, textPart, EmotePart(emotes[index])]
  }, [])

  parsed.push(last)
  return parsed
}

function TextPart(text) {
  return { type: PART_TYPE.TEXT, data: text }
}

function EmotePart(emote) {
  return { type: PART_TYPE.EMOTE, data: emote }
}

// ----------------------
//    Helper Functions
// ----------------------

function emoteSize(parsed) {
  let emotesFound = 0
  for (const { type, data } of parsed) {
    switch(type) {
      case PART_TYPE.TEXT: if (data.trim() !== '') return 1
        break
      case PART_TYPE.EMOTE: emotesFound++
        break
      default: return 2
    }
  }
  if (emotesFound > 1) return 2
  return 4
}

function generateColor(name) {
  if (!name) return DEFAULT_COLORS[0]
  const value = name.split('').reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
  return DEFAULT_COLORS[value % DEFAULT_COLORS.length]
}

const createRegex = strings => {
  const regexStrings = strings.sort().reverse().map(string => escapeRegExp(string))
  const regex = `${REGEX_BEFORE}(?:${regexStrings.join('|')})${REGEX_AFTER}`
  return new RegExp(regex, 'g')
}

function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function calcPosition(width, height) {
  return [
    random(FIELD_DATA.SPACING, WINDOW_WIDTH - FIELD_DATA.SPACING - width ),
    random(FIELD_DATA.SPACING, WINDOW_HEIGHT - FIELD_DATA.SPACING - height),
  ]
}

function joinIfArray(possibleArray, delimiter = '') {
  if (Array.isArray(possibleArray)) return possibleArray.join(delimiter)
  return possibleArray
}

function htmlEncode(text) {
  return text.replace(/[\<\>\"\'\^\=]/g, char => `&#${char.charCodeAt(0)};`)
}