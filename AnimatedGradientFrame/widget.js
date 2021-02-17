window.addEventListener('onWidgetLoad', function (obj) {
  if (typeof CSS !== 'undefined' && typeof CSS.registerProperty !== 'undefined') {
    CSS.registerProperty({
      name: '--angle',
      syntax: '<angle>',
      initialValue: '0turn',
      inherits: true
    })
  } else {
    const { speed } = obj.detail.fieldData
    const frames = speed * 60

    let percentages = ''
    for (let i = 0; i <= frames; i++) {
      const turn = i * (1 / frames)
      percentages = `${percentages} ${turn * 100}% { --angle: ${turn}turn; }`
    }

    const [sheet] = document.styleSheets
    sheet.insertRule(`@keyframes gradientRotationLegacy { ${percentages} }`, sheet.length)
    $('.gradient-rotation').css('animation-name', 'gradientRotationLegacy')
  }
})