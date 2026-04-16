const Xiangqi = require('../../utils/xiangqi')

function flattenTree(node, path = [], depth = 0) {
  const item = {
    move: node.move,
    san: node.san,
    comment: node.comment,
    isMainLine: node.isMainLine,
    isTypicalError: node.isTypicalError,
    errorComment: node.errorComment,
    path: path.concat(node.move || []),
    pathStr: (path.concat(node.move || [])).join(','),
    depth,
    expanded: depth < 1,
    children: []
  }
  if (node.children && node.children.length) {
    item.children = node.children.map(child => flattenTree(child, item.path, depth + 1))
  }
  return item
}

function getPositionFromPath(path) {
  const engine = new Xiangqi()
  for (let i = 0; i < path.length; i++) {
    const m = path[i]
    if (!m) continue
    const from = m.slice(0, 2)
    const to = m.slice(2, 4)
    const result = engine.move({ from, to })
    if (!result) {
      console.error('Illegal move in path:', m)
      break
    }
  }
  return engine.fen().split(' ')[0]
}

Page({
  data: {
    category: '',
    categoryName: '',
    openings: [],
    selectedIndex: 0,
    networkType: 'unknown',
    tree: null,
    preview: {
      show: false,
      san: '',
      comment: '',
      position: 'start'
    }
  },

  onLoad(options) {
    const category = options.category || ''
    this.setData({ category })
    this.loadData(category)
    this.checkNetwork()
  },

  checkNetwork() {
    wx.getNetworkType({
      success: (res) => {
        this.setData({ networkType: res.networkType })
      }
    })
  },

  loadData(category) {
    const fs = wx.getFileSystemManager()
    try {
      const content = fs.readFileSync('/data/openings/index.json', 'utf8')
      const data = JSON.parse(content)
      this.processIndex(data, category)
    } catch (e) {
      wx.request({
        url: '/data/openings/index.json',
        success: (res) => {
          if (res.statusCode === 200) {
            this.processIndex(res.data, category)
          }
        },
        fail: () => {
          wx.showToast({ title: '加载数据失败', icon: 'none' })
        }
      })
    }
  },

  processIndex(data, category) {
    const cat = data.categories.find(c => c.id === category)
    if (!cat) {
      this.setData({ categoryName: '未知体系', openings: [] })
      return
    }
    const userData = wx.getStorageSync('userData') || {}
    const unlocked = userData.unlockedOpenings || []
    const openings = (cat.openings || []).map(o => ({
      ...o,
      locked: o.locked && !unlocked.includes(o.id)
    }))
    let selectedIndex = openings.findIndex(o => !o.locked)
    if (selectedIndex < 0) selectedIndex = 0
    this.setData({
      categoryName: cat.name,
      openings,
      selectedIndex
    })
    if (openings.length) {
      this.loadOpeningTree(openings[selectedIndex].id)
    }
  },

  loadOpeningTree(openingId) {
    const fs = wx.getFileSystemManager()
    try {
      const content = fs.readFileSync('/data/openings/' + openingId + '.json', 'utf8')
      const data = JSON.parse(content)
      const tree = flattenTree(data.tree)
      this.setData({ tree })
    } catch (e) {
      this.setData({ tree: null })
    }
  },

  onSelectVariation(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ selectedIndex: index })
    const opening = this.data.openings[index]
    if (opening) {
      this.loadOpeningTree(opening.id)
    }
  },

  onToggleNode(e) {
    const pathStr = e.currentTarget.dataset.path
    const path = pathStr.split(',').filter(Boolean)
    const tree = JSON.parse(JSON.stringify(this.data.tree))
    let node = tree
    for (let i = 0; i < path.length; i++) {
      const p = path[i]
      node = node.children.find(c => c.move === p)
    }
    if (node) {
      node.expanded = !node.expanded
      this.setData({ tree })
    }
  },

  onPreviewNode(e) {
    const pathStr = e.currentTarget.dataset.path
    const path = pathStr.split(',').filter(Boolean)
    const position = getPositionFromPath(path)
    const tree = this.data.tree
    let node = tree
    for (let i = 0; i < path.length; i++) {
      const p = path[i]
      node = node.children.find(c => c.move === p)
    }
    this.setData({
      preview: {
        show: true,
        san: node.san || '',
        comment: node.comment || '',
        position
      }
    })
  },

  onClosePreview() {
    this.setData({ 'preview.show': false })
  },

  onPractice(e) {
    const side = e.currentTarget.dataset.side
    const opening = this.data.openings[this.data.selectedIndex]
    if (!opening) return
    wx.navigateTo({
      url: '/pages/game/game?id=' + opening.id + '&side=' + side
    })
  },

  onUnlock() {
    const index = this.data.selectedIndex
    const opening = this.data.openings[index]
    if (!opening) return
    wx.showModal({
      title: '解锁开局',
      content: '确认支付解锁 "' + opening.name + '"？',
      success: (res) => {
        if (res.confirm) {
          const userData = wx.getStorageSync('userData') || {}
          userData.unlockedOpenings = userData.unlockedOpenings || []
          if (!userData.unlockedOpenings.includes(opening.id)) {
            userData.unlockedOpenings.push(opening.id)
          }
          wx.setStorageSync('userData', userData)
          this.setData({
            ['openings[' + index + '].locked']: false
          })
          wx.showToast({ title: '解锁成功', icon: 'success' })
        }
      }
    })
  },

  onBack() {
    wx.navigateBack()
  },

  noop() {}
})
