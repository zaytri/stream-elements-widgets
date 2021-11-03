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
  soundEffects: [],
}

// ---------------------------
//    Widget Initialization
// ---------------------------

window.addEventListener('onWidgetLoad', obj => {
  loadFieldData(obj.detail.fieldData)

  conditionalMainClass('dark-mode', FieldData.darkMode)
  conditionalMainClass('custom-message-colors', FieldData.useCustomMessageColors)
  conditionalMainClass('custom-border-colors', FieldData.useCustomBorderColors)

  if (FieldData.previewMode) sendTestMessage(10, 500)
})

function loadFieldData(data) {
  FieldData = data

  const specificUsersSoundGroups = Array(10).fill('specificUsersSoundGroup').map((text, i) => `${text}${i + 1}`)
  processFieldData(
    value => stringToArray(value),
    'ignoreUserList',
    'ignorePrefixList',
    'allowUserList',
    'allowedStrings',
    ...specificUsersSoundGroups
  )

  processFieldData(
    value => value === 'true',
    'includeEveryone',
    'includeSubs',
    'includeVIPs',
    'includeMods',
    'emoteOnly',
    'highlightOnly',
    'darkMode',
    'useCustomMessageColors',
    'useCustomBorderColors',
    'previewMode',
  )

  const soundData = {}
  for (let i = 1; i <= 10; i++) {
    const group = FieldData[`soundGroup${i}`]
    const specificUsers = FieldData[`specificUsersSoundGroup${i}`]
    const isSpecific = specificUsers.length > 0
    // specific-index so multiple specifics don't override each other
    const userLevel = isSpecific ? `specific-${i}` : FieldData[`userLevelSoundGroup${i}`]
    const messageType = FieldData[`messageTypeSoundGroup${i}`]
    if (group && group.length > 0) {
      if (!soundData[userLevel]) {
        soundData[userLevel] = {}
      }

      if (isSpecific) {
        soundData[userLevel].users = specificUsers
      }

      if (!soundData[userLevel][messageType]) {
        soundData[userLevel][messageType] = []
      }

      soundData[userLevel][messageType].push(...group)
    }
  }

  Widget.soundEffects = Object.entries(soundData).reduce((acc, entry) => {
    const [userLevel, { users, ...messageTypes }] = entry
    for (const [messageType, soundEffects] of Object.entries(messageTypes)) {
      acc.push({
        userLevel, messageType, soundEffects, users,
        order: soundSortOrder(userLevel, messageType)
      })
    }
    return [...acc]
  }, []).sort(({ order: a }, { order: b }) => {
    // sort by userLevel (0) then by messageType (1)
    if (a[0] !== b[0]) return b[0] - a[0]
    else return b[1] - a[1]
  })
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

function conditionalMainClass(className, condition = true) {
  const main = $('main')

  if (condition) main.addClass(className)
  else main.removeClass(className)
}

function soundSortOrder(userLevel, messageType) {
  return [userLevelSortOrder(userLevel), messageTypeSortOrder(messageType)]
}

function userLevelSortOrder(userLevel) {
  switch (userLevel) {
    case 'everyone': return 0
    case 'subs': return 100
    case 'vips': return 200
    case 'mods': return 300
    default: return 1000 // assume specific
  }
}

function messageTypeSortOrder(messageType) {
  switch (messageType) {
    case 'highlight': return 1000
    case 'action': return 500
    case 'default': return 100
    default: return 0 // assume all
  }
}

// --------------------
//    Event Handlers
// --------------------

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail
  switch(listener) {
    case 'message': onMessage(event)
      break
    case 'raid-latest': onRaid(event)
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
  if (FieldData.raidCooldown < 0 && Widget.raidActive) return
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
  $('main').prepend(MessageComponent({ ...elementData }))
  const currentMessage = `.bubble[data-message-id="${msgId}"]`

  // Calcute Bubble Position
  window.setTimeout(_ => {
    const height = $(currentMessage).outerHeight()
    const maxWidth = $(`${currentMessage} .message-wrapper`).width() + 1
    const minWidth = $(`${currentMessage} .username`).outerWidth()

    $(`${currentMessage} .message`).css({
      '--dynamicWidth': Math.max(minWidth, maxWidth),
    })

    if (FieldData.positionMode === 'random') {
      // I'm not entirely sure why the + 30 is necessary,
      // but it makes the calculations work correctly
      const [left, top] = calcPosition(Math.max(minWidth, maxWidth) + 30, height)

      window.setTimeout(_ => {
        $(currentMessage).css({ left, top })
      }, 300)
    }
  }, 300)

  // Show Bubble and Play Sound
  let sound = null
  const soundUrls = getSound(nick, name, badges, messageType)
  if (soundUrls) {
    sound = new Audio(soundUrls[random(0, soundUrls.length - 1)])
    sound.volume = parseInt(FieldData.volume) / 100
  }

  window.setTimeout(_ => {
    if (soundUrls) sound.play()
    $(currentMessage).addClass('animate')
    $(currentMessage).addClass(FieldData.animation)
    if (FieldData.positionMode === 'list') $(currentMessage).css({ position: 'relative' })

    window.setTimeout(_ => {
      deleteMessage(msgId)
    }, FieldData.lifetime * 1000 )
  }, FieldData.delay * 1000)
}

function onRaid(event) {
  if (FieldData.raidCooldown === 0) return
  if (event.amount < FieldData.raidMin) return

  // Reset timer if another raid happens during an active raid timer
  clearTimeout(Widget.raidTimer)

  Widget.raidActive = true
  Widget.raidTimer = window.setTimeout(() => {
    Widget.raidActive = false
  }, Math.abs(FieldData.raidCooldown) * 1000)
}

function deleteMessage(msgId) {
  $(`.bubble[data-message-id="${msgId}"]`).remove()
}

function deleteMessages(userId) {
  $(`.bubble[data-user-id="${userId}"]`).remove()
}

function onButton(event) {
  const { listener, field, value } = event

  if (listener !== 'widget-button' || value !== 'zaytri_dynamicchatbubbles') return

  switch(field) {
    case 'testMessageButton': sendTestMessage()
      break
    default: return
  }
}

function sendTestMessage(amount = 1, delay = 250) {
  for (let i = 0; i < amount; i++) {
    window.setTimeout(_ => {
      const name = `user_${numbered.stringify(random(1, 10))}`.replace('-', '_')
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
    }, i * delay)
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
  return userList.some(user => lowercaseNames.includes(user.toLowerCase()))
}

function hasIncludedBadge(badges = []) {
  if (FieldData.includeEveryone) return true
  if (!badges.length) return false

  const includedBadges = ['broadcaster']

  if (FieldData.includeSubs) includedBadges.push('subscriber', 'founder')
  if (FieldData.includeVIPs) includedBadges.push('vip')
  if (FieldData.includeMods) includedBadges.push('moderator')

  return hasBadge(badges, ...includedBadges)
}

function isMod(badges = []) {
  return hasBadge(badges, 'moderator', 'broadcaster')
}

function isVIP(badges = []) {
  return hasBadge(badges, 'vip', 'broadcaster')
}

function isSub(badges = []) {
  return hasBadge(badges, 'subscriber', 'founder', 'broadcaster')
}

function hasBadge(userBadges = [], ...badgeTypes) {
  return userBadges.some(({ type }) => badgeTypes.includes(type))
}

function getMessageType(data) {
  if (data.isAction) return 'action'
  if (data.tags['msg-id'] === 'highlighted-message') return 'highlight'
  return 'default'
}

function getSound(nick, name, badges, messageType) {
  for (const soundGroup of Widget.soundEffects) {
    const { userLevel, messageType: soundMessageType, users = [], soundEffects } = soundGroup
    if (soundMessageType === 'all' || soundMessageType === messageType) {
      switch(userLevel) {
        case 'everyone': return soundEffects
        case 'subs': if (isSub(badges)) return soundEffects
          break
        case 'vips': if (isVIP(badges)) return soundEffects
          break
        case 'mods': if (isMod(badges)) return soundEffects
          break
        // assume specific
        default: if (userListIncludes(users, nick, name)) return soundEffects
          break
      }
    }
  }
  return null
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
  const main = $('main')
  const widgetWidth = main.innerWidth()
  const widgetHeight = main.innerHeight()
  const { padding } = FieldData
  return [
    random(padding, Math.max(padding, widgetWidth - padding - width)),
    random(padding, Math.max(padding, widgetHeight - padding - height)),
  ]
}

function joinIfArray(possibleArray, delimiter = '') {
  if (Array.isArray(possibleArray)) return possibleArray.join(delimiter)
  return possibleArray
}

const TEST_MESSAGES = [
  ['HYPE'],
  ['uwu'],
  ['popCat', [
    {
      "type": "bttv",
      "name": "popCat",
      "id": "60d5abc38ed8b373e421952f",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/60d5abc38ed8b373e421952f/1x",
        "2": "https://cdn.betterttv.net/emote/60d5abc38ed8b373e421952f/2x",
        "4": "https://cdn.betterttv.net/emote/60d5abc38ed8b373e421952f/3x"
      },
      "start": 0,
      "end": 6
    }
  ]],
  ['catHYPE hypeE catHYPE', [
    {
      "type": "bttv",
      "name": "catHYPE",
      "id": "6090e9cc39b5010444d0b3ff",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/1x",
        "2": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/2x",
        "4": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/3x"
      },
      "start": 0,
      "end": 7
    },
    {
      "type": "bttv",
      "name": "hypeE",
      "id": "5b6ded5560d17f4657e1319e",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/5b6ded5560d17f4657e1319e/1x",
        "2": "https://cdn.betterttv.net/emote/5b6ded5560d17f4657e1319e/2x",
        "4": "https://cdn.betterttv.net/emote/5b6ded5560d17f4657e1319e/3x"
      },
      "start": 8,
      "end": 13
    },
    {
      "type": "bttv",
      "name": "catHYPE",
      "id": "6090e9cc39b5010444d0b3ff",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/1x",
        "2": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/2x",
        "4": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/3x"
      },
      "start": 14,
      "end": 21
    }
  ]],
  ['zaytriLOVE', [
    {
      "type": "twitch",
      "name": "zaytriLOVE",
      "id": "307974105",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/307974105/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/307974105/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/307974105/default/dark/3.0"
      },
      "start": 0,
      "end": 9
    }
  ]],
  ['D: D: D:', [
    {
      "type": "bttv",
      "name": "D:",
      "id": "55028cd2135896936880fdd7",
      "gif": false,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/1x",
        "2": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/2x",
        "4": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/3x"
      },
      "start": 0,
      "end": 2
    },
    {
      "type": "bttv",
      "name": "D:",
      "id": "55028cd2135896936880fdd7",
      "gif": false,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/1x",
        "2": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/2x",
        "4": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/3x"
      },
      "start": 3,
      "end": 5
    },
    {
      "type": "bttv",
      "name": "D:",
      "id": "55028cd2135896936880fdd7",
      "gif": false,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/1x",
        "2": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/2x",
        "4": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/3x"
      },
      "start": 6,
      "end": 8
    }
  ]],
  ['SCREME', [
    {
      "type": "bttv",
      "name": "SCREME",
      "id": "5fea41766b06e834ffd76103",
      "gif": true,
      "urls": {
        "1": "https://cdn.betterttv.net/emote/5fea41766b06e834ffd76103/1x",
        "2": "https://cdn.betterttv.net/emote/5fea41766b06e834ffd76103/2x",
        "4": "https://cdn.betterttv.net/emote/5fea41766b06e834ffd76103/3x"
      },
      "start": 0,
      "end": 6
    }
  ]],
  ['toad sings but make it nightcore zaytriSCREME', [
    {
      "type": "twitch",
      "name": "zaytriSCREME",
      "id": "305161229",
      "gif": false,
      "urls": {
        "1": "https://static-cdn.jtvnw.net/emoticons/v2/305161229/default/dark/1.0",
        "2": "https://static-cdn.jtvnw.net/emoticons/v2/305161229/default/dark/2.0",
        "4": "https://static-cdn.jtvnw.net/emoticons/v2/305161229/default/dark/3.0"
      },
      "start": 33,
      "end": 44
    }
  ]],
  ['bobDance bobDance bobDance', [
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
    },
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
      "start": 9,
      "end": 17
    },
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
      "start": 18,
      "end": 26
    }
  ]],
  ['bongoTap', [
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
    }
  ]],
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
]

function htmlEncode(text) {
  return text.replace(/[\<\>\"\'\^\=]/g, char => `&#${char.charCodeAt(0)};`)
}