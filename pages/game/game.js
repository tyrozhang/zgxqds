const { Board } = require('../../utils/chess-engine/board');
const { StrictOpeningEngine } = require('../../utils/strict-opening/engine');
const { getGameResult } = require('../../utils/chess-engine/game-state');
const { OpeningDB } = require('../../utils/opening-db/db');
const { parsePGN } = require('../../utils/pgn-parser/parser');
const openings = require('../../utils/opening-db/data/openings.json');

Page({
  data: {
    openingName: '',
    boardData: [],
    selected: null,
    userSide: 'r'
  },

  engine: null,

  onLoad(options) {
    const id = options.id;
    const userSide = options.side || 'r';
    const db = new OpeningDB(openings);
    const opening = db.getOpeningById(id);
    if (!opening) { wx.navigateBack(); return; }

    const tree = parsePGN(opening.pgn);
    this.engine = new StrictOpeningEngine(tree, userSide);
    this.setData({
      openingName: opening.name,
      boardData: this.engine.board.grid,
      selected: null,
      userSide
    });

    if (userSide === 'b') {
      setTimeout(() => this.playAIMove(), 300);
    }
  },

  onCellTap(e) {
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
    this.checkGameOver();

    if (!this.isGameOver()) {
      setTimeout(() => this.playAIMove(), 500);
    }
  },

  playAIMove() {
    const move = this.engine.getAIMove();
    if (move) {
      this.setData({ boardData: this.engine.board.grid });
      this.checkGameOver();
    }
  },

  undo() {
    if (this.engine.moveHistory.length === 0) return;
    this.engine.undo();
    if (this.engine.moveHistory.length > 0 && this.engine.board.sideToMove !== this.data.userSide) {
      this.engine.undo();
    }
    this.setData({ boardData: this.engine.board.grid, selected: null });
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
  },

  isGameOver() {
    return getGameResult(this.engine.board) !== null;
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
