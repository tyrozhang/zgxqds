const INITIAL_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r';

function fenToBoard(fen) {
  const [placement] = fen.split(' ');
  const rows = placement.split('/');
  const board = [];
  for (const row of rows) {
    const boardRow = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch, 10); i++) boardRow.push(null);
      } else {
        boardRow.push(ch);
      }
    }
    board.push(boardRow);
  }
  return board;
}

function boardToFen(board, sideToMove = 'r') {
  const rows = board.map(row => {
    let fenRow = '';
    let empty = 0;
    for (const cell of row) {
      if (cell === null) {
        empty++;
      } else {
        if (empty > 0) { fenRow += empty; empty = 0; }
        fenRow += cell;
      }
    }
    if (empty > 0) fenRow += empty;
    return fenRow;
  });
  return `${rows.join('/')} ${sideToMove}`;
}

class Board {
  constructor(fen = INITIAL_FEN) {
    this.fen = fen;
    this.grid = fenToBoard(fen);
    this.sideToMove = fen.includes(' b') ? 'b' : 'r';
  }

  pieceCount() {
    let r = 0, b = 0;
    for (const row of this.grid) {
      for (const p of row) {
        if (p && p === p.toLowerCase()) b++;
        else if (p) r++;
      }
    }
    return { r, b };
  }

  getPiece(row, col) {
    return this.grid[row][col];
  }

  movePiece(from, to) {
    const [fr, fc] = from;
    const [tr, tc] = to;
    const piece = this.grid[fr][fc];
    const captured = this.grid[tr][tc];
    this.grid[tr][tc] = piece;
    this.grid[fr][fc] = null;
    this.sideToMove = this.sideToMove === 'r' ? 'b' : 'r';
    this.fen = boardToFen(this.grid, this.sideToMove);
    return captured;
  }
}

module.exports = { Board, INITIAL_FEN, fenToBoard, boardToFen };
