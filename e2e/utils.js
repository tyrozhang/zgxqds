const { spawn, exec } = require('child_process')
const automator = require('miniprogram-automator')
const config = require('./config')

let miniProgram = null
let devtoolsChild = null

/**
 * 清理残留的微信开发者工具进程
 */
function killResidualDevtools() {
  return new Promise((resolve) => {
    exec('taskkill /F /IM wechatdevtools.exe 2>nul', () => {
      // 无论是否成功都继续，可能没有残留进程
      resolve()
    })
  })
}

/**
 * 启动小程序并返回实例
 *
 * 注意：
 * 1. Node.js v20+ 在 Windows 上禁止 spawn 直接运行 .bat 文件，需用 shell: true
 * 2. 必须保持 stdin 开放，才能自动确认开启服务端口（echo y | 会因 EOF 导致 CLI 退出）
 * 3. 启动前需清理残留的 IDE 进程，否则 CLI 端口检测会混乱
 */
async function launch() {
  if (miniProgram) return miniProgram

  // 先清理残留进程
  await killResidualDevtools()
  await sleep(2000)

  const port = config.port || 9420
  const cliPath = config.cliPath
  const projectPath = config.projectPath
  const args = [
    'auto',
    '--project',
    projectPath,
    '--auto-port',
    String(port),
  ]

  // shell: true 时 args 会被直接拼接，路径含空格需加引号
  const quotedCli = `"${cliPath}"`
  const quotedArgs = args.map((a) => `"${a}"`)

  devtoolsChild = spawn(quotedCli, quotedArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    windowsHide: true,
  })

  let spawnError = null
  let confirmed = false

  devtoolsChild.on('error', (err) => {
    spawnError = err
  })

  devtoolsChild.stdout.on('data', (data) => {
    const text = data.toString()
    // 检测到服务端口关闭的提示时，自动输入 y 确认开启
    if (
      !confirmed &&
      (text.includes('Enable IDE Service') || text.includes('服务端口'))
    ) {
      confirmed = true
      devtoolsChild.stdin.write('y\n')
    }
  })

  devtoolsChild.stderr.on('data', (data) => {
    const text = data.toString()
    if (
      !confirmed &&
      (text.includes('Enable IDE Service') || text.includes('服务端口'))
    ) {
      confirmed = true
      devtoolsChild.stdin.write('y\n')
    }
  })

  // 等待开发者工具启动并开放 WebSocket 端口
  const startTime = Date.now()
  const timeout = config.timeout || 60000

  while (Date.now() - startTime < timeout) {
    if (spawnError) {
      throw new Error(
        `Failed to spawn devTools CLI: ${spawnError.message}`
      )
    }

    try {
      miniProgram = await automator.connect({
        wsEndpoint: `ws://127.0.0.1:${port}`,
      })
      break
    } catch {
      // 端口尚未就绪，继续等待
      await sleep(2000)
    }
  }

  if (!miniProgram) {
    throw new Error(
      'Failed to connect to wechat web devTools. ' +
        'Please make sure:\n' +
        '1. 微信开发者工具已安装\n' +
        '2. 已登录微信账号\n' +
        '3. 设置 → 安全 → 服务端口 已开启'
    )
  }

  return miniProgram
}

/**
 * 关闭小程序
 */
async function close() {
  if (miniProgram) {
    await miniProgram.close()
    miniProgram = null
  }
  if (devtoolsChild) {
    devtoolsChild.kill()
    devtoolsChild = null
  }
}

/**
 * 获取当前小程序实例（需先调用 launch）
 */
function getMiniProgram() {
  return miniProgram
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
  launch,
  close,
  getMiniProgram,
}
