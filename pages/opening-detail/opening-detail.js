const { OpeningDB } = require('../../utils/opening-db/db');
const { parsePGN } = require('../../utils/pgn-parser/parser');
const { Board } = require('../../utils/chess-engine/board');
const openings = require('../../utils/opening-db/data/openings.json');

Page({
  data: {
    opening: {},
    hasVideo: false,
    branches: [],
    previewFen: '',
    previewBoard: []
  },

  onLoad(options) {
    const id = options.id;
    const db = new OpeningDB(openings);
    const opening = db.getOpeningById(id);
    if (!opening) { wx.navigateBack(); return; }

    wx.getNetworkType({
      success: (res) => {
        const hasVideo = res.networkType !== 'none' && opening.videoUrl;
        this.setData({ opening, hasVideo });
        this.buildBranches(opening.pgn);
      }
    });
  },

  buildBranches(pgn) {
    const tree = parsePGN(pgn);
    const branches = tree.mainLine.map((m, i) => ({
      label: `${i + 1}. ${m.notation}`,
      index: i
    }));
    this.setData({ branches });
  },

  previewBranch(e) {
    const index = e.currentTarget.dataset.index;
    const tree = parsePGN(this.data.opening.pgn);
    const board = new Board();
    for (let i = 0; i <= index && i < tree.mainLine.length; i++) {
      board.movePiece(tree.mainLine[i].from, tree.mainLine[i].to);
    }
    this.setData({ previewBoard: board.grid, previewFen: board.fen });
  },

  startPractice(e) {
    const side = e.currentTarget.dataset.side;
    wx.navigateTo({ url: `/pages/game/game?id=${this.data.opening.id}&side=${side}` });
  },

  unlock() {
    wx.requestPayment({
      timeStamp: String(Date.now()),
      nonceStr: 'test',
      package: 'prepay_id=test',
      signType: 'MD5',
      paySign: 'test',
      success: () => {
        const db = new OpeningDB(openings);
        db.unlock(this.data.opening.id);
        const unlocked = wx.getStorageSync('unlockedOpenings') || [];
        unlocked.push(this.data.opening.id);
        wx.setStorageSync('unlockedOpenings', unlocked);
        this.setData({ 'opening.locked': false });
        wx.showToast({ title: '解锁成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '支付取消', icon: 'none' });
      }
    });
  }
});
