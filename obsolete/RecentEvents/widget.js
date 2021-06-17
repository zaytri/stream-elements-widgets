let eventsLimit = 5,
    includeFollowers = true,
    includeHosts = true,
    minHost = 0,
    includeRaids = true,
    minRaid = 0,
    includeSubs = true,
    includeTips = true,
    minTip = 0,
    includeCheers = true,
    minCheer = 0,
    userCurrency,
    totalEvents = 0

const EVENT = {
  FOLLOWER: 'follower',
  SUBSCRIBER: 'subscriber',
  HOST: 'host',
  CHEER: 'cheer',
  TIP: 'tip',
  RAID: 'raid',
}

const LOCALE = 'en-US'

window.addEventListener('onEventReceived', obj => {
  let { event, listener } = obj.detail
  if (!event) return

  const { name, displayName, amount } = event
  const type = listener.split('-')[0]
  const [details, emoji] = parseEvent(type, amount)
  addEvent(type, details, emoji, displayName || name)
})

window.addEventListener('onWidgetLoad', obj => {
  const { recents, currency, fieldData } = obj.detail
  recents.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  userCurrency = currency
  eventsLimit = fieldData.eventsLimit
  includeFollowers = fieldData.includeFollowers === 'true'
  includeHosts = fieldData.includeHosts === 'true'
  minHost = fieldData.minHost
  includeRaids = fieldData.includeRaids === 'true'
  minRaid = fieldData.minRaid
  includeSubs = fieldData.includeSubs === 'true'
  includeTips = fieldData.includeTips === 'true'
  minTip = fieldData.minTip
  includeCheers = fieldData.includeCheers === 'true'
  minCheer = fieldData.minCheer

  const filteredRecents = recents.reduce((acc, event) => {
    const { name, amount, type, displayName } = event
    const parsed = parseEvent(type, amount)
    if (parsed) {
      const [details, emoji] = parsed
      acc.push({ type, details, emoji, name: displayName || name })
    }
    return acc
  }, [])

  for (let i = filteredRecents.length - eventsLimit; i < filteredRecents.length; i++) {
    const { type, details, emoji, name } = filteredRecents[i]
    addEvent(type, details, emoji, name)
  }
})

function parseEvent(type, amount) {
  switch(type) {
    case EVENT.FOLLOWER: if (includeFollowers) {
      return ['Follow', '💖']
    } break
    case EVENT.SUBSCRIBER: if (includeSubs) {
      switch(amount) {
        case 'gift':    return ['Sub Gift', '🍉']
        case undefined: return ['Sub', '🍉']
        default:        return [`Sub x${amount}`, '🍉']
      }
    } break
    case EVENT.HOST: if (includeHosts && minHost <= amount) {
      return [`Host x${amount}`, '🤩']
    } break
    case EVENT.RAID: if (includeRaids && minRaid <= amount) {
      return [`Raid x${amount}`, '🥰']
    } break
    case EVENT.CHEER: if (includeCheers && minCheer <= amount) {
      return [`Cheer x${amount}`, '✨']
    } break
    case EVENT.TIP: if (includeTips && minTip <= amount) {
      const options = { style: 'currency', currency: userCurrency.code }
      if (amount === parseInt(amount)) options.minimumFractionDigits = 0

      return [`Tip ${amount.toLocaleString(LOCALE, options)}`, '💸']
    } break
    default: return null
  }
  return null
}

function addEvent(type, details, emoji, username) {
  if (!details) return
  totalEvents++

  const EventComponent = Component('div', {
    id: `event-${totalEvents}`,
    class: 'event',
    children: Component('div', {
      class: 'column',
      children: [
        Component('div', {
          class: 'row username-box',
          children: Component('p', { class: 'username', children: username }),
        }),
        Component('div', {
          class: 'row details-box',
          children: [
            Component('p', { class: 'symbol', children: emoji }),
            Component('p', { class: 'details', children: details }),
          ],
        }),
      ],
    }),
  })

  $('main').prepend(EventComponent)
  if (totalEvents > eventsLimit) removeEvent(totalEvents - eventsLimit)
}

function removeEvent(eventId) {
  const selector = `#event-${eventId}`
  $(selector).addClass('remove')
  window.setTimeout(_ => $(selector).remove(), 1000)
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