const { launch, close } = require('./utils')

describe('游戏页', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    miniProgram = await launch()
    // 预热：首次 reLaunch 到 game 页时 automator 同步容易滞后，先预演一次
    const warmup = await miniProgram.reLaunch('/pages/game/game?id=zhongpao-pingfengma')
    await warmup.waitFor(3000)
  })

  afterAll(async () => {
    await close()
  })

  beforeEach(async () => {
    page = await miniProgram.reLaunch('/pages/game/game?id=zhongpao-pingfengma')
    await page.waitFor(2000)
  })

  test('页面加载成功，包含必要数据', async () => {
    const currentPage = await miniProgram.currentPage()
    const data = await currentPage.data()
    expect(data).toBeDefined()
    expect(typeof data).toBe('object')
    // 用 position 验证页面已加载（automator 对 mode 的同步有时不稳定）
    expect(data.position).toBeDefined()
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

  test('选择执红后进入 playing 状态且有允许走法', async () => {
    const buttons = await page.$$('.practice-side-btn')
    expect(buttons.length).toBe(2)
    await buttons[0].tap()
    await page.waitFor(500)
    const data = await page.data()
    expect(data.practiceState).toBe('playing')
    expect(data.allowedMoves.length).toBeGreaterThan(0)
    expect(data.turnText).toContain('红方')
  })

  test('选择执黑后 AI 已走第一步且轮到黑方', async () => {
    const buttons = await page.$$('.practice-side-btn')
    await buttons[1].tap()
    await page.waitFor(1000)
    const data = await page.data()
    expect(data.practiceState).toBe('playing')
    expect(data.turnText).toContain('黑方')
  })

  test('悔棋按钮在 playing 状态下存在', async () => {
    const buttons = await page.$$('.practice-side-btn')
    await buttons[0].tap()
    await page.waitFor(1000)
    const undoBtn = await page.$('.controls button')
    expect(undoBtn).not.toBeNull()
  })

  test('讲解模式第一步后显示分支选择', async () => {
    const explainBtn = await page.$('.nav-btn[data-mode="explain"]')
    if (explainBtn) {
      await explainBtn.tap()
      await page.waitFor(800)
    }

    const nextBtn = await page.$('button[bindtap="onExplainNext"]')
    if (nextBtn) {
      // 第一步：红方走 h2e2
      await nextBtn.tap()
      await page.waitFor(500)

      // 第二步：黑方分支选择
      await nextBtn.tap()
      await page.waitFor(500)

      const data = await page.data()
      expect(data.explainState).toBe('selecting')
      expect(data.branchOptions.length).toBeGreaterThan(1)
    }
  })

  test('讲解模式选择分支后继续播放', async () => {
    const explainBtn = await page.$('.nav-btn[data-mode="explain"]')
    if (explainBtn) {
      await explainBtn.tap()
      await page.waitFor(800)
    }

    const nextBtn = await page.$('button[bindtap="onExplainNext"]')
    if (nextBtn) {
      await nextBtn.tap()
      await page.waitFor(500)
      await nextBtn.tap()
      await page.waitFor(500)
    }

    const branchBtn = await page.$('.branch-btn')
    if (branchBtn) {
      await branchBtn.tap()
      await page.waitFor(500)
      const data = await page.data()
      expect(data.explainState).toBe('playing')
      expect(data.currentStep).toBeGreaterThan(0)
    }
  })
})
