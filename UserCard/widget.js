window.addEventListener('onWidgetLoad', obj => {
  const { fadeDuration, pronouns, name } = obj.detail.fieldData
  $('.name').text(name)
  const p1 = $('.p1')
  const p2 = $('.p2')
  const [pronouns1, pronouns2] = pronouns.split(',').map(p => p.trim())
  p1.text(pronouns1)
  p2.text(pronouns2)
  window.setInterval(_ => {
    const p1Text = p1.text()
  	const p2Text= p2.text()
    p1.text(p2Text)
    p2.text(p1Text)
  }, fadeDuration * 1000)
});