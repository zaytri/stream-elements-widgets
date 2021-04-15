const db = {}

window.addEventListener('onWidgetLoad', obj => {
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
  const { displayName: name, userId } = event.data
  if (!db[userId]) {
    db[userId] = { name, xp: 0 }
  }

  db[userId].xp++

  render()
}

function render() {
  const top3 = Object.values(db).sort((a,b) => b.xp - a.xp).slice(0, 3)
  for (let i = 0; i < 3; i++) {
    const rank = top3[i]
    const rankSelector = `#rank-${i + 1}`
    if (rank) {
      const [level, relativeXP] = calcLevel(rank.xp)
      const nextLevelXP = calcLevelXP(level + 1)
      $(rankSelector).show()
      $(`${rankSelector} .level`).text(level)
      $(`${rankSelector} .name`).text(rank.name)
      $(`${rankSelector} .xp`).css({ width: `${relativeXP * 100 / nextLevelXP}%` })
    } else {
      $(rankSelector).hide()
    }
  }
}

/*
  lv1 - 0-9xp
  lv2 - 10-29xp
  lv3 - 30-59xp
  lv4 - 60-99xp
  lv5 - 100xp
*/
function calcLevel(xp) {
  const level = Math.floor((-1 + Math.sqrt(1 + 8 * (xp / 10))) / 2) + 1
  const relativeXP = xp - calcLevelXP(level)
  return [level, relativeXP]
}

const calcLevelXP = level => ((level - 1) * level) * 5