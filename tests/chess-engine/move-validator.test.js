const { isLegalMove, isInPalace, isSameSide } = require('../../utils/chess-engine/move-validator');
const { Board } = require('../../utils/chess-engine/board');

describe('MoveValidator', () => {
  test('chariot moves horizontally or vertically', () => {
    const b = new Board();
    expect(isLegalMove(b, [9, 0], [9, 4])).toBe(false); // blocked by horse at [9,1]
    expect(isLegalMove(b, [9, 0], [7, 0])).toBe(true);
    expect(isLegalMove(b, [9, 0], [8, 1])).toBe(false);
  });

  test('horse moves one orthogonal then one diagonal', () => {
    const b = new Board();
    expect(isLegalMove(b, [9, 1], [7, 2])).toBe(true);
    expect(isLegalMove(b, [9, 1], [7, 0])).toBe(true);
    expect(isLegalMove(b, [9, 1], [8, 3])).toBe(false);
  });

  test('king stays in palace', () => {
    const b = new Board();
    expect(isLegalMove(b, [9, 4], [8, 4])).toBe(true);
    expect(isLegalMove(b, [9, 4], [7, 4])).toBe(false);
  });

  test('cannot move to square occupied by same side piece', () => {
    const b = new Board();
    expect(isLegalMove(b, [9, 0], [9, 1])).toBe(false);
  });
});
