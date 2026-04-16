Page({
  onLoad() {
    this.initStorage()
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/index/index' })
    }, 800)
  },

  initStorage() {
    if (!wx.getStorageSync('userData')) {
      wx.setStorageSync('userData', {
        openid: 'mock_openid_001',
        nickName: '',
        avatarUrl: '',
        unlockedOpenings: []
      })
    }
    if (!wx.getStorageSync('settings')) {
      wx.setStorageSync('settings', { soundEnabled: true })
    }
  }
})
