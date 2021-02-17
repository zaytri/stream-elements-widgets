window.addEventListener('onWidgetLoad', function (obj) {
  CSS.registerProperty({
    name: '--angle',
    syntax: '<angle>',
    initialValue: '0turn',
    inherits: true
  })
})