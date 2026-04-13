const { parsePGN, moveToCoord } = require('../../utils/pgn-parser/parser');

describe('PGN Parser', () => {
  test('parses simple pgn with main line', () => {
    const pgn = '[Event "Test"]\n1. 炮二平五 马8进7 2. 马二进三 车9平8';
    const tree = parsePGN(pgn);
    expect(tree.headers.Event).toBe('Test');
    expect(tree.mainLine.length).toBe(4);
    expect(tree.mainLine[0].notation).toBe('炮二平五');
  });

  test('moveToCoord converts red cannon move', () => {
    const board = { grid: [] };
    const fromTo = moveToCoord(board, '炮二平五', 'r');
    expect(fromTo.from).toEqual([9, 7]);
    expect(fromTo.to).toEqual([9, 4]);
  });

  test('moveToCoord converts black knight move', () => {
    const board = { grid: [] };
    const fromTo = moveToCoord(board, '马8进7', 'b');
    expect(fromTo.from).toEqual([0, 1]);
    expect(fromTo.to).toEqual([2, 2]);
  });
});
