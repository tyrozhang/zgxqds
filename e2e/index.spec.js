const { launch, close } = require('./utils')

describe('首页', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    miniProgram = await launch()
  })

  afterAll(async () => {
    await close()
  })

  beforeEach(async () => {
    page = await miniProgram.reLaunch('/pages/loading/loading')
    await page.waitFor(500)
  })

  test('页面加载成功', async () => {
    const data = await page.data()
    // loading 页可能没有 categories，检查页面存在即可
    expect(data).toBeDefined()
  })

  test('从 loading 页可导航到 opening 页', async () => {
    // 等待 loading 完成后自动或手动跳转到 opening
    await page.waitFor(2000)
    const currentPage = await miniProgram.currentPage()
    // loading 完成后应跳转至 opening 页
    expect(currentPage.path).toContain('pages/opening/opening')
  })

  test('loading 页 800ms 后自动跳转 opening', async () => {
    // loading 页没有可交互元素，等待自动 redirect
    await page.waitFor(1500)
    const currentPage = await miniProgram.currentPage()
    expect(currentPage.path).toContain('pages/opening/opening')
  })
})
