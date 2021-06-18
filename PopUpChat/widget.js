// --- Logic ---
// ensure that the filters for everyone/sub/vip/mod works
// option to not show bot commands

// --- Appearance ---
// fix positioning calculations
// customizable animation effects, probably from a set pool of animation
// for themes: custom background images? and a way to position the message? longer messages would be cut off but maybe that's ok
// select between user color and custom color when choosing colors for custom styling

// --- Not Yet Possible ---
// option to show for certain other channel point redemptions (not possible for now)
// develop for facebook and youtube

// --- Done ---
// set an X so that users don't spawn chat bubbles until they send X messages, to prevent 1 message trolls and such
// option to only show on highlighted messages
// message cooldown: set this to X seconds so that a message can only show once per X seconds
// an option to only show if the message is emote-only
// word filter to only show messages with specific words (like "gg", "hype", "rip", etc)
// an option to only show for X seconds after a raid happens

const db = {}
const REGEX_BEFORE = '(?<=\\s|^)'
const REGEX_AFTER = '(?=\\s|$|[.,!])'
let cooldown = false
let raidActive = false
let raidTimer = null

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
  BUBBLE: 'bubble',
  USERNAME_BOX: 'username-box',
  USERNAME: 'username',
  CONTAINER_BACKGROUND: 'container-background',
}

const LEVEL = {
  EVERYONE: 0,
  ONLY_SUB_VIP_MOD: 1,
  ONLY_SUB_MOD: 2,
  ONLY_VIP_MOD: 3,
  ONLY_MOD: 4
}

const ROLE = {
  SUB: 'subscriber',
  VIP: 'vip',
  MODS: ['mod', 'global_mod', 'staff', 'admin', 'broadcaster']
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
  SUB_ONLY: false,
  HIGHLIGHT_ONLY: false,
  HIGHLIGHT_MODE: 'rainbow',
  ACTION_MODE: 'italics',
  ANIMATION: 'dynamic',
  USER_LEVEL: LEVEL.EVERYONE,
  ALLOW: [],
  BLOCK: [],
}

window.addEventListener('onWidgetLoad', obj => {
  const main = $('main')
  window.setTimeout(_ => {
    WINDOW_WIDTH = main.innerWidth()
  	WINDOW_HEIGHT = main.innerHeight()
  }, 1000)

  const {
    lifetime, delay, spacing, soundUrl,
    volume, dark, subOnly, highlightOnly,
    highlightMode, actionMode, userLevel, allow,
    block, minMessages, messageCooldown,
    emoteOnly, allowedStrings, raidCooldown,
    animation,
  } = obj.detail.fieldData

  FIELD_DATA.LIFETIME = lifetime
  FIELD_DATA.DELAY = delay
  FIELD_DATA.SPACING = spacing
  FIELD_DATA.SOUND_URL = soundUrl
  FIELD_DATA.VOLUME = volume
  FIELD_DATA.DARK = dark === 'true'
  FIELD_DATA.SUB_ONLY = subOnly === 'true'
  FIELD_DATA.HIGHLIGHT_ONLY = highlightOnly === 'true'
  FIELD_DATA.HIGHLIGHT_MODE = highlightMode
  FIELD_DATA.ACTION_MODE = actionMode
  FIELD_DATA.USER_LEVEL = parseInt(userLevel, 10)
  FIELD_DATA.ALLOW = stringToArray(allow)
  FIELD_DATA.BLOCK = stringToArray(block)
  FIELD_DATA.MIN_MESSAGES = minMessages
  FIELD_DATA.MESSAGE_COOLDOWN = messageCooldown
  FIELD_DATA.EMOTE_ONLY = emoteOnly === 'true'
  FIELD_DATA.ALLOWED_STRINGS = stringToArray(allowedStrings)
  FIELD_DATA.RAID_COOLDOWN = raidCooldown
  FIELD_DATA.ANIMATION = animation

  if (FIELD_DATA.DARK) main.addClass(CLASS.DARK)
  else main.removeClass(CLASS.DARK)
})

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail
  switch(listener) {
    case 'message': onMessage(event)
      break
    case 'raid-latest': onRaid()
      break
    case 'delete-message': deleteMessage(event.msgId)
      break
    case 'delete-messages': deleteMessages(event.userId)
      break
    case 'event:test': onButton(event)
      break
    default: return
  }
})

// ---------------------
//    Event Functions
// ---------------------

function onMessage(event) {
  const {
    badges, emotes, tags, msgId,
    userId, isAction, text, nick,
    displayColor: color,
    displayName: name,
  } = event.data

  if (FIELD_DATA.RAID_COOLDOWN !== 0 && !raidActive) return

  if (!db[userId]) {
    db[userId] = 0
  }

  db[userId]++

  if (db[userId] <= FIELD_DATA.MIN_MESSAGES) return

  if (FIELD_DATA.ALLOW.length && !isAllowed(name, nick)) return
  if (isBlocked(name, nick)) return

  switch(FIELD_DATA.USER_LEVEL) {
    case LEVEL.ONLY_SUB_VIP_MOD: if (!isRole([...ROLE.MODS, ROLE.SUB, ROLE.VIP])(badges)) return
    case LEVEL.ONLY_SUB_MOD: if (!isRole([...ROLE.MODS, ROLE.SUB])(badges)) return
    case LEVEL.ONLY_VIP_MOD: if (!isRole([...ROLE.MODS, ROLE.VIP])(badges)) return
    case LEVEL.ONLY_MOD: if (!isRole(ROLE.MODS)(badges)) return
    default: // none
  }

  let messageType = MESSAGE_TYPE.MESSAGE
  if (isAction) messageType = MESSAGE_TYPE.ACTION
  if (tags['msg-id'] === 'highlighted-message') messageType = MESSAGE_TYPE.HIGHLIGHT

  if (FIELD_DATA.HIGHLIGHT_ONLY && messageType !== MESSAGE_TYPE.HIGHLIGHT) return

  const parsed = parse(htmlEncode(text), emotes)
  const size = emoteSize(parsed)

  if (FIELD_DATA.ALLOWED_STRINGS.length && !isAllowedString(text)) return

  if (FIELD_DATA.EMOTE_ONLY && size <= 1) return

  if (cooldown) {
    return
  } else {
    cooldown = true
    window.setTimeout(() => { cooldown = false }, FIELD_DATA.MESSAGE_COOLDOWN * 1000)
  }

  const elementData = {
    messageType, color, badges, name,
    msgId, userId, size, parsed,
  }

  $('main').append(MessageComponent({ ...elementData }))
  const currentMessage = `.${CLASS.BUBBLE}[${DATA.MESSAGE_ID}=${msgId}]`

  const sound = new Audio(FIELD_DATA.SOUND_URL)
  sound.volume = parseInt(FIELD_DATA.VOLUME) / 100

  window.setTimeout(_ => {
    const width = $(currentMessage).outerWidth()
    const height = $(currentMessage).outerHeight()

    const maxWidth = $(`${currentMessage} .${CLASS.MESSAGE_WRAPPER}`).width() + 1
    const minWidth = $(`${currentMessage} .${CLASS.USERNAME}`).outerWidth()

    // i'm not entirely sure why the +30 is necessary, but it makes the calculations work correctly
    const [left, top] = calcPosition(Math.max(minWidth, maxWidth) + 30, height)

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
    $(currentMessage).addClass(FIELD_DATA.ANIMATION)

    window.setTimeout(_ => {
      deleteMessage(msgId)
    }, FIELD_DATA.LIFETIME * 1000 )
  }, FIELD_DATA.DELAY * 1000)
}

function onRaid() {
  console.log({ raidActive, cooldown: FIELD_DATA.RAID_COOLDOWN })
  if (FIELD_DATA.RAID_COOLDOWN === 0) return
  clearTimeout(raidTimer)
  raidActive = true
  raidTimer = window.setTimeout(() => { raidActive = false }, FIELD_DATA.RAID_COOLDOWN * 1000)
}

function deleteMessage(msgId) {
  $(`.${CLASS.BUBBLE}[${DATA.MESSAGE_ID}=${msgId}]`).remove()
}

function deleteMessages(userId) {
  $(`.${CLASS.BUBBLE}[${DATA.USER_ID}=${userId}]`).remove()
}

const TEST_MESSAGES = [
  ['woa'],
  ['hi!!'],
  ['NonBinaryPride', [
    {
      end: 13,
      gif: false,
      id: "1297279",
      name: "NonBinaryPride",
      start: 0,
      type: "twitch",
      urls: {
        1: "https://static-cdn.jtvnw.net/emoticons/v1/1297279/1.0",
        2: "https://static-cdn.jtvnw.net/emoticons/v1/1297279/1.0",
        4: "https://static-cdn.jtvnw.net/emoticons/v1/1297279/3.0",
      },
    }
  ]],
  ['MercyWing1 PinkMercy MercyWing2', [
    {
      "type": "twitch",
      "name": "MercyWing1",
      "id": "1003187",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v1/1003187/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v1/1003187/1.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v1/1003187/3.0"
      },
      "start": 0,
      "end": 9
    },
    {
      "type": "twitch",
      "name": "PinkMercy",
      "id": "1003190",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v1/1003190/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v1/1003190/1.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v1/1003190/3.0"
      },
      "start": 11,
      "end": 19
    },
    {
      "type": "twitch",
      "name": "MercyWing2",
      "id": "1003189",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v1/1003189/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v1/1003189/1.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v1/1003189/3.0"
      },
      "start": 21,
      "end": 30
    }
  ]],
  ['dance dance bobDance', [
    {
      "type": "bttv",
      "name": "bobDance",
      "id": "5e2a1da9bca2995f13fc0261",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/1x",
        "2": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/2x",
        "4": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/3x"
      },
      "start": 12,
      "end": 20
    }
  ]],
  ['bobDance', [
    {
      "type": "bttv",
      "name": "bobDance",
      "id": "5e2a1da9bca2995f13fc0261",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/1x",
        "2": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/2x",
        "4": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/3x"
      },
      "start": 0,
      "end": 8
    }
  ]],
  ['bongoTap bongoTap bongoTap', [
    {
      "type": "bttv",
      "name": "bongoTap",
      "id": "5ba6d5ba6ee0c23989d52b10",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/1x",
        "2": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/2x",
        "4": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/3x"
      },
      "start": 0,
      "end": 8
    },
    {
      "type": "bttv",
      "name": "bongoTap",
      "id": "5ba6d5ba6ee0c23989d52b10",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/1x",
        "2": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/2x",
        "4": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/3x"
      },
      "start": 9,
      "end": 17
    },
    {
      "type": "bttv",
      "name": "bongoTap",
      "id": "5ba6d5ba6ee0c23989d52b10",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/1x",
        "2": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/2x",
        "4": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/3x"
      },
      "start": 18,
      "end": 26
    }
  ]]
]

function onButton(event) {
  const { listener, field, value } = event

  if (listener !== 'widget-button' || value !== 'zaytri_dynamicchatbubbles') return

  switch(field) {
    case 'zaytri_dynamicchatbubbles_spacingButton': {
      $('main').toggleClass(CLASS.SHOW_PADDING)
      break
    }

    case 'zaytri_dynamicchatbubbles_testMessageButton': {
      sendTestMessage(100)
      break
    }

    default: return
  }
}

function sendTestMessage(amount = 1) {
  for (let i = 0; i < amount; i++) {
    window.setTimeout(_ => {
      const event = {
        data: {
          tags: {},
          text: 'test',
          displayName: `user ${numbered.stringify(random(1, 10))}`.replace(' ', '_'),
          nick: '',
          msgId: `test_${Date.now()}`,
        }
      }
      const [text, emotes] = TEST_MESSAGES[random(0, TEST_MESSAGES.length - 1)]
      event.data.text = text
      event.data.emotes = emotes


      const messageType = random(1, 3)
      if (messageType === 2) {
        event.data.isAction = true
      } else if (messageType === 3) {
        event.data.tags = {}
        event.data.tags['msg-id'] = 'highlighted-message'
      }
      onMessage(event)
    }, i * 200)
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

  let containerClasses = [CLASS.BUBBLE]
  switch (messageType) {
    case MESSAGE_TYPE.HIGHLIGHT: {
      if (FIELD_DATA.HIGHLIGHT_MODE === 'rainbow') containerClasses.push(CLASS.HIGHLIGHT)
      break
    }
    case MESSAGE_TYPE.ACTION: {
      if (FIELD_DATA.ACTION_MODE === 'italics') containerClasses.push(CLASS.ACTION)
      break
    }
    default: // nothing
  }

  if (isDark) containerClasses.push(CLASS.USER_COLOR_DARK)

  return Component('section', {
    class: containerClasses,
    style: { '--userColor': color, '--userColorDarkened': tColor.darken(10).saturate(20).toString()  },
    [DATA.MESSAGE_ID]: msgId,
    [DATA.USER_ID]: userId,
    children: [
      Component('div', { class: CLASS.CONTAINER_BACKGROUND }),
      Component('div', { class: CLASS.USERNAME_BOX, children:
        Component('p', { class: CLASS.USERNAME, children: name })
      }),
      Component('div', { class: CLASS.MESSAGE, children:
        Component('span', { class: CLASS.MESSAGE_WRAPPER, children: parsedElements })
      }),
    ],
  })
}

function TextComponent(text) {
  return Component('span', { class: CLASS.TEXT, children: text })
}

function EmoteComponent({ urls: { '4': url }, name }, size = 2) {
  return Component('img', { class: CLASS.EMOTE(size), src: url, alt: name })
}

const ClassComponent = (className, tag = 'div') => (children, props = {}) => Component(tag, { children, class: className, ...props })
const BubbleComponent = ClassComponent(CLASS.BUBBLE)
const UsernameBoxComponent = ClassComponent(CLASS.USERNAME_BOX)
const UsernameComponent = ClassComponent(CLASS.USERNAME)
const MessageWrapperComponent = ClassComponent(CLASS.MESSAGE_WRAPPER)

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

  const regex = createRegex(emotes.map(e => htmlEncode(e.name)))

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

const namesInList = type => (...names) => {
  const lowercaseNames = names.map(name => name.toLowerCase())
  let list
  switch (type) {
    case 'allow': list = FIELD_DATA.ALLOW
      break
    case 'block': list = FIELD_DATA.BLOCK
      break
    default: return false
  }
  for (const user of list) {
    if (lowercaseNames.includes(user)) return true
  }
  return false
}

const isAllowed = namesInList('allow')
const isBlocked = namesInList('block')

function isAllowedString(text) {
  return FIELD_DATA.ALLOWED_STRINGS.includes(text)
}

function stringToArray(string = '', separator = ',') {
  return string.split(separator).reduce((acc, value) => {
    const trimmed = value.trim().toLowerCase()
    if (trimmed !== '') acc.push(trimmed)
    return acc
  }, [])
}

function hasBadge(badges = [], type) {
  for (const badge of badges) {
    if (Array.isArray(type)) {
      if (type.includes(badge.type)) return true
    } else {
      if (badge.type === type) return true
    }
  }
  return false
}

const isRole = role => badges => hasBadge(badges, role)

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
    random(FIELD_DATA.SPACING, WINDOW_WIDTH - FIELD_DATA.SPACING - width),
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