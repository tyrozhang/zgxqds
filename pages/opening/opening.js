const data = require('../../data/openings/data')

Page({
  data: {
    categories: [],
    expandedCategoryIndex: 0,
    openings: []
  },

  onLoad(options) {
    console.log('[opening] data:', data)
    console.log('[opening] data.categories:', data.categories)
    this.setData({ categories: data.categories })
    if (data.categories && data.categories.length) {
      this.setData({
        openings: data.categories[0].openings || []
      })
    }
  },

  onToggleCategory(e) {
    const index = e.currentTarget.dataset.index
    const cat = this.data.categories[index]
    this.setData({
      expandedCategoryIndex: this.data.expandedCategoryIndex === index ? -1 : index,
      openings: cat ? (cat.openings || []) : []
    })
  },

  onSelectOpening(e) {
    const index = e.currentTarget.dataset.index
    const opening = this.data.openings[index]
    if (!opening) return
    wx.navigateTo({
      url: '/pages/game/game?id=' + opening.id
    })
  }
})
