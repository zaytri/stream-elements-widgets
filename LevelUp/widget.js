/*
  If someone wants to make this work with other events, such as follows/subs/bits,
  feel free to do so. Just note that StreamElements doesn't send userIds for those
  events, so you'll have to change the db to use names as keys.
*/

let db = {}
let jebaitedAPI
let validToken = false

const DEFAULT_EMOTE = 'https://i.imgur.com/FHHwNqT.png'

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
  test: false,
  levelPrefix: 'Lv',
  layout: '1',
  defaultEmote: DEFAULT_EMOTE,
  apiToken: 'Copy/paste API token here',
  enabledAdvanced: false,
  removeCommand: '!deleterank',
  rankCommand: '!rank',
  rankCommandCooldown: 60,
  useCustomImages: false,
  importData: null,
}

const themeData = {}

function prefix(key) {
  return `zaytri_chatleaderboard_${key}`
}

function removePrefix(key) {
  return key.split('_').pop()
}

const themeKeys = [
  'layout',
  'defaultEmote',
  'levelPrefix',
  'mainBackgroundColor',
  'mainBorderColor',
  'mainBorderWidth',
  'mainBorderRadius',
  'mainPadding',
  'mainInnerShadowColor',
  'mainInnerShadowOffset',
  'mainInnerShadowBlur',
  'mainInnerShadowSpread',
  'rankBackgroundColor',
  'rankBorderColor',
  'rankBorderWidth',
  'rankBorderRadius',
  'rankPadding',
  'rankMargin',
  'rankInnerShadowColor',
  'rankInnerShadowOffset',
  'rankInnerShadowBlur',
  'rankInnerShadowSpread',
  'rankOuterShadowColor',
  'rankOuterShadowOffset',
  'rankOuterShadowBlur',
  'rankOuterShadowSpread',
  'levelBoxBackgroundColor',
  'levelBoxBorderColor',
  'levelBoxBorderWidth',
  'levelBoxBorderRadius',
  'levelBoxPadding',
  'levelBoxMargin',
  'levelBoxInnerShadowColor',
  'levelBoxInnerShadowOffset',
  'levelBoxInnerShadowBlur',
  'levelBoxInnerShadowSpread',
  'levelBoxOuterShadowColor',
  'levelBoxOuterShadowOffset',
  'levelBoxOuterShadowBlur',
  'levelBoxOuterShadowSpread',
  'levelColor',
  'levelFont',
  'levelSize',
  'levelWeight',
  'levelShadowColor',
  'levelShadowOffset',
  'levelShadowBlur',
  'usernameBoxBackgroundColor',
  'usernameBoxBorderColor',
  'usernameBoxBorderWidth',
  'usernameBoxBorderRadius',
  'usernameBoxPadding',
  'usernameBoxMargin',
  'usernameBoxInnerShadowColor',
  'usernameBoxInnerShadowOffset',
  'usernameBoxInnerShadowBlur',
  'usernameBoxInnerShadowSpread',
  'usernameBoxOuterShadowColor',
  'usernameBoxOuterShadowOffset',
  'usernameBoxOuterShadowBlur',
  'usernameBoxOuterShadowSpread',
  'usernameColor',
  'usernameFont',
  'usernameSize',
  'usernameWeight',
  'usernameShadowColor',
  'usernameShadowOffset',
  'usernameShadowBlur',
  'xpBoxBackgroundColor',
  'xpBoxBorderColor',
  'xpBoxBorderWidth',
  'xpBoxBorderRadius',
  'xpBoxPadding',
  'xpBoxMargin',
  'xpBoxMinHeight',
  'xpBoxInnerShadowColor',
  'xpBoxInnerShadowOffset',
  'xpBoxInnerShadowBlur',
  'xpBoxInnerShadowSpread',
  'xpBoxOuterShadowColor',
  'xpBoxOuterShadowOffset',
  'xpBoxOuterShadowBlur',
  'xpBoxOuterShadowSpread',
  'xpBackgroundColor',
  'xpBorderColor',
  'xpBorderWidth',
  'xpBorderRadius',
  'xpPadding',
  'xpMargin',
  'xpInnerShadowColor',
  'xpInnerShadowOffset',
  'xpInnerShadowBlur',
  'xpInnerShadowSpread',
  'xpOuterShadowColor',
  'xpOuterShadowOffset',
  'xpOuterShadowBlur',
  'xpOuterShadowSpread',
  'emoteBoxBackgroundColor',
  'emoteBoxBorderColor',
  'emoteBoxBorderWidth',
  'emoteBoxBorderRadius',
  'emoteBoxPadding',
  'emoteBoxMargin',
  'emoteBoxMinHeight',
  'emoteBoxInnerShadowColor',
  'emoteBoxInnerShadowOffset',
  'emoteBoxInnerShadowBlur',
  'emoteBoxInnerShadowSpread',
  'emoteBoxOuterShadowColor',
  'emoteBoxOuterShadowOffset',
  'emoteBoxOuterShadowBlur',
  'emoteBoxOuterShadowSpread',
  'emoteSize',
  'emoteShadowColor',
  'emoteShadowOffset',
  'emoteShadowBlur',
].map(prefix)

const EVENT = {
  MESSAGE: 'message',
  DELETE_MESSAGES: 'delete-messages',
  TEST: 'event:test',
}


// ----------------
//    Initialize
// ----------------

window.addEventListener('onWidgetLoad', obj => {
  const { fieldData } = obj.detail

  loadFieldData(fieldData)

  if (FieldData.enableAdvanced) loadAPI()

  for (let i = 0; i < FieldData.rankCount; i++) {
    $('main').append(RankComponent(i + 1))
  }

  render()
})

function loadFieldData(data) {
  FieldData.allow = stringToArray(data[prefix('allow')])
  FieldData.ignoreList = stringToArray(data[prefix('ignoreList')])
  FieldData.messagesPerMin = data[prefix('messagesPerMin')]
  FieldData.charMin = data[prefix('charMin')]
  FieldData.rankCount = data[prefix('rankCount')]
  FieldData.initialLevelXP = data[prefix('initialLevelXP')]
  FieldData.xpIncrease = data[prefix('xpIncrease')]
  // using Math.min and Math.max in case the user switches them for some reason
  FieldData.minXP = Math.min(data[prefix('minXP')], data[prefix('maxXP')])
  FieldData.maxXP = Math.max(data[prefix('minXP')], data[prefix('maxXP')])
  FieldData.ignoreCommands = data[prefix('ignoreCommands')] === 'true'
  FieldData.levelPrefix = data[prefix('levelPrefix')]
  FieldData.layout = data[prefix('layout')]
  FieldData.defaultEmote = data[prefix('defaultEmote')] || DEFAULT_EMOTE
  FieldData.apiToken = data[prefix('apiToken')]
  FieldData.enableAdvanced = data[prefix('enableAdvanced')] === 'true'
  FieldData.removeCommand = data[prefix('removeCommand')]
  FieldData.rankCommand = data[prefix('rankCommand')]
  FieldData.rankCommandCooldown = data[prefix('rankCommandCooldown')]
  FieldData.useCustomImages = data[prefix('useCustomImages')] === 'true'
  try {
    const importData = JSON.parse(data[prefix('importData')])
    FieldData.importData = importData
  } catch (e) {
    FieldData.importData = null
  }

  for (const key of themeKeys) themeData[key] = data[key]
}

function loadAPI() {
  jebaitedAPI = new Jebaited(FieldData.apiToken)
  jebaitedAPI.getAvailableScopes().then(scopes => {
    if (scopes.includes('botMsg')) {
      validToken = true
    } else {
      $('main').prepend(ErrorComponent('Missing botMsg scope'))
    }
  }).catch(errorEvent => $('main').prepend(ErrorComponent(errorEvent.error)))
}

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail

  switch(listener) {
    case EVENT.MESSAGE: onMessage(event)
      break
    case EVENT.DELETE_MESSAGES: deleteMessages(event)
      break
    case EVENT.TEST: onButton(event)
      break
    default: return
  }
})

// --------------------
//    Event Handlers
// --------------------

function onMessage(event) {
  const {
    displayName: name,
    nick, userId, emotes = [],
    text, badges,
  } = event.data

  if (db[userId] && FieldData.enableAdvanced && validToken && text.startsWith(FieldData.rankCommand)) {
    db[userId].rankCommand()
    return
  }

  if (isMod(badges) && text.startsWith(FieldData.removeCommand)) {
    const userToRemove = text.split(' ')[1]
    const idToRemove = Object.values(db).find(user => user.name.toLowerCase() === userToRemove.toLowerCase()).id

    if (idToRemove) {
      delete db[idToRemove]
      render()
    }

    return
  }

  if (FieldData.ignoreCommands && text.startsWith('!')) return

  let charCount = text.length
  for (const emote of emotes) {
     // Count emotes as 1 character
    charCount -= emote.name.length - 1
  }

  if (charCount < FieldData.charMin) return
  if (isIgnored(name, nick)) return

  if (!db[userId]) db[userId] = new User(userId, name)

  if (emotes.length > 0) {
    const lastEmote = emotes[emotes.length - 1]
    db[userId].emote = lastEmote.urls['4'] || lastEmote.urls['1'] || db[userId].emote
  }

  if (db[userId].addXP(EVENT.MESSAGE)) render()
}

function deleteMessages(userId) {
  delete db[userId]
  render()
}

function onButton(event) {
  const { listener, field, value } = event
  if (listener !== 'widget-button' || value !== 'zaytri_chatleaderboard') return

  switch(removePrefix(field)) {
    case 'testButton': {
      db = {}
      render()
      FieldData.test = !FieldData.test

      if (FieldData.test) {
        for (let i = 1; i <= FieldData.rankCount; i++) {
          db[i] = new User(i, `user ${numbered.stringify(i)}`.replace(' ', '_'))
          for (let j = 0; j < ((FieldData.initialLevelXP * 2 / FieldData.minXP) / i) + 2; j++) {
            db[i].addXP(EVENT.MESSAGE)
          }
        }
      }

      render()
      break
    }

    case 'importButton': {
      importThemeData()
      break
    }

    case 'exportButton': {
      exportThemeData()
      break
    }

    default: return
  }
}

function importThemeData() {
  if (!FieldData.importData) {
    SE_API.setField(prefix('importData'), 'Error: Invalid Theme Data!')
  } else {
    for (const key of themeKeys) {
      const value = FieldData.importData[key]
      if (typeof value !== 'undefined') SE_API.setField(key, value)
    }
  	SE_API.setField(prefix('importData'), 'Import Successful!')
  }
}

function exportThemeData() {
  SE_API.setField(prefix('exportData'), JSON.stringify(themeData))
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
    this.emote = FieldData.defaultEmote
    this.rankCommandInCooldown = false
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
        if (this.messagesLastMinute >= FieldData.messagesPerMin) {
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
      render() // Completely fill XP bar
      this.level++
      const leftoverXP = this.xp - this.nextLevelXP
      this.xp = 0
      render() // Empty XP bar
      this.xp = leftoverXP
      this.nextLevelXP += FieldData.xpIncrease
    }

    return true
  }

  get xpPercentage() {
    return this.xp / this.nextLevelXP * 100
  }

  rankCommand() {
    if (FieldData.rankCommandCooldown > 0) {
      if (this.rankCommandInCooldown) return
      this.rankCommandInCooldown = true
      window.setTimeout(() => { this.rankCommandInCooldown = false }, 1000 * FieldData.rankCommandCooldown)
    }

    const rank = Object.values(db)
      .sort((a, b) => b.level - a.level || b.xp - a.xp)
      .findIndex(rank => rank.id === this.id) + 1

    jebaitedAPI.sayMessage(`${this.name} is Rank ${rank}! [Level: ${this.level} XP: ${Math.floor(this.xpPercentage)}%]`)
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
    const rankSelector = `#rank-${i + 1}`
    if (rank) {
      const { name, level, xpPercentage, emote } = rank
      $(rankSelector).show()
      $(`${rankSelector} .level`).text(`${FieldData.levelPrefix} ${level}`.trim())
      $(`${rankSelector} .username`).text(name)
      $(`${rankSelector} .xp`).animate({ width: `${xpPercentage}%` })
      if (!FieldData.useCustomImages) {
        $(`${rankSelector} .emote`).css({ 'backgroundImage': `url(${emote || DEFAULT_EMOTE})` })
      }
    } else {
      $(`${rankSelector} .xp`).css({ width: '0%' })
      $(rankSelector).hide()
    }
  }
}

// -------------------------
//    Component Functions
// -------------------------

function RankComponent(id) {
  return Component('div', { id: `rank-${id}`, class: 'rank', children: LayoutComponent() })
}

function LayoutComponent() {
  switch(FieldData.layout) {
    case '1': return Layout1()
    case '2': return Layout2()
    case '3': return Layout3()
    case '4': return Layout4()
    case '5': return Layout5()
    case '6': return Layout6()
    case '7': return Layout7()
    case '8': return Layout8()
    case '9': return Layout9()
    case '10': return Layout10()
    default: []
  }
}

function Layout1() {
  return [
    EmoteBoxComponent(EmoteComponent()),
    ColumnComponent([
      RowComponent([
        UsernameBoxComponent(UsernameComponent()),
        LevelBoxComponent(LevelComponent()),
      ]),
      RowComponent(XPBoxComponent(XPComponent()))
    ]),
  ]
}

function Layout2() {
  return [
    LevelBoxComponent(LevelComponent()),
    ColumnComponent([
      RowComponent([
        UsernameBoxComponent(UsernameComponent()),
        EmoteBoxComponent(EmoteComponent()),
      ]),
      RowComponent(XPBoxComponent(XPComponent()))
    ]),
  ]
}

function Layout3() {
  return [
    ColumnComponent([
      RowComponent([
        EmoteBoxComponent(EmoteComponent()),
        RowComponent([
          UsernameBoxComponent(UsernameComponent()),
          LevelBoxComponent(LevelComponent()),
        ]),
      ]),
      RowComponent(XPBoxComponent(XPComponent()))
    ]),
  ]
}

function Layout4() {
  return [
    ColumnComponent([
      RowComponent([
        LevelBoxComponent(LevelComponent()),
        RowComponent([
          UsernameBoxComponent(UsernameComponent()),
          EmoteBoxComponent(EmoteComponent()),
        ]),
      ]),
      RowComponent(XPBoxComponent(XPComponent()))
    ]),
  ]
}

function Layout5() {
  return XPBoxComponent([
    Component('div', { class: ['xp', 'absolute'] }),
    EmoteBoxComponent(EmoteComponent()),
    RowComponent([
      UsernameBoxComponent(UsernameComponent()),
      LevelBoxComponent(LevelComponent()),
    ]),
  ])
}

function Layout6() {
  return XPBoxComponent([
    Component('div', { class: ['xp', 'absolute'] }),
    LevelBoxComponent(LevelComponent()),
    RowComponent([
      UsernameBoxComponent(UsernameComponent()),
      EmoteBoxComponent(EmoteComponent()),
    ]),
  ])
}

function Layout7() {
  return [
    LevelBoxComponent(LevelComponent()),
    EmoteBoxComponent(EmoteComponent()),
    UsernameBoxComponent(UsernameComponent()),
    XPBoxComponent(XPComponent()),
  ]
}

function Layout8() {
  return [
    EmoteBoxComponent(EmoteComponent()),
    LevelBoxComponent(LevelComponent()),
    UsernameBoxComponent(UsernameComponent()),
    XPBoxComponent(XPComponent()),
  ]
}

function Layout9() {
  return [
    EmoteBoxComponent(EmoteComponent()),
    UsernameBoxComponent(UsernameComponent()),
    XPBoxComponent(XPComponent()),
    LevelBoxComponent(LevelComponent()),
  ]
}

function Layout10() {
  return [
    LevelBoxComponent(LevelComponent()),
    UsernameBoxComponent(UsernameComponent()),
    XPBoxComponent(XPComponent()),
    EmoteBoxComponent(EmoteComponent()),
  ]
}

const ClassComponent = (tag, className) => (children, props = {}) => Component(tag, { children, class: className, ...props })
const LevelBoxComponent = ClassComponent('div', 'level-box')
const LevelComponent = ClassComponent('p', 'level')
const EmoteBoxComponent = ClassComponent('div', 'emote-box')
const EmoteComponent = ClassComponent('div', 'emote')
const UsernameBoxComponent = ClassComponent('div', 'username-box')
const UsernameComponent = ClassComponent('p', 'username')
const XPBoxComponent = ClassComponent('div', 'xp-box')
const XPComponent = ClassComponent('div', 'xp')
const RowComponent = ClassComponent('div', 'row')
const ColumnComponent = ClassComponent('div', 'column')
const ErrorComponent = ClassComponent('p', 'error')

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

function isMod(badges) {
  for (const badge of badges) {
    const { type } = badge
    if (type === 'moderator' || type === 'broadcaster') return true
  }

  return false
}

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