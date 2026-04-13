const { OpeningDB } = require('../../utils/opening-db/db');

global.wx = {
  getStorageSync: jest.fn(() => [])
};

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

  test('empty database behavior', () => {
    const empty = new OpeningDB([]);
    expect(empty.getCategories()).toEqual([]);
    expect(empty.getUnlockedOpenings()).toEqual([]);
  });

  test('getOpeningById returns null for missing id', () => {
    expect(db.getOpeningById('missing')).toBeNull();
  });

  test('isLocked returns true for missing id', () => {
    expect(db.isLocked('missing')).toBe(true);
  });

  test('multi-category scenario', () => {
    const multi = new OpeningDB([
      { id: 'a1', category: '中炮', name: '中炮对屏风马', pgn: '1. 炮二平五 马8进7', locked: false },
      { id: 'b1', category: '飞相局', name: '飞相对过宫炮', pgn: '1. 相三进五 炮8平4', locked: false }
    ]);
    expect(multi.getCategories()).toEqual(['中炮', '飞相局']);
  });

  test('loads real openings.json data', () => {
    const data = require('../../utils/opening-db/data/openings.json');
    const real = new OpeningDB(data);
    expect(real.getCategories().length).toBeGreaterThanOrEqual(1);
    expect(real.data.length).toBeGreaterThanOrEqual(1);
  });
});
