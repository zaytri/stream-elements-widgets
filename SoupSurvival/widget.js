let FieldData = {}

const Widget = {
  timer: null,
  db: {},
  height: 0,
  width: 0,
  deathTime: 0,
  active: false,
  sound: null,
  jebaitedAPI: null,
}

window.addEventListener('onWidgetLoad', obj => {
  window.setTimeout(_ => {
    Widget.width = $('main').innerWidth()
    Widget.height = $('main').innerHeight()
  }, 300)
  loadFieldData(obj.detail.fieldData)

  Widget.jebaitedAPI = new Jebaited(FieldData.token)

  resetTimer()
  window.setInterval(renderTimer, 500)

  Widget.sound = new Audio(FieldData.sound)
  Widget.sound.volume = parseInt(FieldData.volume) / 100
})

function loadFieldData(data) {
  FieldData = data

  processFieldData(value => stringToArray(value), 'ignoreList')
  processFieldData(value => value + 1, 'duration')
}

function processFieldData(process, ...keys) {
  for (const key of keys) {
    FieldData[key] = process(FieldData[key])
  }
}

function resetTimer() {
  clearTimeout(Widget.timer)
  Widget.timer = window.setTimeout(death, 1000 * FieldData.duration)
  Widget.deathTime = Date.now() + (1000 * FieldData.duration)
}

function renderTimer() {
  const timeLeft = (Widget.deathTime - Date.now()) / 1000
  const selector = '#timer'

  if (!Widget.active) {
    $(selector).text('')
    $(selector).removeClass('soon')
    return
  }

  const minutes = Math.max(Math.trunc(timeLeft / 60), 0);
  const seconds = Math.max(Math.trunc(timeLeft % 60), 0);

  if (minutes === 0 && seconds <= 10) $(selector).addClass('soon')
  else $(selector).removeClass('soon')

  const time = `${minutes}:${String(seconds).padStart(2, '0')}`
  $(selector).text(time)
}



function stringToArray(string = '', separator = ',') {
  return string.split(separator).reduce((acc, value) => {
    const trimmed = value.trim()
    if (trimmed !== '') acc.push(trimmed)
    return acc
  }, [])
}

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
    displayName: name, nick,
    emotes, userId, text,
    badges,
  } = event.data

  if (userListIncludes(FieldData.ignoreList, name, nick)) return

  const [command, commandArguments] = text.split(' ')
  if (isBroadcaster(badges)) {
    switch(command) {
      case '!souptime': {
        resetTimer()
        Widget.active = true
        Widget.jebaitedAPI.sayMessage('Soup Survival Start!')
        return
      }
      case '!notrigged': {
        const newTime = Number.parseInt(commandArguments)
        if (!Number.isNaN(newTime)) {
          FieldData.duration = newTime
          Widget.jebaitedAPI.sayMessage(`Max timer has been set to ${newTime} seconds!`)
        }
        return
      }
      case '!stir': {
        Object.values(Widget.db).forEach(user => {
          const { userId: stirUserId } = user
          const selector = `.user[data-user-id=${stirUserId}]`
          const width = $(selector).outerWidth()
          const height = $(selector).outerHeight()

          const left = random(1, Widget.width - width)
          const top = random(1, Widget.height - height)

          Widget.db[userId].left = left
          Widget.db[userId].top = top
          $(selector).animate({ left, top }, 1000)
        })
        return
      }
      default: // nothing
    }
  }

  if (text === '!souptime' && isBroadcaster(badges)) {
    resetTimer()
    Widget.active = true
    Widget.jebaitedAPI.sayMessage('Soup Survival Start!')
    return
  }

  if (!Widget.active) return

  if (!Widget.db[userId]) {
    Widget.db[userId] = {
      userId, name, emote: FieldData.image, top: 0, left: 0
    }
    Widget.jebaitedAPI.sayMessage(`${name} has been added to the soup CurseLit`)
    resetTimer()
  }

  if (emotes.length > 0) {
    const lastEmote = emotes[emotes.length - 1]
    Widget.db[userId].emote = lastEmote.urls['4'] || lastEmote.urls['1'] || Widget.db[userId].emote
  }

  render()

  if (Widget.db[userId].top === 0) {
    window.setTimeout(_ => {
      const selector = `.user[data-user-id=${userId}]`
      const width = $(selector).outerWidth()
      const height = $(selector).outerHeight()

      Widget.db[userId].left = random(1, Widget.width - width)
      Widget.db[userId].top = random(1, Widget.height - height)

      $(selector).addClass('animate')

      render()
    }, 300)
  }
}

function isBroadcaster(badges) {
  for (const badge of badges) {
    if (badge.type === 'broadcaster') return true
  }
  return false
}

function render() {
  const users = Object.values(Widget.db)
  for (const user of users) {
    const {
      userId, name, emote,
      top, left,
    } = user

    const selector = `.user[data-user-id=${userId}]`

    if (!$(selector).length) {
      $('main').append(UserComponent({ userId, name, emote }))
    }

    $(selector).css({ left, top })
    $(`${selector} .emote`).prop({ src: emote })
  }
}

function death() {
  $('#timer').addClass('deathTime')
  window.setTimeout(_ => $('#timer').removeClass('deathTime'), 1000 * 3)

  const userKeys = Object.keys(Widget.db)
  const userCount = userKeys.length
  if (!userCount) {
    Widget.active = false
    return
  }

  for (userKey of userKeys) {
    Widget.db[userKey].emote = FieldData.deathImage
  }

  $('main').addClass('death')
  Widget.sound.play()
  render()

  Widget.jebaitedAPI.sayMessage(`${userCount} have become soup zaytriSCREME`)

  window.setTimeout(_ => {
    Widget.active = false
    Widget.db = {}
    $('main').removeClass('death')
    $('.user').remove()
    render()
  }, 1000 * 3)
}

function UserComponent(data) {
  const { userId, name, emote } = data

  return Component('div', {
    'data-user-id': userId,
    class: 'user',
    children: [
      Component('div', {
        class: 'name-box',
        children: Component('p', { class: 'name', children: name }),
      }),
      Component('div', {
        class: 'emote-box',
        children: Component('img', { class: 'emote', src: emote }),
      }),
    ],
  })
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

function joinIfArray(possibleArray, delimiter = '') {
  if (Array.isArray(possibleArray)) return possibleArray.join(delimiter)
  return possibleArray
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function userListIncludes(userList, ...names) {
  const lowercaseNames = names.map(name => name.toLowerCase())
  for (const user of userList) {
    if (lowercaseNames.includes(user.toLowerCase())) return true
  }
  return false
}