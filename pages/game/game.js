const { StrictOpeningEngine } = require('../../utils/strict-opening/engine');
const { getGameResult } = require('../../utils/chess-engine/game-state');
const { OpeningDB } = require('../../utils/opening-db/db');
const { parsePGN } = require('../../utils/pgn-parser/parser');
const { playSound } = require('../../utils/audio');
const openings = require('../../utils/opening-db/data/openings.json');

Page({
  data: {
    openingName: '',
    boardData: [],
    selected: null,
    userSide: 'r'
  },

  engine: null,
  aiMoveTimeoutId: null,

  onLoad(options) {
    const id = options.id;
    const userSide = options.side || 'r';
    const db = new OpeningDB(openings);
    const opening = db.getOpeningById(id);
    if (!opening) { wx.navigateBack(); return; }

    let tree;
    try {
      tree = parsePGN(opening.pgn);
    } catch (err) {
      wx.showToast({ title: '棋谱解析失败', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.engine = new StrictOpeningEngine(tree, userSide);
    this.setData({
      openingName: opening.name,
      boardData: this.engine.board.grid,
      selected: null,
      userSide
    });

    if (userSide === 'b') {
      this.aiMoveTimeoutId = setTimeout(() => this.playAIMove(), 300);
    }
  },

  onCellTap(e) {
    if (!this.engine || !this.engine.board) return;
    const { row, col } = e.detail;
    const board = this.engine.board;
    const piece = board.grid[row][col];

    if (!this.data.selected) {
      if (piece && (piece === piece.toUpperCase()) === (this.data.userSide === 'r')) {
        this.setData({ selected: [row, col] });
      }
      return;
    }

    const [sr, sc] = this.data.selected;
    if (sr === row && sc === col) {
      this.setData({ selected: null });
      return;
    }

    const result = this.engine.handleUserMove([sr, sc], [row, col]);
    if (result.type === 'illegal') {
      wx.showToast({ title: '非法走法', icon: 'none' });
      this.setData({ selected: null });
      return;
    }
    if (result.type === 'non-book') {
      wx.showModal({ title: '提示', content: result.message, showCancel: false });
      this.setData({ selected: null });
      return;
    }
    if (result.type === 'typical-error') {
      wx.showModal({ title: '典型错误', content: result.message, showCancel: false });
    }

    this.setData({ boardData: this.engine.board.grid, selected: null });
    playSound('move');
    const gameResult = this.checkGameOver();
    if (!gameResult) {
      if (this.aiMoveTimeoutId) clearTimeout(this.aiMoveTimeoutId);
      this.aiMoveTimeoutId = setTimeout(() => this.playAIMove(), 500);
    }
  },

  playAIMove() {
    if (!this.engine) return;
    const move = this.engine.getAIMove();
    if (move) {
      this.setData({ boardData: this.engine.board.grid });
      playSound('move');
      this.checkGameOver();
    }
  },

  undo() {
    if (!this.engine || this.engine.moveHistory.length === 0) return;
    this.engine.undo();
    if (this.engine.moveHistory.length > 0 && this.engine.board.sideToMove !== this.data.userSide) {
      this.engine.undo();
    }
    this.setData({ boardData: this.engine.board.grid, selected: null });
  },

  onUnload() {
    if (this.aiMoveTimeoutId) {
      clearTimeout(this.aiMoveTimeoutId);
      this.aiMoveTimeoutId = null;
    }
  },

  resign() {
    wx.showModal({
      title: '确认认输？',
      success: (res) => {
        if (res.confirm) {
          this.showResult(this.data.userSide === 'r' ? 'b' : 'r', '认输');
        }
      }
    });
  },

  checkGameOver() {
    const result = getGameResult(this.engine.board);
    if (result) {
      const userWin = result.winner === this.data.userSide;
      this.showResult(result.winner, userWin ? '恭喜获胜' : '对局结束');
    }
    return result;
  },

  showResult(winner, message) {
    wx.showModal({
      title: message,
      content: winner === this.data.userSide ? '你赢了！' : '你输了。',
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  }
});
