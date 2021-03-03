let fadeState = true

window.addEventListener('onWidgetLoad', obj => {
  const { fadeDuration, pronouns, name } = obj.detail.fieldData
  $('.name').text(name)

  const [p1, p2] = pronouns.split(',').map(p => p.trim())
  $('.state1 .p1').text(p1)
  $('.state1 .p2').text(p2)
  $('.state2 .p2').text(p1)
  $('.state2 .p1').text(p2)

  window.setInterval(_ => {
    if (fadeState) {
      $('.state1 .p1, .state1 .p2').animate({ color: 'transparent' }, 'slow')
      $('.state2 .p1, .state2 .p2').animate({ color: '#fc6c85' }, 'slow')
    } else {
      $('.state1 .p1, .state1 .p2').animate({ color: '#fc6c85' }, 'slow')
      $('.state2 .p1, .state2 .p2').animate({ color: 'transparent' }, 'slow')
    }
    fadeState = !fadeState
  }, fadeDuration * 1000)
})