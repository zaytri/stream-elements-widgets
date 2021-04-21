const db = {}

const FIELD_DATA = {
  ALLOW: [],
  BLOCK: [],
  MESSAGE_LIMIT: 10,
  CHAR_MIN: 10,
  ALIGNMENT: 'vertical',
  DIRECTION: 'direction',
  TOP_COUNT: 5,
}

const DEFAULT_EMOTE = 'https://static-cdn.jtvnw.net/emoticons/v1/112290/3.0'

window.addEventListener('onWidgetLoad', obj => {
  const {
    allow, block, messageLimit,
    charMin, alignment, direction,
    topCount
  } = obj.detail.fieldData

  FIELD_DATA.ALLOW = stringToArray(allow)
  FIELD_DATA.BLOCK = stringToArray(block)
  FIELD_DATA.MESSAGE_LIMIT = messageLimit
  FIELD_DATA.CHAR_MIN = charMin
  FIELD_DATA.ALIGNMENT = alignment
  FIELD_DATA.DIRECTION = direction
  FIELD_DATA.TOP_COUNT = topCount

  $('main').addClass([alignment, direction])

  for (let i = 0; i < FIELD_DATA.TOP_COUNT; i++) {
    $('main').append(RankComponent(i))
  }
  render()
})

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail
  switch(listener) {
    case 'message': onMessage(event)
      break
    default: return
  }
})

function onMessage(event) {
  const {
    displayName: name,
    nick, userId, emotes,
    text,
  } = event.data

  if (text.length < FIELD_DATA.CHAR_MIN) return

  if (FIELD_DATA.ALLOW.length && !isAllowed(name, nick)) return
  if (isBlocked(name, nick)) return

  if (!db[userId]) {
    db[userId] = { name, xp: 0, messagesLastMinute: 0 }
  }

  db[userId].messagesLastMinute++
  window.setTimeout(() => { db[userId].messagesLastMinute-- }, 60000)

  if (db[userId].messagesLastMinute > FIELD_DATA.MESSAGE_LIMIT) return

  if (emotes && emotes.length > 0) {
    db[userId].emote = emotes[emotes.length - 1].urls['4']
  }

  db[userId].xp++

  render()
}

function render() {
  const topRanks = Object.entries(db).sort((a,b) => b[1].xp - a[1].xp).slice(0, FIELD_DATA.TOP_COUNT)

  for (let i = 0; i < FIELD_DATA.TOP_COUNT; i++) {
    const rank = topRanks[i]
    const rankSelector = `#rank-${i}`
    if (rank) {
      const [userId, { name, xp, emote }] = rank
      const [level, relativeXP] = calcLevel(xp)
      const nextLevelXP = calcLevelXP(level + 1)
      $(rankSelector).show()
      $(`${rankSelector} .level`).text(`Lv ${level}`)
      $(`${rankSelector} .username`).text(name)
      $(`${rankSelector} .xp`).animate({ width: `${relativeXP * 100 / nextLevelXP}%` }, 'fast')
      $(`${rankSelector} .emote`).attr({ src: emote || DEFAULT_EMOTE })
    } else {
      $(rankSelector).hide()
    }
  }
}

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

/*
  lv1 - 0-9xp (10)
  lv2 - 10-29xp (20)
  lv3 - 30-59xp (30)
  lv4 - 60-99xp (40)
  lv5 - 100-149xp (50)
  etc...
*/
function calcLevel(xp) {
  const level = Math.floor((-1 + Math.sqrt(1 + 8 * (xp / 10))) / 2) + 1
  const relativeXP = xp - calcLevelXP(level)
  return [level, relativeXP]
}

const calcLevelXP = level => ((level - 1) * level) * 5

function stringToArray(string = '', separator = ',') {
  return string.split(separator).reduce((acc, value) => {
    const trimmed = value.trim().toLowerCase()
    if (trimmed !== '') acc.push(trimmed)
    return acc
  }, [])
}

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

/* Component Functions */

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