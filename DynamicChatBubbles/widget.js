const DEFAULT_COLORS = [
  '#ff4a80', '#ff7070', '#fa8e4b', '#fee440',
  '#5fff77', '#00f5d4', '#00bbf9', '#4371fb',
  '#9b5de5', '#f670dd',
]

let FieldData = {}
const Widget = {
  width: 0,
  height: 0,
  cooldown: false,
  raidActive: false,
  raidTimer: null,
  userMessageCount: {},
}

const TEST_MESSAGES = [
  ['this is a message that i\'m adding words to just to make it a longer message weeeee'],
  ['VoHiYo hello!', [
    {
      "type": "twitch",
      "name": "VoHiYo",
      "id": "81274",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/81274/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/81274/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/81274/default/dark/3.0"
      },
      "start": 0,
      "end": 5
    }
  ]],
  ['TwitchUnity', [
    {
      "type": "twitch",
      "name": "TwitchUnity",
      "id": "196892",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/196892/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/196892/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/196892/default/dark/3.0"
      },
      "start": 0,
      "end": 10
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
  ['TransgenderPride PansexualPride NonbinaryPride LesbianPride IntersexPride GenderFluidPride GayPride BisexualPride AsexualPride', [
    {
      "type": "twitch",
      "name": "TransgenderPride",
      "id": "307827377",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827377/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827377/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827377/default/dark/3.0"
      },
      "start": 0,
      "end": 15
    },
    {
      "type": "twitch",
      "name": "PansexualPride",
      "id": "307827370",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827370/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827370/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827370/default/dark/3.0"
      },
      "start": 17,
      "end": 30
    },
    {
      "type": "twitch",
      "name": "NonbinaryPride",
      "id": "307827356",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827356/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827356/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827356/default/dark/3.0"
      },
      "start": 32,
      "end": 45
    },
    {
      "type": "twitch",
      "name": "LesbianPride",
      "id": "307827340",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827340/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827340/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827340/default/dark/3.0"
      },
      "start": 47,
      "end": 58
    },
    {
      "type": "twitch",
      "name": "IntersexPride",
      "id": "307827332",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827332/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827332/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827332/default/dark/3.0"
      },
      "start": 60,
      "end": 72
    },
    {
      "type": "twitch",
      "name": "GenderFluidPride",
      "id": "307827326",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827326/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827326/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827326/default/dark/3.0"
      },
      "start": 74,
      "end": 89
    },
    {
      "type": "twitch",
      "name": "GayPride",
      "id": "307827321",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827321/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827321/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827321/default/dark/3.0"
      },
      "start": 91,
      "end": 98
    },
    {
      "type": "twitch",
      "name": "BisexualPride",
      "id": "307827313",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827313/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827313/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827313/default/dark/3.0"
      },
      "start": 100,
      "end": 112
    },
    {
      "type": "twitch",
      "name": "AsexualPride",
      "id": "307827267",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307827267/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307827267/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307827267/default/dark/3.0"
      },
      "start": 114,
      "end": 125
    }
  ]],
]

// ---------------------------
//    Widget Initialization
// ---------------------------

window.addEventListener('onWidgetLoad', obj => {
  const main = $('main')
  window.setTimeout(_ => {
    Widget.width = main.innerWidth()
    Widget.height = main.innerHeight()
  }, 1000)

  loadFieldData(obj.detail.fieldData)

  if (FieldData.darkMode) main.addClass('dark-mode')
  else main.removeClass('dark-mode')
})

function loadFieldData(data) {
  FieldData = data
  processFieldData(
    value => stringToArray(value),
    'ignoreUserList',
    'ignorePrefixList',
    'allowUserList',
    'allowedStrings',
  )
  processFieldData(
    value => value === 'true',
    'includeEveryone',
    'includeSubs',
    'includeVIPs',
    'includeMods',
    'emoteOnly',
    'highlightOnly',
    'darkMode'
  )
}

function processFieldData(process, ...keys) {
  for (const key of keys) {
    FieldData[key] = process(FieldData[key])
  }
}

function stringToArray(string = '', separator = ',') {
  return string.split(separator).reduce((acc, value) => {
    const trimmed = value.trim()
    if (trimmed !== '') acc.push(trimmed)
    return acc
  }, [])
}

// --------------------
//    Event Handlers
// --------------------

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
    badges, emotes, msgId,
    userId, text, nick,
    displayColor: color,
    displayName: name,
  } = event.data

  // Filters
  if (FieldData.raidCooldown > 0 && !Widget.raidActive) return
  if (hasIgnoredPrefix(text)) return
  if (!passedMinMessageThreshold(userId)) return
  if (FieldData.allowUserList.length && !userListIncludes(FieldData.allowUserList, name, nick)) return
  if (userListIncludes(FieldData.ignoreUserList, name, nick)) return
  if (!hasIncludedBadge(badges)) return
  if (FieldData.allowedStrings.length && !FieldData.allowedStrings.includes(text)) return

  const messageType = getMessageType(event.data)
  if (FieldData.highlightOnly && messageType !== 'highlight') return

  const parsedText = parse(htmlEncode(text), emotes)
  const emoteSize = calcEmoteSize(parsedText)
  if (FieldData.emoteOnly && emoteSize === 1) return

  if (FieldData.messageCooldown) {
    if (Widget.cooldown) {
      return
    } else {
      Widget.cooldown = true
      window.setTimeout(() => { Widget.cooldown = false }, FieldData.messageCooldown * 1000)
    }
  }

  const elementData = {
    parsedText, name, emoteSize,
    messageType, msgId, userId,
    color,
  }

  // Render Bubble
  $('main').append(MessageComponent({ ...elementData }))
  const currentMessage = `.bubble[data-message-id=${msgId}]`

  // Calcute Bubble Position
  window.setTimeout(_ => {
    const height = $(currentMessage).outerHeight()
    const maxWidth = $(`${currentMessage} .message-wrapper`).width() + 1
    const minWidth = $(`${currentMessage} .username`).outerWidth()

    // I'm not entirely sure why the + 30 is necessary,
    // but it makes the calculations work correctly
    const [left, top] = calcPosition(Math.max(minWidth, maxWidth) + 30, height)

    $(`${currentMessage} .message`).css({
      '--dynamicWidth': Math.max(minWidth, maxWidth),
    })

    window.setTimeout(_ => {
      $(currentMessage).css({ left, top })
    }, 300)
  }, 300)

  // Show Bubble and Play Sound
  let sound = null
  if (FieldData.soundUrl) {
    sound = new Audio(FieldData.soundUrl)
    sound.volume = parseInt(FieldData.volume) / 100
  }

  window.setTimeout(_ => {
    if (FieldData.soundUrl) sound.play()
    $(currentMessage).addClass('animate')
    $(currentMessage).addClass(FieldData.animation)

    window.setTimeout(_ => {
      deleteMessage(msgId)
    }, FieldData.lifetime * 1000 )
  }, FieldData.delay * 1000)
}

function onRaid() {
  if (FieldData.raidCooldown === 0) return

  // Reset timer if another raid happens during an active raid timer
  clearTimeout(Widget.raidTimer)

  Widget.raidActive = true
  Widget.raidTimer = window.setTimeout(() => {
    Widget.raidActive = false
  }, FieldData.raidCooldown * 1000)
}

function deleteMessage(msgId) {
  $(`.bubble[data-message-id=${msgId}]`).remove()
}

function deleteMessages(userId) {
  $(`.bubble[data-user-id=${userId}]`).remove()
}

function onButton(event) {
  const { listener, field, value } = event

  if (listener !== 'widget-button' || value !== 'zaytri_dynamicchatbubbles') return

  switch(field) {
    case 'paddingButton': $('main').toggleClass('show-padding')
      break
    case 'testMessageButton': sendTestMessage()
      break
    default: return
  }
}

function sendTestMessage(amount = 1) {
  for (let i = 0; i < amount; i++) {
    window.setTimeout(_ => {
      const name = `user_${numbered.stringify(random(1, 100))}`.replace('-', '_')
      const event = {
        data: {
          userId: name,
          tags: {},
          text: 'test',
          displayName: name,
          nick: '',
          msgId: `${name}_${Date.now()}`,
        }
      }

      const previewMessage = FieldData.previewMessage.trim()
      if (previewMessage !== '') {
        event.data.text = previewMessage
      } else {
        const [text, emotes] = TEST_MESSAGES[random(0, TEST_MESSAGES.length - 1)]
        event.data.text = text
        event.data.emotes = emotes
      }

      let messageType = 1
      switch(FieldData.previewType) {
        case 'random': messageType = random(1, 3)
          break
        case 'action': messageType = 2
          break
        case 'highlight': messageType = 3
          break
        default: messageType = 1
      }

      if (messageType === 2) {
        event.data.isAction = true
      } else if (messageType === 3) {
        event.data.tags['msg-id'] = 'highlighted-message'
      }
      onMessage(event)
    }, i * 500)
  }
}

// -------------------------
//    Component Functions
// -------------------------

function MessageComponent(props) {
  const {
    parsedText, name, emoteSize,
    messageType, msgId, userId,
    color: userColor,
  } = props

  const color = userColor || generateColor(name)

  const tColor = tinycolor(color)
  const isDark = tColor.isDark()

  const parsedElements = parsedText.map(({ type, data }) => {
    switch(type) {
      case 'emote': return EmoteComponent(data, emoteSize)
      case 'text':
      default: return TextComponent(data)
    }
  })

  let containerClasses = ['bubble']
  switch (messageType) {
    case 'highlight': {
      if (FieldData.highlightStyle === 'rainbow') containerClasses.push('highlight')
      break
    }
    case 'action': {
      if (FieldData.actionStyle === 'italics') containerClasses.push('action')
      break
    }
    default: // nothing
  }

  if (isDark) containerClasses.push('user-color-dark')

  return Component('section', {
    class: containerClasses,
    style: { '--userColor': color },
    'data-message-id': msgId,
    'data-user-id': userId,
    children: [
      Component('div', { class: 'bubble-background' }),
      Component('div', { class: 'username-box', children:
        Component('p', { class: 'username', children: name })
      }),
      Component('div', { class: 'message', children:
        Component('span', { class: 'message-wrapper', children: parsedElements })
      }),
    ],
  })
}

function TextComponent(text) {
  return Component('span', { class: 'text', children: text })
}

function EmoteComponent({ urls: { '4': url }, name }, emoteSize = 1) {
  return Component('img', { class: ['emote', `emote-${emoteSize}`], src: url, alt: name })
}

function Component(tag, props) {
  const { children, 'class': classes, style, ...rest } = props

  if (classes) rest.class = joinIfArray(classes, ' ')

  if (style) rest.style = Object.entries(style)
    .map(([key, value]) => `${key}: ${value}`).join(';')

  const attributes = Object.entries(rest)
    .reduce((acc, [attr, value]) => `${acc} ${attr}='${value}'`, '')
  return `<${tag}${attributes}>${children !== undefined ? joinIfArray(children) : ''}</${tag}>`
}

// ---------------------
//    Helper Functions
// ---------------------

function hasIgnoredPrefix(text) {
  for (const prefix of FieldData.ignorePrefixList) {
    if (text.startsWith(prefix)) return true
  }
  return false
}

function passedMinMessageThreshold(userId) {
  if (FieldData.minMessages === 0) return true

  // begin counting
  if (!Widget.userMessageCount[userId]) Widget.userMessageCount[userId] = 0
  Widget.userMessageCount[userId]++

  return Widget.userMessageCount[userId] > FieldData.minMessages
}

function userListIncludes(userList, ...names) {
  const lowercaseNames = names.map(name => name.toLowerCase())
  for (const user of userList) {
    if (lowercaseNames.includes(user.toLowerCase())) return true
  }
  return false
}

function hasIncludedBadge(badges = []) {
  if (FieldData.includeEveryone) return true
  if (!badges.length) return false

  const includedBadges = ['broadcaster']

  if (FieldData.includeSubs) includedBadges.push('subscriber', 'founder')
  if (FieldData.includeVIPs) includedBadges.push('vip')
  if (FieldData.includeMods) includedBadges.push('moderator')

  for (const badge of badges) {
    if (includedBadges.includes(badge.type)) return true
  }

  return false
}

function getMessageType(data) {
  if (data.isAction) return 'action'
  if (data.tags['msg-id'] === 'highlighted-message') return 'highlight'
  return 'default'
}

function parse(text, emotes) {
  if (!emotes || emotes.length === 0) return [{ type: 'text', data: text }]

  const regex = createRegex(emotes.map(e => htmlEncode(e.name)))

  const textObjs = text.split(regex)
    .map(string => ({ type: 'text', data: string }))
  const last = textObjs.pop()

  const parsedText = textObjs.reduce((acc, textObj, index) => {
    return [...acc, textObj, { type: 'emote', data: emotes[index] }]
  }, [])

  parsedText.push(last)
  return parsedText
}

function calcEmoteSize(parsedText) {
  let emotesFound = 0
  for (const { type, data } of parsedText) {
    if (type === 'emote') {
      emotesFound++
      if (emotesFound > 1) return 2
    } else if (data.trim() !== '') return 1
  }
  return 4
}

// I have no idea how this works anymore but it does
// Regex is so useful but it's so confusing
// This is all to parse out the emote text
const createRegex = strings => {
  const regexStrings = strings.sort().reverse()
    .map(string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = `(?<=\\s|^)(?:${regexStrings.join('|')})(?=\\s|$|[.,!])`
  return new RegExp(regex, 'g')
}

function generateColor(name) {
  if (!name) return DEFAULT_COLORS[0]
  const value = name.split('').reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
  return DEFAULT_COLORS[value % DEFAULT_COLORS.length]
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function calcPosition(width, height) {
  const { padding } = FieldData
  return [
    random(padding, Math.max(padding, Widget.width - padding - width)),
    random(padding, Math.max(padding, Widget.height - padding - height)),
  ]
}

function joinIfArray(possibleArray, delimiter = '') {
  if (Array.isArray(possibleArray)) return possibleArray.join(delimiter)
  return possibleArray
}

function htmlEncode(text) {
  return text.replace(/[\<\>\"\'\^\=]/g, char => `&#${char.charCodeAt(0)};`)
}