const { Board, INITIAL_FEN, fenToBoard, boardToFen } = require('../../utils/chess-engine/board');

describe('Board', () => {
  test('initial board from FEN has correct piece count', () => {
    const b = new Board();
    expect(b.pieceCount()).toEqual({ r: 16, b: 16 });
  });

  test('fenToBoard parses initial FEN correctly', () => {
    const board = fenToBoard(INITIAL_FEN);
    expect(board[0][0]).toBe('r');
    expect(board[9][8]).toBe('R');
    expect(board[5][0]).toBeNull();
  });

  test('boardToFen roundtrip', () => {
    const board = fenToBoard(INITIAL_FEN);
    expect(boardToFen(board, 'r')).toBe(INITIAL_FEN);
  });
});
