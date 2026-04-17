const openings = {
  'zhongpao-pingfengma': require('./zhongpao-pingfengma'),
  'feixiang-kaiqu': require('./feixiang-kaiqu'),
}

const categories = [
  {
    id: 'zhongpao',
    name: '中炮',
    openings: [
      {
        id: 'zhongpao-pingfengma',
        name: '中炮对屏风马',
        locked: false,
        videoUrl: '',
        description: '最稳健的中炮应法，左右均衡，可刚可柔，是职业棋手的主流选择。'
      }
    ]
  },
  {
    id: 'feixiang',
    name: '飞相局',
    openings: [
      {
        id: 'feixiang-kaiqu',
        name: '飞相局体系',
        locked: false,
        videoUrl: '',
        description: '稳健开局，第一步飞相护住中路，避免激烈对攻，适合求稳风格。'
      }
    ]
  }
]

module.exports = { openings, categories }
