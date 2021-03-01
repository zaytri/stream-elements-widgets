window.addEventListener('onWidgetLoad', obj => {
  const { fadeDuration, pronouns, name } = obj.detail.fieldData
  $('.name').text(name)
  const p1 = $('.p1')
  const p2 = $('.p2')
  const ps = $('.p1, .p2')
  const [pronouns1, pronouns2] = pronouns.split(',').map(p => p.trim())
  p1.text(pronouns1)
  p2.text(pronouns2)
  window.setInterval(_ => {
    ps.animate({ color: 'transparent' }, 500, _ => {
      ps.animate({ color: '#fc6c85' }, 500)
    })
    window.setTimeout(_ => {
      const p1Text = p1.text()
      const p2Text= p2.text()
      p1.text(p2Text)
      p2.text(p1Text)
    }, 500)
  }, fadeDuration * 1000)
});