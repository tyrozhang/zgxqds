const { findKing, isCheck, isCheckmate, getGameResult } = require('../../utils/chess-engine/game-state');
const { Board } = require('../../utils/chess-engine/board');

describe('GameState', () => {
  test('findKing locates red king', () => {
    const b = new Board();
    expect(findKing(b, 'r')).toEqual([9, 4]);
    expect(findKing(b, 'b')).toEqual([0, 4]);
  });

  test('new game is not check', () => {
    const b = new Board();
    expect(isCheck(b, 'r')).toBe(false);
    expect(isCheck(b, 'b')).toBe(false);
  });

  test('detects checkmate in a simple pattern', () => {
    const b = new Board('3RkR3/3a1a3/9/9/9/4R4/9/9/9/4K4 r');
    expect(isCheck(b, 'b')).toBe(true);
    expect(isCheckmate(b, 'b')).toBe(true);
  });
});
