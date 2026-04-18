const openings = {
  'zhongpao-pingfengma': require('./zhongpao-pingfengma'),
  'feixiang-kaiqu': require('./feixiang-kaiqu'),
}

const categories = [
  {
    id: 'zhongpao',
    name: '中炮',
    icon: '/static/images/tabs/zhongpao.png',
    openings: [
      {
        id: 'zhongpao-pingfengma',
        name: '中炮对屏风马',
        image: '/static/images/openings/zhongpao-pingfengma.png',
        locked: false,
        videoUrl: '',
        description: '最稳健的中炮应法，左右均衡，可刚可柔，是职业棋手的主流选择。'
      }
    ]
  },
  {
    id: 'feixiang',
    name: '飞相局',
    icon: '/static/images/tabs/feixiang.png',
    openings: [
      {
        id: 'feixiang-kaiqu',
        name: '飞相局体系',
        image: '/static/images/openings/feixiang-kaiqu.png',
        locked: false,
        videoUrl: '',
        description: '稳健开局，第一步飞相护住中路，避免激烈对攻，适合求稳风格。'
      }
    ]
  },
  {
    id: 'qipan',
    name: '起马局',
    icon: '/static/images/tabs/qipan.png',
    openings: [
      {
        id: 'zhongpao-pingfengma',
        name: '中炮对起马局',
        image: '/static/images/openings/zhongpao-pingfengma.png',
        locked: false,
        videoUrl: '',
        description: '冷手开局，出其不意。'
      }
    ]
  }
]

module.exports = { openings, categories }
