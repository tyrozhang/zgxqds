const Xiangqi = require('../../utils/xiangqi')
const openingsData = require('../../data/openings/data')

function convertNewFormatToTree(data) {
  if (!data.moves || !data.moves.length) return null

  function buildNode(moves, isMainLine, startIdx) {
    const node = moves[startIdx]
    let comment = node.comment || ''
    if (node.eval) {
      comment += (comment ? '\n' : '') + 'eval: ' + node.eval
    }

    const result = {
      move: node.move,
      san: node.san,
      isMainLine,
      children: [],
      comment
    }

    if (node.tags) {
      if (node.tags.includes('bad') || node.tags.includes('principle_violation') || node.tags.includes('error')) {
        result.isTypicalError = true
        result.errorComment = node.comment || ''
      }
    }

    if (node.branches && node.branches.length) {
      for (const branch of node.branches) {
        const branchMoves = branch.moves
        if (!branchMoves || !branchMoves.length) continue
        const branchRoot = buildNode(branchMoves, false, 0)
        if (branch.label) {
          branchRoot.comment = '【' + branch.label + '】' + (branchRoot.comment ? ' ' + branchRoot.comment : '')
        }
        result.children.push(branchRoot)
      }
    }

    if (startIdx + 1 < moves.length) {
      result.children.push(buildNode(moves, isMainLine, startIdx + 1))
    }

    return result
  }

  return buildNode(data.moves, true, 0)
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
    allowedMoves: [],
    mode: 'practice',
    practiceState: 'select',
    // 讲解模式相关
    explainState: 'ready',
    explainContent: '',
    currentStep: 0,
    lastMove: null,
    branchOptions: []
  },

  engine: null,
  openingTree: null,
  currentNode: null,
  isAiThinking: false,
  isGameOver: false,
  openingId: '',
  userSide: 'red',
  // 讲解模式专用
  explainNodeList: [],
  explainCurrentIdx: 0,

  onLoad(options) {
    const id = options.id || ''
    const side = options.side === 'black' ? 'black' : 'red'
    this.openingId = id
    this.userSide = side
  },

  onReady() {
    this.board = this.selectComponent('#board')
    this.loadOpeningData(this.openingId, this.userSide)
  },

  onSwitchMode(e) {
    const mode = e.currentTarget.dataset.mode
    // 讲解模式切出时重置practiceState，确保切回练习模式时显示选择界面
    if (this.data.mode === 'explain' && mode === 'practice') {
      this.setData({ mode, practiceState: 'select' })
    } else {
      this.setData({ mode })
    }
    if (mode === 'explain') {
      this.initExplainMode()
    }
  },

  // 初始化讲解模式
  initExplainMode() {
    if (!this.rawTree) return

    this.engine = new Xiangqi()
    this.openingTree = buildNodeMap(JSON.parse(JSON.stringify(this.rawTree)))
    this.currentNode = this.openingTree
    this.isGameOver = false

    // 只加入根节点，后续路径按需展开
    this.explainNodeList = [this.openingTree]
    this.explainCurrentIdx = 0

    // 获取开局简介（如果有的话）
    const openingData = openingsData.openings[this.openingId]
    const intro = (openingData && openingData.meta && openingData.meta.description) ? openingData.meta.description : '本开局无简介'

    this.setData({
      explainState: 'ready',
      explainContent: intro,
      currentStep: 0,
      position: this.engine.fen().split(' ')[0],
      orientation: 'red',
      turnText: '红方走',
      statusText: '',
      lastMove: null,
      allowedMoves: [],
      branchOptions: []
    }, () => {
      // 切换模式后棋盘组件会被重建，需在回调中重新获取引用
      this.board = this.selectComponent('#board')
      if (this.board) {
        this.board.orientation('red')
        this.board.position(this.engine.fen().split(' ')[0], false)
      }
    })
  },


  onSelectPracticeSide(e) {
    const side = e.currentTarget.dataset.side
    this.userSide = side
    this.setData({ practiceState: 'playing' })
    // 每次都重新获取 board 组件引用，因为 practiceState=select 时 board 会被销毁
    this.board = this.selectComponent('#board')
    this.initGame(side, this.rawTree)
  },

  loadOpeningData(id, side) {
    if (!id) {
      wx.showToast({ title: '缺少开局ID', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const openingData = openingsData.openings[id]
    if (openingData) {
      this.initGameWithData(openingData, side)
    } else {
      wx.showToast({ title: '加载棋谱失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  initGameWithData(data, side) {
    const tree = data.tree || convertNewFormatToTree(data)
    const meta = data.meta || {}
    wx.setNavigationBarTitle({ title: meta.name || '棋谱练习' })
    this.rawTree = tree
    this.initGame(side, tree)
  },

  initGame(side, tree) {
    this.engine = new Xiangqi()
    this.openingTree = buildNodeMap(JSON.parse(JSON.stringify(tree || {})))
    this.currentNode = this.openingTree
    this.isGameOver = false

    // 若用户选择后手（执黑），需先自动执行红方的第一步开局
    // 执红时，用户应自行走第一步，不应自动执行
    if (side === 'black' && this.openingTree && this.openingTree.move) {
      const from = this.openingTree.move.slice(0, 2)
      const to = this.openingTree.move.slice(2, 4)
      this.engine.move({ from, to })
      // 保持 currentNode 在根节点，让用户可以选择任意分支（飞象局/起马局/挺卒局）
      // 不要推进到 children[0]，否则只能走固定分支
    }

    // 确保 board 组件已加载（页面返回再进入时 onReady 可能不触发）
    if (!this.board) {
      this.board = this.selectComponent('#board')
    }
    if (this.board) {
      this.board.orientation(side)
    }
    const fen = this.engine.fen().split(' ')[0]
    this.setData({
      position: fen,
      side,
      turnText: this.getTurnText(),
      statusText: '',
      allowedMoves: this.getAllowedMoves()
    })

    // 确保 board 与引擎状态同步
    if (this.board) {
      this.board.position(fen, false)
    }
  },

  getAllowedMoves() {
    if (!this.currentNode || !this.currentNode.moveMap) return []

    // 如果当前是树的根节点（开局位置），且轮到红方走，
    // 说明第一步还未走，getAllowedMoves 应该返回第一步走法
    if (this.currentNode === this.openingTree && this.engine.turn() === 'r') {
      return [this.currentNode.move]
    }

    return Object.keys(this.currentNode.moveMap)
  },

  getTurnText() {
    const turn = this.engine.turn()
    const color = turn === 'r' ? '红方' : '黑方'
    return color + '走'
  },

  getStatusText() {
    const hasChildren = this.currentNode && this.currentNode.children && this.currentNode.children.length > 0
    if (!hasChildren) return '棋谱练习已结束'
    return this.currentNode.comment || ''
  },

  // 核心：严格棋谱模式走子验证
  onBeforeDrop(e) {
    // 讲解模式下禁止手动走子
    if (this.data.mode === 'explain') {
      e.detail.prevent()
      return
    }

    if (this.isAiThinking || this.isGameOver) {
      e.detail.prevent()
      return
    }

    const { source, square: target, piece, prevent } = e.detail

    // 调试日志：帮助排查坐标与匹配问题
    const available = this.getAllowedMoves()
    if (available.length === 0) {
      console.log('[onBeforeDrop] 棋谱已结束，已拦截')
      prevent()
      wx.showToast({
        title: '棋谱练习已结束',
        icon: 'none',
        duration: 2000
      })
      return
    }

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
    // 注意：根节点自己的 move（如 h2e2）不在 moveMap 中，而是存储在 currentNode.move
    // 如果 moveKey 匹配 currentNode.move，说明要走的是当前节点的走法（用于首步或切换分支）
    let branch = this.currentNode.moveMap[moveKey]
    if (!branch && this.currentNode.move === moveKey) {
      // 走的是当前节点的走法本身
      branch = this.currentNode
    }

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
      statusText: this.getStatusText(),
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
      this.isGameOver = true
      this.checkGameOver()
      return
    }

    // 随机选择一个分支
    const randomIdx = Math.floor(Math.random() * this.currentNode.children.length)
    const aiBranch = this.currentNode.children[randomIdx]
    const moveKey = aiBranch.move
    const from = moveKey.slice(0, 2)
    const to = moveKey.slice(2, 4)

    // 更新引擎状态
    const moveResult = this.engine.move({ from, to })
    if (!moveResult) {
      console.error('[playAiMove] 棋谱数据存在非法走法:', aiBranch.san || moveKey)
      this.isGameOver = true
      this.setData({
        statusText: '棋谱数据异常: ' + (aiBranch.san || moveKey),
        allowedMoves: []
      })
      wx.showToast({ title: '棋谱数据异常', icon: 'none' })
      return
    }

    // 棋盘播放动画
    if (this.board) {
      this.board.move(from + '-' + to, true)
    }

    this.currentNode = aiBranch
    this.setData({
      turnText: this.getTurnText(),
      statusText: this.getStatusText(),
      lastMove: { source: from, target: to },
      allowedMoves: this.getAllowedMoves()
    })
  },

  checkGameOver() {
    const isOpeningEnd = !this.currentNode.children || this.currentNode.children.length === 0
    if (this.engine.game_over() || isOpeningEnd) {
      this.isGameOver = true
      let result = ''
      if (this.engine.in_checkmate()) {
        result = this.engine.turn() === 'r' ? '黑方胜' : '红方胜'
      } else if (this.engine.in_draw()) {
        result = '和棋'
      } else if (isOpeningEnd) {
        result = '你已经完成了本开局的主变练习'
      } else {
        result = '对局结束'
      }

      const title = isOpeningEnd ? '棋谱练习结束' : '对局结束'
      wx.showModal({
        title,
        content: result,
        confirmText: '重新练习',
        cancelText: '返回首页',
        success: (res) => {
          if (res.confirm) {
            this.onRestart()
          } else {
            wx.redirectTo({ url: '/pages/index/index' })
          }
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

    this.isGameOver = false

    this.setData({
      position: fen,
      turnText: this.getTurnText(),
      statusText: this.getStatusText(),
      lastMove: null,
      allowedMoves: this.getAllowedMoves()
    })
  },

  onRestart() {
    // 重新初始化游戏，保持用户之前选择的执棋方
    this.initGame(this.userSide, this.rawTree)
  },

  // 讲解模式：下一步
  onExplainNext() {
    if (this.data.explainState === 'selecting') {
      wx.showToast({ title: '请先选择一个分支', icon: 'none' })
      return
    }

    // 如果已走完 explainNodeList 中所有节点，需从当前节点展开下一步
    if (this.explainCurrentIdx >= this.explainNodeList.length) {
      const currentNode = this.explainNodeList[this.explainNodeList.length - 1]

      if (!currentNode.children || currentNode.children.length === 0) {
        this.setData({
          explainState: 'finished',
          explainContent: currentNode.comment || '本开局讲解已结束'
        })
        return
      }

      if (currentNode.children.length > 1) {
        const options = currentNode.children.map((c, i) => {
          const labelMatch = c.comment ? c.comment.match(/^【(.+?)】/) : null
          return {
            index: i,
            move: c.move,
            san: c.san,
            label: labelMatch ? labelMatch[1] : ''
          }
        })
        this.setData({
          explainState: 'selecting',
          branchOptions: options
        })
        return
      }

      // 唯一分支，自动加入路径
      this.explainNodeList.push(currentNode.children[0])
    }

    // 从 explainNodeList 中取出下一步并执行
    const nextNode = this.explainNodeList[this.explainCurrentIdx]
    this.explainCurrentIdx++

    if (nextNode.move) {
      const from = nextNode.move.slice(0, 2)
      const to = nextNode.move.slice(2, 4)
      const moveResult = this.engine.move({ from, to })
      if (moveResult) {
        if (this.board) {
          this.board.move(from + '-' + to, true)
        }
        this.currentNode = nextNode
        this.setData({
          position: this.engine.fen().split(' ')[0],
          turnText: this.getTurnText(),
          lastMove: { source: from, target: to },
          explainContent: nextNode.comment || '',
          currentStep: this.explainCurrentIdx,
          explainState: 'playing'
        })
      } else {
        this.explainCurrentIdx--
      }
    }
  },

  // 讲解模式：选择分支
  onSelectBranch(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    const currentNode = this.explainNodeList[this.explainNodeList.length - 1]
    const selectedBranch = currentNode.children[idx]
    this.explainNodeList.push(selectedBranch)

    const from = selectedBranch.move.slice(0, 2)
    const to = selectedBranch.move.slice(2, 4)
    const moveResult = this.engine.move({ from, to })
    if (moveResult) {
      this.explainCurrentIdx++
      if (this.board) {
        this.board.move(from + '-' + to, true)
      }
      this.currentNode = selectedBranch
      this.setData({
        position: this.engine.fen().split(' ')[0],
        turnText: this.getTurnText(),
        lastMove: { source: from, target: to },
        explainContent: selectedBranch.comment || '',
        currentStep: this.explainCurrentIdx,
        explainState: 'playing',
        branchOptions: []
      })
    }
  },

  // 讲解模式：上一步
  onExplainPrev() {
    if (this.explainCurrentIdx <= 0) {
      wx.showToast({ title: '已是最开始', icon: 'none' })
      return
    }

    this.engine.undo()
    this.explainCurrentIdx--

    // 截断 explainNodeList，只保留已走过的节点
    this.explainNodeList = this.explainNodeList.slice(0, this.explainCurrentIdx)

    this.currentNode = this.explainCurrentIdx > 0 ? this.explainNodeList[this.explainCurrentIdx - 1] : this.openingTree

    // 同步棋盘
    const fen = this.engine.fen().split(' ')[0]
    if (this.board) {
      this.board.position(fen, false)
    }

    // 获取内容
    let content = ''
    if (this.explainCurrentIdx === 0) {
      const openingData = openingsData.openings[this.openingId]
      content = (openingData && openingData.meta && openingData.meta.description) ? openingData.meta.description : '本开局无简介'
    } else {
      content = this.currentNode.comment || ''
    }

    this.setData({
      position: fen,
      turnText: this.getTurnText(),
      lastMove: null,
      explainContent: content,
      currentStep: this.explainCurrentIdx,
      explainState: 'playing',
      branchOptions: []
    })
  },

  // 讲解模式：重新开始
  onExplainRestart() {
    this.engine = new Xiangqi()
    this.openingTree = buildNodeMap(JSON.parse(JSON.stringify(this.rawTree)))
    this.currentNode = this.openingTree
    this.explainNodeList = [this.openingTree]
    this.explainCurrentIdx = 0

    if (this.board) {
      this.board.position(this.engine.fen().split(' ')[0], false)
    }

    const openingData = openingsData.openings[this.openingId]
    const intro = (openingData && openingData.meta && openingData.meta.description) ? openingData.meta.description : '本开局无简介'

    this.setData({
      position: this.engine.fen().split(' ')[0],
      turnText: '红方走',
      lastMove: null,
      explainContent: intro,
      currentStep: 0,
      explainState: 'ready',
      branchOptions: []
    })
  },

  onBack() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
