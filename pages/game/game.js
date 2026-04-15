const Xiangqi = require('../../utils/xiangqi')

// 示例棋谱树：中炮对屏风马（用于验证严格棋谱模式逻辑链）
// 实际项目应从本地 JSON 加载
const SAMPLE_OPENING_TREE = {
  move: '',
  comment: '初始局面',
  children: [
    {
      move: 'h2e2',
      comment: '中炮（炮八平五）',
      children: [
        {
          move: 'h9g7',
          comment: '屏风马（马8进7）',
          children: [
            {
              move: 'b0c2',
              comment: '马二进三（主变正着）',
              isMainLine: true,
              children: [
                {
                  move: 'i9h9',
                  comment: '车9平8',
                  children: []
                }
              ]
            },
            {
              move: 'e3e4',
              comment: '兵五进一（变例）',
              children: [
                {
                  move: 'e6e5',
                  comment: '卒5进1',
                  children: [
                    {
                      move: 'e4e5',
                      comment: '兵吃卒',
                      children: []
                    }
                  ]
                }
              ]
            },
            {
              move: 'a0a2',
              comment: '车九进二（典型错误）',
              isTypicalError: true,
              errorComment: '过早动车，易导致失先',
              children: [
                {
                  move: 'i9i7',
                  comment: '车1进2',
                  children: []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

function buildNodeMap(node, parent = null) {
  node.parent = parent
  node.moveMap = {}
  if (node.children) {
    node.children.forEach(child => {
      node.moveMap[child.move] = child
      buildNodeMap(child, node)
    })
  }
  return node
}

Page({
  data: {
    position: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR',
    orientation: 'red',
    turnText: '红方走',
    statusText: '',
    allowedMoves: []
  },

  engine: null,
  openingTree: null,
  currentNode: null,
  isAiThinking: false,

  onLoad(options) {
    // 选项示例：{ side: 'red' | 'black' }
    this.initGame(options.side || 'red')
  },

  onReady() {
    this.board = this.selectComponent('#board')
  },

  initGame(side) {
    this.engine = new Xiangqi()
    this.openingTree = buildNodeMap(JSON.parse(JSON.stringify(SAMPLE_OPENING_TREE)))
    this.currentNode = this.openingTree

    const orientation = side === 'black' ? 'black' : 'red'
    this.setData({
      position: this.engine.fen().split(' ')[0],
      orientation,
      turnText: this.getTurnText(),
      statusText: '',
      allowedMoves: this.getAllowedMoves()
    })

    // 若用户选择后手，AI（红方）先走
    if (side === 'black') {
      this.playAiMove()
    }
  },

  getAllowedMoves() {
    if (!this.currentNode || !this.currentNode.moveMap) return []
    return Object.keys(this.currentNode.moveMap)
  },

  getTurnText() {
    const turn = this.engine.turn()
    const color = turn === 'r' ? '红方' : '黑方'
    return color + '走'
  },

  // 核心：严格棋谱模式走子验证
  onBeforeDrop(e) {
    if (this.isAiThinking) {
      e.detail.prevent()
      return
    }

    const { source, square: target, piece, prevent } = e.detail

    // 调试日志：帮助排查坐标与匹配问题
    const available = this.getAllowedMoves()
    const moveKey = source + target
    console.log('[onBeforeDrop]', source, '->', target, 'moveKey:', moveKey, 'available:', available)

    // 1. 引擎验证合法性
    const moveResult = this.engine.move({ from: source, to: target })
    if (!moveResult) {
      console.log('[onBeforeDrop] 引擎判定非法走法')
      prevent() // 非法走法，棋子弹回
      return
    }

    // 2. 棋谱树匹配
    const branch = this.currentNode.moveMap[moveKey]

    if (!branch) {
      // 非棋谱走法
      console.log('[onBeforeDrop] 非棋谱走法，已拦截')
      prevent()
      this.engine.undo() // 回退引擎状态
      wx.showToast({
        title: '非当前棋谱棋路，请再回去继续学习当前棋谱吧~',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 3. 典型错误分支提示
    if (branch.isTypicalError) {
      wx.showToast({
        title: branch.errorComment || '此走法有待商榷',
        icon: 'none',
        duration: 2000
      })
    }

    // 允许走子，更新棋谱树节点
    this.currentNode = branch
    this.setData({
      turnText: this.getTurnText(),
      statusText: branch.comment || '',
      allowedMoves: this.getAllowedMoves()
    })

    // AI 回应
    this.isAiThinking = true
    setTimeout(() => {
      this.playAiMove()
      this.isAiThinking = false
    }, 400)
  },

  onBoardDrop(e) {
    const { source, square: target } = e.detail
    this.setData({ lastMove: { source, target } })
  },

  onMoveEnd() {
    // 动画结束后的统一处理已在 AI 走子中完成
  },

  playAiMove() {
    if (!this.currentNode.children || this.currentNode.children.length === 0) {
      // 棋谱结束，检查胜负
      this.checkGameOver()
      return
    }

    const aiBranch = this.currentNode.children[0]
    const moveKey = aiBranch.move
    const from = moveKey.slice(0, 2)
    const to = moveKey.slice(2, 4)

    // 更新引擎状态
    this.engine.move({ from, to })

    // 棋盘播放动画
    if (this.board) {
      this.board.move(from + '-' + to, true)
    }

    this.currentNode = aiBranch
    this.setData({
      turnText: this.getTurnText(),
      statusText: aiBranch.comment || '',
      lastMove: { source: from, target: to },
      allowedMoves: this.getAllowedMoves()
    })
  },

  checkGameOver() {
    if (this.engine.game_over()) {
      let result = ''
      if (this.engine.in_checkmate()) {
        result = this.engine.turn() === 'r' ? '黑方胜' : '红方胜'
      } else if (this.engine.in_draw()) {
        result = '和棋'
      } else {
        result = '对局结束'
      }

      wx.showModal({
        title: '对局结束',
        content: result,
        showCancel: false,
        confirmText: '重新练习',
        success: () => {
          this.onRestart()
        }
      })
    }
  },

  onUndo() {
    if (this.isAiThinking) return

    // 必须悔两步（用户一步 + AI 一步）
    const history = this.engine.history()
    if (history.length < 2) {
      wx.showToast({ title: '无法继续悔棋', icon: 'none' })
      return
    }

    this.engine.undo()
    this.engine.undo()

    // 同步棋盘
    const fen = this.engine.fen().split(' ')[0]
    if (this.board) {
      this.board.position(fen, false)
    }

    // 回退棋谱树指针两步
    if (this.currentNode && this.currentNode.parent && this.currentNode.parent.parent) {
      this.currentNode = this.currentNode.parent.parent
    } else {
      this.currentNode = this.openingTree
    }

    this.setData({
      position: fen,
      turnText: this.getTurnText(),
      statusText: this.currentNode.comment || '',
      lastMove: null,
      allowedMoves: this.getAllowedMoves()
    })
  },

  onRestart() {
    this.initGame(this.data.orientation === 'red' ? 'red' : 'black')
    const fen = this.engine.fen().split(' ')[0]
    if (this.board) {
      this.board.position(fen, false)
    }
    this.setData({
      position: fen,
      statusText: '',
      lastMove: null,
      allowedMoves: this.getAllowedMoves()
    })
  },

  onBack() {
    wx.navigateBack()
  }
})
