const { OpeningDB } = require('../../utils/opening-db/db');
const openings = require('../../utils/opening-db/data/openings.json');

Page({
  data: { categories: [] },

  onLoad() {
    const db = new OpeningDB(openings);
    this.setData({ categories: db.getCategories() });
  },

  goToCategory(e) {
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({ url: `/pages/openings/openings?category=${encodeURIComponent(name)}` });
  }
});
