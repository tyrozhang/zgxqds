const { Board } = require('../chess-engine/board');
const { isLegalMove } = require('../chess-engine/move-validator');

class StrictOpeningEngine {
  constructor(pgnTree, userSide = 'r') {
    this.pgnTree = pgnTree;
    this.userSide = userSide;
    this.board = new Board();
    this.currentStep = 0;
    this.moveHistory = [];
  }

  handleUserMove(from, to) {
    if (!isLegalMove(this.board, from, to)) {
      return { type: 'illegal' };
    }

    const expected = this.getExpectedUserMove();
    if (expected && this.matchMove(from, to, expected)) {
      const captured = this.applyMove(expected);
      return { type: 'valid', move: expected, captured };
    }

    const err = this.findErrorBranch(from, to);
    if (err) {
      const captured = this.applyMove(err.move);
      return { type: 'typical-error', message: err.message, move: err.move, captured };
    }

    return { type: 'non-book', message: '非当前棋谱棋路，请再回去继续学习当前棋谱吧~' };
  }

  getAIMove() {
    if (this.currentStep < this.pgnTree.mainLine.length) {
      const move = this.pgnTree.mainLine[this.currentStep];
      const captured = this.applyMove(move);
      return { ...move, captured };
    }
    return null;
  }

  getExpectedUserMove() {
    if (this.currentStep < this.pgnTree.mainLine.length) {
      return this.pgnTree.mainLine[this.currentStep];
    }
    return null;
  }

  matchMove(from, to, move) {
    return from[0] === move.from[0] && from[1] === move.from[1] && to[0] === move.to[0] && to[1] === move.to[1];
  }

  findErrorBranch(from, to) {
    if (!this.pgnTree.errorBranches) return null;
    for (const err of this.pgnTree.errorBranches) {
      if (this.matchMove(from, to, err.move)) return err;
    }
    return null;
  }

  applyMove(move) {
    const captured = this.board.movePiece(move.from, move.to);
    this.moveHistory.push(move);
    this.currentStep++;
    return captured;
  }

  undo() {
    if (this.moveHistory.length === 0) return;
    const last = this.moveHistory.pop();
    this.board = new (require('../chess-engine/board').Board)();
    for (const m of this.moveHistory) {
      this.board.movePiece(m.from, m.to);
    }
    this.currentStep = this.moveHistory.length;
  }
}

module.exports = { StrictOpeningEngine };
