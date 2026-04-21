const { launch, close } = require('./utils')

describe('棋谱列表页', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    miniProgram = await launch()
  })

  afterAll(async () => {
    await close()
  })

  beforeEach(async () => {
    page = await miniProgram.reLaunch('/pages/opening/opening')
    await page.waitFor(800)
  })

  test('页面加载后显示分类标签', async () => {
    const data = await page.data()
    expect(data.categories).toBeDefined()
    expect(data.categories.length).toBeGreaterThan(0)
  })

  test('默认选中第一个分类', async () => {
    const data = await page.data()
    expect(data.selectedCategoryIndex).toBe(0)
  })

  test('切换分类更新棋谱列表', async () => {
    const dataBefore = await page.data()
    const firstOpenings = dataBefore.openings

    // 获取所有分类标签
    const tabs = await page.$$('.tab-item')
    if (tabs.length > 1) {
      await tabs[1].tap()
      await page.waitFor(500)

      const dataAfter = await page.data()
      expect(dataAfter.selectedCategoryIndex).toBe(1)
    }
  })

  test('点击棋谱项跳转到游戏页', async () => {
    const items = await page.$$('.opening-item')
    if (items.length > 0) {
      await items[0].tap()
      await page.waitFor(1000)

      const currentPage = await miniProgram.currentPage()
      expect(currentPage.path).toContain('pages/game/game')
    }
  })
})
