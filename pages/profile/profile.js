Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    unlockedList: [],
    soundEnabled: true
  },

  onShow() {
    this.loadUserData()
    this.loadSettings()
    this.loadUnlockedList()
  },

  loadUserData() {
    const userData = wx.getStorageSync('userData') || {}
    const hasUserInfo = !!(userData.nickName && userData.avatarUrl)
    this.setData({
      userInfo: userData,
      hasUserInfo
    })
  },

  loadSettings() {
    const settings = wx.getStorageSync('settings') || { soundEnabled: true }
    this.setData({ soundEnabled: settings.soundEnabled })
  },

  loadUnlockedList() {
    const userData = wx.getStorageSync('userData') || {}
    const unlocked = userData.unlockedOpenings || []
    if (!unlocked.length) {
      this.setData({ unlockedList: [] })
      return
    }
    const { categories } = require('../../data/openings/data.js')
    const list = []
    categories.forEach(cat => {
      (cat.openings || []).forEach(o => {
        if (unlocked.includes(o.id)) {
          list.push({ id: o.id, name: o.name })
        }
      })
    })
    this.setData({ unlockedList: list })
  },

  onGetUserInfo(e) {
    const profile = e.detail.userInfo || {}
    if (!profile.nickName) {
      wx.showToast({ title: '需要授权才能登录', icon: 'none' })
      return
    }
    wx.login({
      success: (loginRes) => {
        const userData = wx.getStorageSync('userData') || {}
        userData.nickName = profile.nickName || ''
        userData.avatarUrl = profile.avatarUrl || ''
        userData.openid = 'mock_openid_' + (loginRes.code || '001')
        wx.setStorageSync('userData', userData)
        this.setData({
          userInfo: userData,
          hasUserInfo: true
        })
      },
      fail: () => {
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    })
  },

  onToggleSound(e) {
    const enabled = e.detail.value
    const settings = wx.getStorageSync('settings') || {}
    settings.soundEnabled = enabled
    wx.setStorageSync('settings', settings)
    this.setData({ soundEnabled: enabled })
  }
})
