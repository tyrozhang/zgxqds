Page({
  data: {
    categories: [
      { id: 'zhongpao', name: '中炮', desc: '当头炮，攻势凌厉' },
      { id: 'feixiang', name: '飞相', desc: '稳扎稳打，先守后攻' },
      { id: 'xianren', name: '仙人指路', desc: '灵活多变，试探应手' },
      { id: 'qima', name: '起马', desc: '均衡出子，伺机而动' },
      { id: 'guogong', name: '过宫炮', desc: '集中一炮，侧翼出击' }
    ],
    userInfo: null,
    hasUserInfo: false
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userData = wx.getStorageSync('userData') || {}
    const hasUserInfo = !!(userData.nickName && userData.avatarUrl)
    this.setData({
      userInfo: userData,
      hasUserInfo
    })
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/opening/opening?category=' + id
    })
  },

  onGoProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  }
})
