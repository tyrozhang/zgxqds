const { isLegalMove } = require('./move-validator');

function findKing(board, side) {
  const king = side === 'r' ? 'K' : 'k';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board.grid[r][c] === king) return [r, c];
    }
  }
  return null;
}

function isCheck(board, side) {
  const kingPos = findKing(board, side);
  if (!kingPos) return false;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board.grid[r][c];
      if (p) {
        const pSide = p === p.toLowerCase() ? 'b' : 'r';
        if (pSide !== side && isLegalMove(board, [r, c], kingPos)) {
          return true;
        }
      }
    }
  }
  return false;
}

function getAllLegalMoves(board, side) {
  const moves = [];
  for (let fr = 0; fr < 10; fr++) {
    for (let fc = 0; fc < 9; fc++) {
      const p = board.grid[fr][fc];
      if (!p) continue;
      const pSide = p === p.toLowerCase() ? 'b' : 'r';
      if (pSide !== side) continue;
      for (let tr = 0; tr < 10; tr++) {
        for (let tc = 0; tc < 9; tc++) {
          if (isLegalMove(board, [fr, fc], [tr, tc])) {
            moves.push({ from: [fr, fc], to: [tr, tc] });
          }
        }
      }
    }
  }
  return moves;
}

function isCheckmate(board, side) {
  if (!isCheck(board, side)) return false;
  const moves = getAllLegalMoves(board, side);
  for (const m of moves) {
    const clone = new (require('./board').Board)(board.fen);
    clone.movePiece(m.from, m.to);
    if (!isCheck(clone, side)) return false;
  }
  return true;
}

function isStalemate(board, side) {
  if (isCheck(board, side)) return false;
  const moves = getAllLegalMoves(board, side);
  for (const m of moves) {
    const clone = new (require('./board').Board)(board.fen);
    clone.movePiece(m.from, m.to);
    if (!isCheck(clone, side)) return false;
  }
  return true;
}

function getGameResult(board) {
  if (isCheckmate(board, 'r')) return { winner: 'b', reason: 'checkmate' };
  if (isCheckmate(board, 'b')) return { winner: 'r', reason: 'checkmate' };
  if (isStalemate(board, board.sideToMove)) {
    return { winner: board.sideToMove === 'r' ? 'b' : 'r', reason: 'stalemate' };
  }
  return null;
}

module.exports = { findKing, isCheck, isCheckmate, isStalemate, getGameResult, getAllLegalMoves };
