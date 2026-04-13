const { StrictOpeningEngine } = require('../../utils/strict-opening/engine');

describe('StrictOpeningEngine', () => {
  const pgnTree = {
    mainLine: [
      { notation: '炮二平五', from: [7, 7], to: [7, 4] },
      { notation: '马8进7', from: [0, 1], to: [2, 2] }
    ],
    variations: [],
    errorBranches: [
      {
        move: { notation: '马2进3', from: [0, 1], to: [2, 2] },
        message: '此走法会导致失先'
      }
    ]
  };

  test('valid user move advances state', () => {
    const engine = new StrictOpeningEngine(pgnTree);
    const result = engine.handleUserMove([7, 7], [7, 4]);
    expect(result.type).toBe('valid');
    expect(engine.currentStep).toBe(1);
  });

  test('illegal move is rejected', () => {
    const engine = new StrictOpeningEngine(pgnTree);
    const result = engine.handleUserMove([9, 0], [9, 1]);
    expect(result.type).toBe('illegal');
  });

  test('non-book move is rejected with message', () => {
    const engine = new StrictOpeningEngine(pgnTree);
    const result = engine.handleUserMove([7, 7], [8, 7]);
    expect(result.type).toBe('non-book');
    expect(result.message).toContain('请再回去继续学习');
  });

  test('AI responds with next book move', () => {
    const engine = new StrictOpeningEngine(pgnTree);
    engine.handleUserMove([7, 7], [7, 4]);
    const ai = engine.getAIMove();
    expect(ai).toEqual({ notation: '马8进7', from: [0, 1], to: [2, 2] });
  });
});
