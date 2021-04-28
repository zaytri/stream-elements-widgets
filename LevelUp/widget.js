/*
  If someone wants to make this work with other events, such as follows/subs/bits,
  feel free to do so. Just note that StreamElements doesn't send userIds for those
  events, so you'll have to change the db to also use names as keys. You will still
  want to save the userId in there due to the delete-messages even to handle bans.
*/

const db = {}
const FieldData = {
  ignoreList: [],
  messagesPerMin: 100,
  charMin: 0,
  rankCount: 5,
  initialLevelXP: 10,
  xpIncrease: 10,
  minXP: 1,
  maxXP: 1,
  ignoreCommands: true,
}

const EVENT = {
  MESSAGE: 'message',
  DELETE_MESSAGES: 'delete-messages',
}

const DEFAULT_EMOTE = 'https://static-cdn.jtvnw.net/emoticons/v1/112290/3.0'

// ----------------
//    Initialize
// ----------------

window.addEventListener('onWidgetLoad', obj => {
  const { fieldData } = obj.detail

  loadFieldData(fieldData)

  for (let i = 0; i < FieldData.rankCount; i++) {
    $('main').append(RankComponent(i))
  }

  render()
})

function loadFieldData(data) {
  FieldData.allow = stringToArray(data.allow)
  FieldData.ignoreList = stringToArray(data.ignoreList)
  FieldData.messagesPerMin = data.messagesPerMin
  FieldData.charMin = data.charMin
  FieldData.rankCount = data.rankCount
  FieldData.initialLevelXP = data.initialLevelXP
  FieldData.xpIncrease = data.xpIncrease
  // using Math.min and Math.max in case the user switches them for some reason
  FieldData.minXP = Math.min(data.minXP, data.maxXP)
  FieldData.maxXP = Math.max(data.minXP, data.maxXP)
  FieldData.ignoreCommands = data.ignoreCommands === 'true'
}

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail

  const { userId, displayName: name } = event.data
  if (!db[userId]) db[userId] = new User(userId, name)

  switch(listener) {
    case EVENT.MESSAGE: onMessage(event)
      break
    case EVENT.DELETE_MESSAGES: deleteMessages(event)
    default: return
  }
})

// --------------------
//    Event Handlers
// --------------------

// if someone is banned, remove them from leaderboard
function deleteMessages(event) {
  delete db[event.userId]

  render()
}

function onMessage(event) {
  const {
    displayName: name,
    nick, userId, emotes = [],
    text,
  } = event.data

  if (text.startsWith('!')) return

  let charCount = text.length
  for (const emote of emotes) {
     // Count emotes as 1 character
    charCount -= emote.name.length - 1
  }

  if (charCount < FieldData.charMin) return
  if (isIgnored(name, nick)) return

  if (emotes.length > 0) {
    const lastEmote = emotes[emotes.length - 1]
    db[userId].emote = lastEmote.urls['4'] || lastEmote.urls['1'] || db[userId].emote
  }

  if (db[userId].addXP(EVENT.MESSAGE)) render()
}

// ------------------------------------------
//    User Class (Handles XP and Leveling)
// ------------------------------------------

class User {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.xp = 0
    this.level = 1
    this.nextLevelXP = FieldData.initialLevelXP
    this.messagesLastMinute = 0
    this.emote = DEFAULT_EMOTE
  }

  addMessage() {
    this.messagesLastMinute++
    window.setTimeout(() => { this.messagesLastMinute-- }, 60000)
  }

  /*
    [Level XP Guide]
    x = FieldData.initialLevelXP
    y = FieldData.xpIncrease

    Levels  | 10x, 10y | 10x, 2y | 2x, 10y |
    lv1 - 2 | 10 XP    | 10 XP   | 2 XP    |
    lv2 - 3 | 20 XP    | 12 XP   | 12 XP   |
    lv3 - 4 | 30 XP    | 14 XP   | 22 XP   |
    lv4 - 5 | 40 XP    | 16 XP   | 32 XP   |
    lv5 - 6 | 50 XP    | 18 XP   | 42 XP   |
    etc...
  */

  // Can be expanded to other event types
  addXP(eventType) {
    let amount = 0
    switch(eventType) {
      case EVENT.MESSAGE:
        if (this.messagesLastMinute > FieldData.messagesPerMin) {
          return false
        } else {
          amount = random(FieldData.minXP, FieldData.maxXP)
          this.messagesLastMinute++
          window.setTimeout(() => { this.messagesLastMinute-- }, 60000)
          break
        }
      default: return false
    }

    this.xp += amount

    while (this.xp >= this.nextLevelXP) {
      render() // Allows XP bar to fill before resetting
      this.level++
      this.xp -= this.nextLevelXP
      this.nextLevelXP += FieldData.xpIncrease
    }

    return true
  }

  get xpPercentage() {
    return this.xp / this.nextLevelXP * 100
  }
}

// ------------
//    Render
// ------------

function render() {
  const topRanks = Object.values(db)
  	.sort((a, b) => b.level - a.level || b.xp - a.xp)
  	.slice(0, FieldData.rankCount)
  	.filter(rank => rank.level > 1 || rank.xp > 0)

  for (let i = 0; i < FieldData.rankCount; i++) {
    const rank = topRanks[i]
    const rankSelector = `#rank-${i}`
    if (rank) {
      const { name, level, xpPercentage, emote } = rank
      $(rankSelector).show()
      $(`${rankSelector} .level`).text(`Lv ${level}`)
      $(`${rankSelector} .username`).text(name)
      $(`${rankSelector} .xp`).animate({ width: `${xpPercentage}%` })
      $(`${rankSelector} .emote`).attr({ src: emote || DEFAULT_EMOTE })
    } else {
      $(rankSelector).hide()
    }
  }
}

// -------------------------
//    Component Functions
// -------------------------

function RankComponent(id) {
  return Component('div', {
    id: `rank-${id}`,
    class: 'rank',
    children: [
      Component('p', { class: 'level', children: 'Lv1' }),
      Component('div', {
        class: 'xp-container',
        children: Component('div', {
          class: 'xp',
          children: Component('p', { class: 'username', children: 'Chat' }),
        }),
      }),
      Component('div', {
        class: 'emote-container',
        children: Component('img', { class: 'emote', src: DEFAULT_EMOTE }),
      }),
    ],
  })
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

function joinIfArray(possibleArray, delimiter = '') {
  if (Array.isArray(possibleArray)) return possibleArray.join(delimiter)
  return possibleArray
}

// ----------------------
//    Helper Functions
// ----------------------

function stringToArray(string = '', separator = ',') {
  return string.split(separator).reduce((acc, value) => {
    const trimmed = value.trim()
    if (trimmed !== '') acc.push(trimmed)
    return acc
  }, [])
}

const namesInList = type => (...names) => {
  const lowercaseNames = names.map(name => name.toLowerCase())
  let list = []
  switch (type) {
    case 'allow': list = FieldData.allow
      break
    case 'block': list = FieldData.block
      break
    default: return false
  }
  for (const user of list) {
    if (lowercaseNames.includes(user.toLowerCase())) return true
  }
  return false
}

function isIgnored(...names) {
  const lowercaseNames = names.map(name => name.toLowerCase())
  for (const ignored of FieldData.ignoreList) {
    if (lowercaseNames.includes(ignored.toLowerCase())) return true
  }
  return false
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min
}