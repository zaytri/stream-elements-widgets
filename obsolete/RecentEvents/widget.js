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
	verticalAlign = 'top'
	horizontalAlign = 'right'

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

  const { name, amount } = event
  const type = listener.split('-')[0]
  addEvent(type, eventText(type, amount), name)
})

window.addEventListener('onWidgetLoad', obj => {
  const { recents, currency, fieldData } = obj.detail
  recents.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  console.log(recents)
  userCurrency = currency
  eventsLimit = fieldData.eventsLimit
  includeFollowers = fieldData.includeFollowers
  includeHosts = fieldData.includeHosts
  minHost = fieldData.minHost
  includeRaids = fieldData.includeRaids
  minRaid = fieldData.minRaid
  includeSubs = fieldData.includeSubs
  includeTips = fieldData.includeTips
  minTip = fieldData.minTip
  includeCheers = fieldData.includeCheers
  minCheer = fieldData.minCheer
  verticalAlign = fieldData.verticalAlign
  horizontalAlign = fieldData.horizontalAlign
  $('main').addClass([verticalAlign, horizontalAlign].map(a => `align-${a}`))

  const filteredRecents = recents.reduce((acc, event) => {
    const { name, amount, type } = event
    const text = eventText(type, amount)
    if (text) acc.push({ type, text, name })
    return acc
  }, [])

  for (let i = filteredRecents.length - eventsLimit; i < filteredRecents.length; i++) {
    const { type, text, name } = filteredRecents[i]
    addEvent(type, text, name)
  }
})

function eventText(type, amount) {
  switch(type) {
    case EVENT.FOLLOWER: if (includeFollowers) {
      return 'Follow'
    }
    case EVENT.SUBSCRIBER: if (includeSubs) {
      switch(amount) {
        case 'gift':    return 'Sub Gift'
        case undefined: return 'Sub'
        default:        return `Sub x${amount}`
      }
    }
    case EVENT.HOST: if (includeHosts && minHost <= amount) {
      return `Host x${amount}`
    }
    case EVENT.RAID: if (includeRaids && minRaid <= amount) {
      return `Raid x${amount}`
    }
    case EVENT.CHEER: if (includeCheers && minCheer <= amount) {
      return `Cheer x${amount}`
    }
    case EVENT.TIP: if (includeTips && minTip <= amount) {
      const options = { style: 'currency', currency: userCurrency.code }
      if (amount === parseInt(amount)) options.minimumFractionDigits = 0

      return `Tip ${amount.toLocaleString(LOCALE, options)}`
    }
    default: return null
  }
}

function addEvent(type, text, username) {
  if (!text) return
  totalEvents++

  const eventChildren = [
    Component('div', { class: 'image' }),
    Component('p', { class: 'details', children: text }),
  ]

  const UsernameComponent = Component('p', { class: 'username', children: username })

  if (horizontalAlign === 'right') eventChildren.push(UsernameComponent)
  else eventChildren.unshift(UsernameComponent)

  const EventComponent = Component('div', {
    id: `event-${totalEvents}`,
    class: ['event', `event-${type}`],
    children: eventChildren
  })

  $('main').prepend(EventComponent)
  if (totalEvents > eventsLimit) removeEvent(totalEvents - eventsLimit)
}

function removeEvent(eventId) {
  $(`#event-${eventId}`).remove()
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