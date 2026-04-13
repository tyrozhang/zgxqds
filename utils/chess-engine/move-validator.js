function isInPalace(row, col, side) {
  if (col < 3 || col > 5) return false;
  if (side === 'r' && row >= 7 && row <= 9) return true;
  if (side === 'b' && row >= 0 && row <= 2) return true;
  return false;
}

function isSameSide(p1, p2) {
  if (!p1 || !p2) return false;
  const s1 = p1 === p1.toLowerCase() ? 'b' : 'r';
  const s2 = p2 === p2.toLowerCase() ? 'b' : 'r';
  return s1 === s2;
}

function countObstacles(board, from, to) {
  const [fr, fc] = from;
  const [tr, tc] = to;
  let count = 0;
  if (fr === tr) {
    const min = Math.min(fc, tc);
    const max = Math.max(fc, tc);
    for (let c = min + 1; c < max; c++) {
      if (board.grid[fr][c]) count++;
    }
  } else if (fc === tc) {
    const min = Math.min(fr, tr);
    const max = Math.max(fr, tr);
    for (let r = min + 1; r < max; r++) {
      if (board.grid[r][fc]) count++;
    }
  }
  return count;
}

function isLegalMove(board, from, to) {
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = board.grid[fr][fc];
  if (!piece) return false;
  const side = piece === piece.toLowerCase() ? 'b' : 'r';
  const target = board.grid[tr][tc];
  if (isSameSide(piece, target)) return false;

  const dr = tr - fr;
  const dc = tc - fc;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);
  const obstacles = countObstacles(board, from, to);

  switch (piece.toLowerCase()) {
    case 'r': // 车
      return (fr === tr || fc === tc) && obstacles === 0;
    case 'n': // 马
      if (adr === 2 && adc === 1) {
        return !board.grid[fr + dr / 2][fc];
      }
      if (adr === 1 && adc === 2) {
        return !board.grid[fr][fc + dc / 2];
      }
      return false;
    case 'b': // 象/相
      if (adr === 2 && adc === 2 && obstacles === 0) {
        if (side === 'r' && tr >= 5) return true;
        if (side === 'b' && tr <= 4) return true;
      }
      return false;
    case 'a': // 士/仕
      return adr === 1 && adc === 1 && isInPalace(tr, tc, side);
    case 'k': // 将/帅
      if (adr === 0 && adc === 1 && isInPalace(tr, tc, side)) return true;
      if (adr === 1 && adc === 0 && isInPalace(tr, tc, side)) return true;
      // 将帅对面
      if (dc === 0 && board.grid[tr][tc] && board.grid[tr][tc].toLowerCase() === 'k') {
        return obstacles === 0;
      }
      return false;
    case 'c': // 炮
      if (fr === tr || fc === tc) {
        if (!target) return obstacles === 0;
        return obstacles === 1;
      }
      return false;
    case 'p': // 兵/卒
      const forward = side === 'r' ? -1 : 1;
      if (side === 'r' && fr > 4) {
        return dr === forward && dc === 0;
      }
      if (side === 'b' && fr < 5) {
        return dr === forward && dc === 0;
      }
      if (dr === forward && adc <= 1) return true;
      return false;
    default:
      return false;
  }
}

module.exports = { isLegalMove, isInPalace, isSameSide };
