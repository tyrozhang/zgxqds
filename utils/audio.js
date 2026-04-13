const audioCtx = wx.createInnerAudioContext();

function playSound(type) {
  const urls = {
    move: '/assets/sounds/move.mp3',
    capture: '/assets/sounds/capture.mp3',
    check: '/assets/sounds/check.mp3'
  };
  const url = urls[type];
  if (!url) return;
  audioCtx.src = url;
  audioCtx.play();
}

module.exports = { playSound };
