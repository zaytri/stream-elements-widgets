let state = true

window.addEventListener('onWidgetLoad', obj => {
  window.setInterval(_ => {
    if (state) {
      $('.state-1').animate({ opacity: 0 })
      $('.state-2').animate({ opacity: 1 })
    } else {
      $('.state-1').animate({ opacity: 1 })
      $('.state-2').animate({ opacity: 0 })
    }
    state = !state
  }, 30000)
})