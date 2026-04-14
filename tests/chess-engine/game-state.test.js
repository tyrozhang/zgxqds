const { findKing, isCheck, isCheckmate, getGameResult, getAllLegalMoves, isStalemate } = require('../../utils/chess-engine/game-state');
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

  test('detects stalemate pattern', () => {
    // Red king at [9,3], black rook at [8,4].
    // King has pseudo-legal moves to [8,3] and [9,4], but both result in check.
    // Not currently in check, so it's a stalemate for red.
    const bStale = new Board('4k4/9/9/9/9/9/9/9/4r4/3K5 r');
    expect(isCheck(bStale, 'r')).toBe(false);
    expect(isStalemate(bStale, 'r')).toBe(true);
  });

  test('getGameResult returns correct result for checkmate', () => {
    const b = new Board('3RkR3/3a1a3/9/9/9/4R4/9/9/9/4K4 r');
    expect(getGameResult(b)).toEqual({ winner: 'r', reason: 'checkmate' });
  });

  test('getAllLegalMoves returns expected number of moves for a simple position', () => {
    // Minimal position: red king at [9,4], black king at [0,4], no blocking pieces.
    const b = new Board('4k4/9/9/9/9/9/9/9/9/4K4 r');
    const redMoves = getAllLegalMoves(b, 'r');
    // Red king can move within palace plus fly to the opposite king on the same file.
    expect(redMoves.length).toBe(4);
    const blackMoves = getAllLegalMoves(b, 'b');
    // Black king can move within palace plus fly to the opposite king on the same file.
    expect(blackMoves.length).toBe(4);
  });
});
