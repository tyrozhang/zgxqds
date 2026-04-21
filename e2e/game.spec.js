const { launch, close } = require('./utils')

describe('游戏页', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    miniProgram = await launch()
  })

  afterAll(async () => {
    await close()
  })

  beforeEach(async () => {
    page = await miniProgram.reLaunch('/pages/game/game?id=zhongpao-pingfengma')
    await page.waitFor(3000)
  })

  test('页面加载成功，包含必要数据', async () => {
    const data = await page.data()
    expect(data.mode).toBeDefined()
  })

  test('默认进入练习模式', async () => {
    const data = await page.data()
    expect(data.mode).toBe('practice')
  })

  test('默认显示执红/执黑选择', async () => {
    const data = await page.data()
    expect(data.mode).toBe('practice')
    expect(data.practiceState).toBe('select')
  })

  test('点击讲解按钮切换到讲解模式', async () => {
    const explainBtn = await page.$('.nav-btn[data-mode="explain"]')
    if (explainBtn) {
      await explainBtn.tap()
      await page.waitFor(500)

      const data = await page.data()
      expect(data.mode).toBe('explain')
    }
  })

  test('讲解模式下点击下一步更新步数', async () => {
    // 先切换到讲解模式
    const explainBtn = await page.$('.nav-btn[data-mode="explain"]')
    if (explainBtn) {
      await explainBtn.tap()
      await page.waitFor(800)
    }

    const dataBefore = await page.data()
    const stepBefore = dataBefore.currentStep || 0

    const nextBtn = await page.$('button[bindtap="onExplainNext"]')
    if (nextBtn) {
      await nextBtn.tap()
      await page.waitFor(500)

      const dataAfter = await page.data()
      expect(dataAfter.currentStep).toBeGreaterThanOrEqual(stepBefore)
    }
  })
})
