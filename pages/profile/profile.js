Page({
  data: { userInfo: {} },

  onShow() {
    const user = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo: user });
  },

  login() {
    wx.getUserProfile({
      desc: '用于展示棋友昵称和头像',
      success: (res) => {
        wx.login({
          success: () => {
            const info = res.userInfo;
            wx.setStorageSync('userInfo', info);
            this.setData({ userInfo: info });
          }
        });
      }
    });
  }
});
