const { OpeningDB } = require('../../utils/opening-db/db');
const openings = require('../../utils/opening-db/data/openings.json');

Page({
  data: { category: '', openings: [] },

  onLoad(options) {
    const category = decodeURIComponent(options.category || '');
    const db = new OpeningDB(openings);
    this.setData({ category, openings: db.getOpeningsByCategory(category) });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/opening-detail/opening-detail?id=${id}` });
  }
});
