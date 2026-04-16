Page({
  onLoad() {
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/index/index' })
    }, 800)
  }
})
