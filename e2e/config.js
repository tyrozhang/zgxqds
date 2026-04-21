const path = require('path')

/**
 * 小程序自动化测试配置
 *
 * 使用前请确认：
 * 1. 已安装微信开发者工具
 * 2. 开发者工具已登录微信账号
 * 3. 开发者工具设置中已开启「安全 → 服务端口」
 */
const config = {
  // 小程序项目绝对路径
  projectPath: path.resolve(__dirname, '..'),

  // 微信开发者工具 CLI 路径
  // 微信开发者工具 CLI 路径
  // Windows 默认路径如下，请根据实际情况修改
  cliPath: 'D:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',

  // 超时时间（毫秒）
  timeout: 30000,
}

module.exports = config
