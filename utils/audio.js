function playSound(type) {
  const urls = {
    move: '/assets/sounds/move.mp3',
    capture: '/assets/sounds/capture.mp3',
    check: '/assets/sounds/check.mp3'
  };
  const url = urls[type];
  if (!url) return;

  const ctx = wx.createInnerAudioContext();
  ctx.src = url;
  ctx.onEnded(() => ctx.destroy());
  ctx.onError(() => ctx.destroy());
  ctx.play();
}

module.exports = { playSound };
