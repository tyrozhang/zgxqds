class OpeningDB {
  constructor(data = []) {
    this.data = data;
  }

  getCategories() {
    return [...new Set(this.data.map(o => o.category))];
  }

  getOpeningsByCategory(category) {
    return this.data.filter(o => o.category === category);
  }

  getOpeningById(id) {
    return this.data.find(o => o.id === id) || null;
  }

  getUnlockedOpenings() {
    return this.data.filter(o => !o.locked);
  }

  isLocked(id) {
    const o = this.getOpeningById(id);
    return o ? o.locked : true;
  }

  unlock(id) {
    const o = this.getOpeningById(id);
    if (o) o.locked = false;
  }
}

module.exports = { OpeningDB };
