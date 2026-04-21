const { launch, close } = require('./utils')

describe('个人中心页', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    miniProgram = await launch()
  })

  afterAll(async () => {
    await close()
  })

  beforeEach(async () => {
    page = await miniProgram.reLaunch('/pages/profile/profile')
    await page.waitFor(1500)
  })

  test('页面加载成功', async () => {
    const data = await page.data()
    expect(data).toBeDefined()
  })

  test('默认未登录状态显示登录按钮', async () => {
    const loginBtn = await page.$('.login-btn')
    expect(loginBtn).not.toBeNull()
    const data = await page.data()
    expect(data.hasUserInfo).toBe(false)
  })

  test('默认已购开局为空', async () => {
    const data = await page.data()
    expect(data.unlockedList).toEqual([])
    const emptyText = await page.$('.empty')
    expect(emptyText).not.toBeNull()
  })

  test('默认音效开启', async () => {
    const data = await page.data()
    expect(data.soundEnabled).toBe(true)
  })
})
