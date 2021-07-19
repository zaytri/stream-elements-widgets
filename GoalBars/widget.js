const FIELD_DATA = {
  followGoal: 0,
  subGoal: 0,
}

const DATA = {
  followCount: 0,
  subCount: 0,
}

const EVENT = {
  FOLLOWER: 'follower',
  SUBSCRIBER: 'subscriber',
}

window.addEventListener('onWidgetLoad', obj => {
  const {
    fieldData,
    session: {
      data: {
        ['follower-total']: { count: followCount },
        ['subscriber-total']: { count: subCount },
      }
    }
  } = obj.detail

  FIELD_DATA.followGoal = fieldData.followGoal
  FIELD_DATA.subGoal = fieldData.subGoal

  DATA.followCount = followCount
  DATA.subCount = subCount

  renderFollows()
  renderSubs()
})

window.addEventListener('onEventReceived', obj => {
  let { event, listener } = obj.detail
  if (!event) return

  const type = listener.split('-')[0]

  switch(type) {
    case EVENT.FOLLOWER: addFollow()
      break
    case EVENT.SUBSCRIBER: addSub()
      break
    default: return
  }
})

function addFollow() {
  DATA.followCount++
  renderFollows()
}

function addSub() {
  DATA.subCount++
  renderSubs()
}

const renderFollows = () => renderGoal(DATA.followCount, FIELD_DATA.followGoal, 'follow')
const renderSubs = () => renderGoal(DATA.subCount, FIELD_DATA.subGoal, 'sub')

function renderGoal(count, goal, id) {
  const width = `${Math.min(count * 100 / goal, 100)}%`
  $(`#${id} .bar`).animate({ width })
  $(`#${id} .amount`).queue(function(next) {
    $(this).text(`${count}/${goal}`)
    if (count >= goal) {
      $(`#${id}`).addClass('complete')
    }
    next()
  })
}