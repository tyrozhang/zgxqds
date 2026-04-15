const {
  fenToObj,
  objToFen,
  validFen,
  validPositionObject,
  validSquare,
  validMove,
  deepCopy,
  calculatePositionFromMoves,
  calculateAnimations,
  COLUMNS,
  ROW_TOP,
  ROW_LOW,
  START_POSITION
} = require('../../utils/chess-utils')

Component({
  properties: {
    position: { type: null, value: 'start', observer: '_positionChanged' },
    orientation: { type: String, value: 'red', observer: '_orientationChanged' },
    draggable: { type: Boolean, value: false },
    showNotation: { type: Boolean, value: false },
    pieceTheme: { type: String, value: '/static/pieces/wikimedia/{piece}.png' },
    boardTheme: { type: String, value: '/static/boards/wikimedia/xiangqiboard.png' },
    moveSpeed: { type: Number, value: 200 },
    snapbackSpeed: { type: Number, value: 60 },
    snapSpeed: { type: Number, value: 30 },
    trashSpeed: { type: Number, value: 100 },
    appearSpeed: { type: Number, value: 200 },
    dropOffBoard: { type: String, value: 'snapback' },
    moveSound: { type: String, value: '', observer: '_soundChanged' },
    checkSound: { type: String, value: '', observer: '_soundChanged' }
  },

  data: {
    canvasWidth: 300,
    canvasHeight: 333,
    squareSize: 33.33,
    currentPosition: {},
    currentOrientation: 'red',
    isDragging: false,
    draggedPiece: null,
    draggedPieceSource: null,
    lastMove: null
  },

  canvas: null,
  ctx: null,
  boardImage: null,
  pieceImages: {},
  dpr: 1,
  activeAnimations: [],
  animationFrameId: null,
  initialized: false,
  animationBasePosition: null,
  _animationOldPos: null,
  _pendingPosition: null,
  _moveAudio: null,
  _checkAudio: null,

  lifetimes: {
    attached() {
      this.pieceImages = {}
      this.activeAnimations = []
      this._moveAudio = null
      this._checkAudio = null
      this.setData({
        currentOrientation: this.properties.orientation
      })
      this._initPosition(this.properties.position)
      this._initSounds()
    },

    ready() {
      this._initCanvas()
    }
  },

  methods: {
    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    position(pos, useAnimation) {
      if (arguments.length === 0) {
        return deepCopy(this.data.currentPosition)
      }

      if (typeof pos === 'string' && pos.toLowerCase() === 'fen') {
        return objToFen(this.data.currentPosition)
      }

      if (typeof pos === 'string' && pos.toLowerCase() === 'start') {
        pos = deepCopy(START_POSITION)
      } else if (validFen(pos)) {
        pos = fenToObj(pos)
      }

      if (!validPositionObject(pos)) {
        // eslint-disable-next-line no-console
        console.error('Xiangqiboard: Invalid value passed to position method.', pos)
        return
      }

      if (useAnimation !== false) useAnimation = true

      this.setData({ lastMove: null })

      const oldPos = deepCopy(this.data.currentPosition)

      if (useAnimation) {
        const animations = calculateAnimations(oldPos, pos)
        this._triggerChange(oldPos, pos)
        this.animationBasePosition = deepCopy(oldPos)
        this._animationOldPos = oldPos
        this._pendingPosition = deepCopy(pos)
        this._doAnimations(animations, oldPos, pos)
      } else {
        this.setData({ currentPosition: deepCopy(pos) }, () => {
          this.draw()
        })
        this._triggerChange(oldPos, pos)
      }
    },

    move() {
      if (arguments.length === 0) return this.data.currentPosition

      let useAnimation = true
      const moves = {}
      for (let i = 0; i < arguments.length; i++) {
        if (arguments[i] === false) {
          useAnimation = false
          continue
        }
        if (!validMove(arguments[i])) continue
        const tmp = arguments[i].split('-')
        moves[tmp[0]] = tmp[1]
      }

      const newPos = calculatePositionFromMoves(this.data.currentPosition, moves)
      this.position(newPos, useAnimation)

      const moveKeys = Object.keys(moves)
      if (moveKeys.length > 0) {
        const source = moveKeys[moveKeys.length - 1]
        this.setData({ lastMove: { source: source, target: moves[source] } })
      }

      return newPos
    },

    orientation(arg) {
      if (arguments.length === 0) {
        return this.data.currentOrientation
      }

      let newOrientation = this.data.currentOrientation
      if (arg === 'flip') {
        newOrientation = newOrientation === 'black' ? 'red' : 'black'
      } else if (arg === 'black') {
        newOrientation = 'black'
      } else {
        newOrientation = 'red'
      }

      this.setData({ currentOrientation: newOrientation }, () => {
        this.draw()
      })
      return newOrientation
    },

    flip() {
      return this.orientation('flip')
    },

    clear(useAnimation) {
      this.position({}, useAnimation)
    },

    start(useAnimation) {
      this.position('start', useAnimation)
    },

    fen() {
      return this.position('fen')
    },

    resize() {
      this.initialized = false
      this._initCanvas()
    },

    // -------------------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------------------

    _initPosition(pos) {
      if (pos === 'start') {
        this.setData({ currentPosition: deepCopy(START_POSITION) }, () => {
          if (this.initialized) this.draw()
        })
      } else if (validFen(pos)) {
        this.setData({ currentPosition: fenToObj(pos) }, () => {
          if (this.initialized) this.draw()
        })
      } else if (validPositionObject(pos)) {
        this.setData({ currentPosition: deepCopy(pos) }, () => {
          if (this.initialized) this.draw()
        })
      }
    },

    _positionChanged(newVal) {
      if (this.initialized) {
        this._initPosition(newVal)
      }
    },

    _orientationChanged(newVal) {
      if (this.initialized) {
        this.setData({ currentOrientation: newVal }, () => this.draw())
      }
    },

    _initCanvas() {
      const query = wx.createSelectorQuery().in(this)
      query.select('.xiangqiboard-container').boundingClientRect((res) => {
        if (!res) {
          // retry after a short delay
          setTimeout(() => this._initCanvas(), 100)
          return
        }

        let containerWidth = res.width
        if (!containerWidth || containerWidth <= 0) {
          containerWidth = 300
        }

        const squareSize = Math.floor(containerWidth / COLUMNS.length)
        const canvasWidth = squareSize * COLUMNS.length
        const canvasHeight = squareSize * (ROW_TOP - ROW_LOW + 1)

        let dpr = 1
        try {
          if (wx.getWindowInfo) {
            dpr = wx.getWindowInfo().pixelRatio
          } else if (wx.getSystemInfoSync) {
            dpr = wx.getSystemInfoSync().pixelRatio
          }
        } catch (e) {
          dpr = 1
        }

        this.setData({
          canvasWidth,
          canvasHeight,
          squareSize
        }, () => {
          wx.createSelectorQuery().in(this)
            .select('#boardCanvas')
            .fields({ node: true, size: true })
            .exec((canvasRes) => {
              if (!canvasRes || !canvasRes[0]) {
                setTimeout(() => this._initCanvas(), 100)
                return
              }
              const canvas = canvasRes[0].node
              const ctx = canvas.getContext('2d')
              canvas.width = canvasWidth * dpr
              canvas.height = canvasHeight * dpr
              ctx.scale(dpr, dpr)
              this.canvas = canvas
              this.ctx = ctx
              this.dpr = dpr
              this.initialized = true
              this._loadImages().then(() => {
                this.draw()
              })
            })
        })
      }).exec()
    },

    _loadImages() {
      const loadImage = (src) => {
        return new Promise((resolve) => {
          const timer = setTimeout(() => {
            // eslint-disable-next-line no-console
            console.warn('Xiangqiboard: image load timeout', src)
            resolve(null)
          }, 3000)

          if (!this.canvas || !this.canvas.createImage) {
            clearTimeout(timer)
            resolve(null)
            return
          }
          const img = this.canvas.createImage()
          img.onload = () => {
            clearTimeout(timer)
            resolve(img)
          }
          img.onerror = () => {
            clearTimeout(timer)
            // eslint-disable-next-line no-console
            console.warn('Xiangqiboard: failed to load image', src)
            resolve(null)
          }

          if (/^https?:\/\//.test(src) || /^data:/.test(src)) {
            img.src = src
            return
          }

          const fs = wx.getFileSystemManager()
          const filePath = src.startsWith('/') ? src : '/' + src
          const ext = filePath.split('.').pop().toLowerCase()
          let mimeType = 'image/png'
          if (ext === 'svg') mimeType = 'image/svg+xml'
          else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'

          try {
            const data = fs.readFileSync(filePath, 'base64')
            img.src = `data:${mimeType};base64,${data}`
          } catch (e) {
            clearTimeout(timer)
            // eslint-disable-next-line no-console
            console.warn('Xiangqiboard: failed to read local image', filePath, e)
            resolve(null)
          }
        })
      }

      const promises = []

      promises.push(
        loadImage(this.properties.boardTheme).then(img => {
          this.boardImage = img
        })
      )

      const pieces = ['bA', 'bB', 'bC', 'bK', 'bN', 'bP', 'bR', 'rA', 'rB', 'rC', 'rK', 'rN', 'rP', 'rR']
      pieces.forEach(piece => {
        const src = this.properties.pieceTheme.replace('{piece}', piece)
        promises.push(
          loadImage(src).then(img => {
            this.pieceImages[piece] = img
          })
        )
      })

      return Promise.all(promises)
    },

    // -------------------------------------------------------------------------
    // Drawing
    // -------------------------------------------------------------------------

    draw() {
      if (!this.initialized || !this.ctx) return

      const { ctx, pieceImages } = this
      const activeAnimations = this.activeAnimations || []
      const {
        canvasWidth, canvasHeight, squareSize, currentOrientation,
        isDragging, draggedPiece
      } = this.data

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // Board background: draw image if loaded, else fallback color
      if (this.boardImage) {
        ctx.drawImage(this.boardImage, 0, 0, canvasWidth, canvasHeight)
      } else {
        ctx.fillStyle = '#f0d9b5'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        ctx.strokeStyle = '#b58863'
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight)
      }

      const basePosition = this.animationBasePosition || this.data.currentPosition
      const hiddenSquares = new Set()
      const animatedPieces = []

      activeAnimations.forEach(anim => {
        if (anim.type === 'move') {
          hiddenSquares.add(anim.source)
          hiddenSquares.add(anim.destination)
          animatedPieces.push({ piece: anim.piece, x: anim.currentX, y: anim.currentY })
        } else if (anim.type === 'add') {
          hiddenSquares.add(anim.square)
          animatedPieces.push({ piece: anim.piece, x: anim.x, y: anim.y, alpha: anim.alpha })
        } else if (anim.type === 'clear') {
          hiddenSquares.add(anim.square)
          animatedPieces.push({ piece: anim.piece, x: anim.x, y: anim.y, alpha: anim.alpha })
        } else if (anim.type === 'snapback' || anim.type === 'snap') {
          if (isDragging && validSquare(this.data.draggedPieceSource)) {
            hiddenSquares.add(this.data.draggedPieceSource)
          }
          animatedPieces.push({ piece: anim.piece, x: anim.currentX, y: anim.currentY })
        }
      })

      // Static pieces
      for (const square in basePosition) {
        if (hiddenSquares.has(square)) continue
        const piece = basePosition[square]
        const { x, y } = this.squareToXY(square, currentOrientation, squareSize)
        this._drawPiece(ctx, pieceImages[piece], x, y, squareSize)
      }

      // Animated pieces
      animatedPieces.forEach(p => {
        ctx.save()
        if (p.alpha !== undefined) {
          ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha))
        }
        this._drawPiece(ctx, pieceImages[p.piece], p.x, p.y, squareSize)
        ctx.restore()
      })

      // Selected piece float effect
      if (isDragging && validSquare(this.data.draggedPieceSource)) {
        const { x, y } = this.squareToXY(this.data.draggedPieceSource, currentOrientation, squareSize)
        const floatSize = squareSize * 1.08
        this._drawPiece(ctx, pieceImages[draggedPiece], x, y - squareSize * 0.08, floatSize)
      }

      // Last move markers
      const { lastMove } = this.data
      if (lastMove) {
        const { source, target } = lastMove

        if (validSquare(source)) {
          const { x, y } = this.squareToXY(source, currentOrientation, squareSize)
          const outerRadius = squareSize * 0.14
          const dotRadius = squareSize * 0.10

          ctx.beginPath()
          ctx.arc(x, y, outerRadius, 0, Math.PI * 2)
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 1
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
          ctx.fillStyle = 'white'
          ctx.fill()
        }

        if (validSquare(target)) {
          const { x, y } = this.squareToXY(target, currentOrientation, squareSize)
          const ringRadius = squareSize * 0.42

          ctx.beginPath()
          ctx.arc(x, y, ringRadius, 0, Math.PI * 2)
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    },

    _drawPiece(ctx, img, x, y, size) {
      if (!img) return
      const half = size / 2
      ctx.drawImage(img, x - half, y - half, size, size)
    },

    squareToXY(square, orientation, squareSize) {
      const colIdx = COLUMNS.indexOf(square[0])
      const row = parseInt(square[1], 10)
      let x, y
      if (orientation !== 'black') {
        x = colIdx * squareSize + squareSize / 2
        y = (ROW_TOP - row) * squareSize + squareSize / 2
      } else {
        x = (COLUMNS.length - 1 - colIdx) * squareSize + squareSize / 2
        y = row * squareSize + squareSize / 2
      }
      return { x, y }
    },

    xyToSquare(x, y, orientation, squareSize) {
      let colIdx, row
      if (orientation !== 'black') {
        colIdx = Math.floor(x / squareSize)
        row = ROW_TOP - Math.floor(y / squareSize)
      } else {
        colIdx = COLUMNS.length - 1 - Math.floor(x / squareSize)
        row = Math.floor(y / squareSize)
      }
      if (colIdx < 0 || colIdx >= COLUMNS.length || row < ROW_LOW || row > ROW_TOP) {
        return 'offboard'
      }
      return COLUMNS[colIdx] + row
    },

    // -------------------------------------------------------------------------
    // Animations
    // -------------------------------------------------------------------------

    _runAnimationFrame() {
      if (this.animationFrameId) return

      const step = () => {
        const now = Date.now()
        let stillAnimating = false

        this.activeAnimations = this.activeAnimations.filter(anim => {
          const elapsed = now - anim.startTime
          const progress = Math.min(elapsed / anim.duration, 1)

          if (anim.type === 'move' || anim.type === 'snapback' || anim.type === 'snap') {
            anim.currentX = anim.fromX + (anim.toX - anim.fromX) * progress
            anim.currentY = anim.fromY + (anim.toY - anim.fromY) * progress
          } else if (anim.type === 'add') {
            anim.alpha = progress
          } else if (anim.type === 'clear' || anim.type === 'trash') {
            anim.alpha = 1 - progress
          }

          if (progress < 1) {
            stillAnimating = true
            return true
          } else {
            if (anim.onComplete) anim.onComplete()
            return false
          }
        })

        this.draw()

        if (stillAnimating) {
          this.animationFrameId = (typeof requestAnimationFrame !== 'undefined')
            ? requestAnimationFrame(step)
            : setTimeout(step, 16)
        } else {
          this.animationFrameId = null
        }
      }

      this.animationFrameId = (typeof requestAnimationFrame !== 'undefined')
        ? requestAnimationFrame(step)
        : setTimeout(step, 16)
    },

    _doAnimations(animations, oldPos, newPos) {
      if (animations.length === 0) {
        this._onAllAnimationsComplete(newPos)
        return
      }

      let numFinished = 0
      const onFinishOne = () => {
        numFinished++
        if (numFinished === animations.length) {
          this._onAllAnimationsComplete(newPos)
        }
      }

      animations.forEach(anim => {
        if (anim.type === 'clear') {
          this._animateClear(anim.square, anim.piece, this.properties.trashSpeed, onFinishOne)
        } else if (anim.type === 'add') {
          this._animateAdd(anim.square, anim.piece, this.properties.appearSpeed, onFinishOne)
        } else if (anim.type === 'move') {
          this._animateMove(anim.source, anim.destination, anim.piece, this.properties.moveSpeed, onFinishOne)
        }
      })
    },

    _onAllAnimationsComplete(newPos) {
      this.animationBasePosition = null
      this.setData({ currentPosition: deepCopy(newPos) }, () => {
        this.draw()
        this._triggerMoveEnd(this._animationOldPos, newPos)
      })
    },

    _animateMove(fromSquare, toSquare, piece, duration, onComplete) {
      const { squareSize, currentOrientation } = this.data
      const from = this.squareToXY(fromSquare, currentOrientation, squareSize)
      const to = this.squareToXY(toSquare, currentOrientation, squareSize)

      this.activeAnimations.push({
        type: 'move',
        piece,
        source: fromSquare,
        destination: toSquare,
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        currentX: from.x,
        currentY: from.y,
        duration,
        startTime: Date.now(),
        onComplete
      })

      this._runAnimationFrame()
    },

    _animateAdd(square, piece, duration, onComplete) {
      const { squareSize, currentOrientation } = this.data
      const { x, y } = this.squareToXY(square, currentOrientation, squareSize)

      this.activeAnimations.push({
        type: 'add',
        piece,
        square,
        x,
        y,
        alpha: 0,
        duration,
        startTime: Date.now(),
        onComplete
      })

      this._runAnimationFrame()
    },

    _animateClear(square, piece, duration, onComplete) {
      const { squareSize, currentOrientation } = this.data
      const { x, y } = this.squareToXY(square, currentOrientation, squareSize)

      this.activeAnimations.push({
        type: 'clear',
        piece,
        square,
        x,
        y,
        alpha: 1,
        duration,
        startTime: Date.now(),
        onComplete
      })

      this._runAnimationFrame()
    },

    // -------------------------------------------------------------------------
    // Touch Events (select-then-move mode)
    // -------------------------------------------------------------------------

    onTouchStart(e) {
      if (!this.properties.draggable) return
      const touch = e.touches[0]
      const square = this.xyToSquare(touch.x, touch.y, this.data.currentOrientation, this.data.squareSize)
      const { draggedPieceSource, draggedPiece, currentPosition } = this.data

      // offboard: clear selection
      if (square === 'offboard') {
        this._clearSelection()
        return
      }

      const targetPiece = currentPosition[square]

      // nothing selected yet
      if (!draggedPiece) {
        if (targetPiece) {
          this._selectPiece(square, targetPiece)
        }
        return
      }

      // re-click selected square: deselect
      if (square === draggedPieceSource) {
        this._clearSelection()
        return
      }

      // click own piece: switch selection
      if (targetPiece && targetPiece[0] === draggedPiece[0]) {
        this._selectPiece(square, targetPiece)
        return
      }

      // otherwise: move (empty square or capture)
      this._executeMove(draggedPieceSource, square, draggedPiece)
    },

    onTouchMove() {
      // no-op in select-then-move mode
    },

    onTouchEnd() {
      // no-op in select-then-move mode
    },

    _selectPiece(square, piece) {
      this.triggerEvent('dragstart', {
        source: square,
        piece,
        position: deepCopy(this.data.currentPosition),
        orientation: this.data.currentOrientation
      })

      this.setData({
        isDragging: true,
        draggedPiece: piece,
        draggedPieceSource: square
      }, () => {
        this.draw()
      })
    },

    _soundChanged() {
      this._initSounds()
    },

    _initSounds() {
      const createAudio = (src) => {
        if (!src) return null
        const audio = wx.createInnerAudioContext()
        audio.obeyMuteSwitch = false
        audio.onError((err) => {
          // eslint-disable-next-line no-console
          console.warn('Xiangqiboard: audio init failed', src, err)
          audio.destroy()
        })

        const fs = wx.getFileSystemManager()
        const filePath = src.startsWith('/') ? src : '/' + src
        try {
          const data = fs.readFileSync(filePath, 'base64')
          audio.src = 'data:audio/mpeg;base64,' + data
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Xiangqiboard: read sound file failed', filePath, e)
          audio.destroy()
          return null
        }
        return audio
      }

      if (this._moveAudio) {
        this._moveAudio.destroy()
      }
      if (this._checkAudio) {
        this._checkAudio.destroy()
      }
      this._moveAudio = createAudio(this.properties.moveSound)
      this._checkAudio = createAudio(this.properties.checkSound)
    },

    _playSound(audio) {
      if (!audio) {
        if (this.properties.moveSound || this.properties.checkSound) {
          this._initSounds()
        }
        return
      }
      audio.seek(0)
      audio.play()
    },

    _clearSelection() {
      const { draggedPiece, draggedPieceSource, currentPosition, currentOrientation } = this.data
      if (draggedPiece) {
        this._playSound(this._checkAudio)
      }
      this.setData({
        isDragging: false,
        draggedPiece: null,
        draggedPieceSource: null
      }, () => {
        this.draw()
        if (draggedPiece) {
          this.triggerEvent('snapbackend', {
            piece: draggedPiece,
            source: draggedPieceSource,
            position: deepCopy(currentPosition),
            orientation: currentOrientation
          })
        }
      })
    },

    _executeMove(source, target, piece) {
      const oldPos = deepCopy(this.data.currentPosition)
      const newPos = calculatePositionFromMoves(oldPos, { [source]: target })

      let prevented = false
      const prevent = () => { prevented = true }

      this.triggerEvent('beforedrop', {
        source,
        square: target,
        piece,
        newPosition: deepCopy(newPos),
        oldPosition: oldPos,
        orientation: this.data.currentOrientation,
        prevent
      })

      if (prevented) {
        this._clearSelection()
        return
      }

      this.triggerEvent('drop', {
        source,
        square: target,
        piece,
        newPosition: deepCopy(newPos),
        oldPosition: oldPos,
        orientation: this.data.currentOrientation
      })

      // clear selection before animation
      this._playSound(this._moveAudio)
      this.setData({
        isDragging: false,
        draggedPiece: null,
        draggedPieceSource: null
      }, () => {
        this.position(newPos, true)
        this.setData({ lastMove: { source: source, target: target } })
      })
    },

    // -------------------------------------------------------------------------
    // Event Helpers
    // -------------------------------------------------------------------------

    _triggerChange(oldPos, newPos) {
      this.triggerEvent('change', {
        oldPos: deepCopy(oldPos),
        newPos: deepCopy(newPos)
      })
    },

    _triggerMoveEnd(oldPos, newPos) {
      this.triggerEvent('moveend', {
        oldPos: deepCopy(oldPos),
        newPos: deepCopy(newPos)
      })
    }
  }
})
