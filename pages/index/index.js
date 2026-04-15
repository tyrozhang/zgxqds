Page({
  data: {
    lastEvent: ''
  },

  onReady() {
    this.board = this.selectComponent('#board')
  },

  onBoardChange(e) {
    this.setData({ lastEvent: 'change: ' + JSON.stringify(e.detail.newPos).slice(0, 60) })
  },

  onBoardDrop(e) {
    this.setData({ lastEvent: 'drop: ' + e.detail.source + ' -> ' + e.detail.square })
  },

  onDragStart(e) {
    this.setData({ lastEvent: 'dragstart: ' + e.detail.piece + ' @ ' + e.detail.source })
  },

  onMoveEnd(e) {
    this.setData({ lastEvent: 'moveend' })
  },

  onSnapbackEnd(e) {
    this.setData({ lastEvent: 'snapbackend' })
  },

  onFlip() {
    if (this.board) this.board.flip()
  },

  onStart() {
    if (this.board) this.board.start(true)
  },

  onClear() {
    if (this.board) this.board.clear(true)
  },

  onMove() {
    if (this.board) {
      // 示例：炮二平五
      this.board.move('h3-h4', true)
    }
  }
})
