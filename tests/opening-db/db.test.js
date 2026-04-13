const { OpeningDB } = require('../../utils/opening-db/db');

describe('OpeningDB', () => {
  const db = new OpeningDB([
    { id: 'c1', category: '中炮', name: '中炮对屏风马', pgn: '1. 炮二平五 马8进7', locked: false },
    { id: 'c2', category: '中炮', name: '中炮对反宫马', pgn: '1. 炮二平五 马2进3', locked: true }
  ]);

  test('get categories', () => {
    expect(db.getCategories()).toEqual(['中炮']);
  });

  test('get openings by category', () => {
    const c = db.getOpeningsByCategory('中炮');
    expect(c.length).toBe(2);
    expect(c[0].locked).toBe(false);
  });

  test('find opening by id', () => {
    const o = db.getOpeningById('c1');
    expect(o.name).toBe('中炮对屏风马');
  });

  test('filter unlocked openings', () => {
    const u = db.getUnlockedOpenings();
    expect(u.length).toBe(1);
    expect(u[0].id).toBe('c1');
  });
});
