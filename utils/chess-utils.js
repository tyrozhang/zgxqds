/* @license
 * xiangqiboard.js chess utilities
 * Extracted from xiangqiboard.js for WeChat Mini Program
 */

'use strict'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROW_TOP = 9
const ROW_LOW = 0
const ROW_LENGTH = ROW_TOP - ROW_LOW + 1
const COLUMNS = Object.freeze('abcdefghi'.split(''))
const DEFAULT_DRAG_THROTTLE_RATE = 20
const ELLIPSIS = '...'
const MINIMUM_JQUERY_VERSION = '1.8.3'
const START_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR'
const START_POSITION = fenToObj(START_FEN)

// default animation speeds
const DEFAULT_APPEAR_SPEED = 200
const DEFAULT_MOVE_SPEED = 200
const DEFAULT_SNAPBACK_SPEED = 60
const DEFAULT_SNAP_SPEED = 30
const DEFAULT_TRASH_SPEED = 100

// use unique class names to prevent clashing with anything else on the page and simplify selectors
// NOTE: these should never change
const CSS = Object.freeze({
  clearfix: 'clearfix-5f3b5',
  board: 'board-1ef78',
  square: 'square-2b8ce',
  highlight1: 'highlight1-e13fc',
  highlight2: 'highlight2-e0a03',
  notation: 'notation-8c7a2',
  alpha: 'alpha-f4ef2',
  numeric: 'numeric-fe76e',
  row: 'row-cb702',
  piece: 'piece-1e8b9',
  sparePieces: 'spare-pieces-9e77b',
  xiangqiboard: 'xiangqiboard-8ddcb',
  sparePiecesTop: 'spare-pieces-top-e4b47',
  sparePiecesBottom: 'spare-pieces-bottom-29dac'
})

// ---------------------------------------------------------------------------
// Misc Util Functions
// ---------------------------------------------------------------------------

function throttle (f, interval, scope) {
  let timeout = 0
  let shouldFire = false
  let args = []

  const handleTimeout = function () {
    timeout = 0
    if (shouldFire) {
      shouldFire = false
      fire()
    }
  }

  const fire = function () {
    timeout = setTimeout(handleTimeout, interval)
    f.apply(scope, args)
  }

  return function (_args) {
    args = arguments
    if (!timeout) {
      fire()
    } else {
      shouldFire = true
    }
  }
}

function uuid () {
  return 'xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function (c) {
    const r = (Math.random() * 16) | 0
    return r.toString(16)
  })
}

function deepCopy (thing) {
  return JSON.parse(JSON.stringify(thing))
}

function parseSemVer (version) {
  const tmp = version.split('.')
  return {
    major: parseInt(tmp[0], 10),
    minor: parseInt(tmp[1], 10),
    patch: parseInt(tmp[2], 10)
  }
}

// returns true if version is >= minimum
function validSemanticVersion (version, minimum) {
  version = parseSemVer(version)
  minimum = parseSemVer(minimum)

  const versionNum = (version.major * 100000 * 100000) +
                     (version.minor * 100000) +
                      version.patch
  const minimumNum = (minimum.major * 100000 * 100000) +
                     (minimum.minor * 100000) +
                      minimum.patch

  return versionNum >= minimumNum
}

function interpolateTemplate (str, obj) {
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue
    const keyTemplateStr = '{' + key + '}'
    const value = obj[key]
    while (str.indexOf(keyTemplateStr) !== -1) {
      str = str.replace(keyTemplateStr, value)
    }
  }
  return str
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

function isString (s) {
  return typeof s === 'string'
}

function isFunction (f) {
  return typeof f === 'function'
}

function isInteger (n) {
  return typeof n === 'number' &&
         isFinite(n) &&
         Math.floor(n) === n
}

function validAnimationSpeed (speed) {
  if (speed === 'fast' || speed === 'slow') return true
  if (!isInteger(speed)) return false
  return speed >= 0
}

function validThrottleRate (rate) {
  return isInteger(rate) &&
         rate >= 1
}

function validMove (move) {
  // move should be a string
  if (!isString(move)) return false

  // move should be in the form of "e2-e4", "f6-d5"
  const squares = move.split('-')
  if (squares.length !== 2) return false

  return validSquare(squares[0]) && validSquare(squares[1])
}

function validSquare (square) {
  return isString(square) && square.search(/^[a-i][0-9]$/) !== -1
}

function validPieceCode (code) {
  return isString(code) && code.search(/^[br][KABNRCP]$/) !== -1
}

function validFen (fen) {
  if (!isString(fen)) return false

  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '')

  // expand the empty square numbers to just 1s
  fen = expandFenEmptySquares(fen)

  // FEN should be ROW_LENGTH sections separated by slashes
  const chunks = fen.split('/')
  if (chunks.length !== ROW_LENGTH) return false

  // check each section
  for (let i = 0; i < ROW_LENGTH; i++) {
    if (chunks[i].length !== COLUMNS.length ||
        chunks[i].search(/[^kabnrcpKABNRCP1]/) !== -1) {
      return false
    }
  }

  return true
}

function validPositionObject (pos) {
  // Replaced $.isPlainObject for mini-program compatibility
  if (Object.prototype.toString.call(pos) !== '[object Object]') return false

  for (const i in pos) {
    if (!pos.hasOwnProperty(i)) continue

    if (!validSquare(i) || !validPieceCode(pos[i])) {
      return false
    }
  }

  return true
}

function isTouchDevice () {
  // In mini-program environment, always assume touch
  return true
}

function validJQueryVersion () {
  // Mini-program does not use jQuery
  return false
}

// ---------------------------------------------------------------------------
// Chess Util Functions
// ---------------------------------------------------------------------------

// convert FEN piece code to bP, rK, etc
function fenToPieceCode (piece) {
  // black piece
  if (piece.toLowerCase() === piece) {
    return 'b' + piece.toUpperCase()
  }

  // red piece
  return 'r' + piece.toUpperCase()
}

// convert bP, rK, etc code to FEN structure
function pieceCodeToFen (piece) {
  const pieceCodeLetters = piece.split('')

  // black piece
  if (pieceCodeLetters[0] === 'b') {
    return pieceCodeLetters[1].toLowerCase()
  }

  // red piece
  return pieceCodeLetters[1].toUpperCase()
}

// convert FEN string to position object
// returns false if the FEN string is invalid
function fenToObj (fen) {
  if (!validFen(fen)) return false

  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '')

  const rows = fen.split('/')
  const position = {}

  let currentRow = ROW_TOP
  for (let i = 0; i < ROW_LENGTH; i++) {
    const row = rows[i].split('')
    let colIdx = 0

    // loop through each character in the FEN section
    for (let j = 0; j < row.length; j++) {
      // number / empty squares
      if (row[j].search(/[1-9]/) !== -1) {
        const numEmptySquares = parseInt(row[j], 10)
        colIdx = colIdx + numEmptySquares
      } else {
        // piece
        const square = COLUMNS[colIdx] + currentRow
        position[square] = fenToPieceCode(row[j])
        colIdx = colIdx + 1
      }
    }

    currentRow = currentRow - 1
  }

  return position
}

// position object to FEN string
// returns false if the obj is not a valid position object
function objToFen (obj) {
  if (!validPositionObject(obj)) return false

  let fen = ''

  let currentRow = ROW_TOP
  for (let i = 0; i < ROW_LENGTH; i++) {
    for (let j = 0; j < COLUMNS.length; j++) {
      const square = COLUMNS[j] + currentRow

      // piece exists
      if (obj.hasOwnProperty(square)) {
        fen = fen + pieceCodeToFen(obj[square])
      } else {
        // empty space
        fen = fen + '1'
      }
    }

    if (i !== ROW_TOP) {
      fen = fen + '/'
    }

    currentRow = currentRow - 1
  }

  // squeeze the empty numbers together
  fen = squeezeFenEmptySquares(fen)

  return fen
}

function squeezeFenEmptySquares (fen) {
  return fen.replace(/111111111/g, '9')
    .replace(/11111111/g, '8')
    .replace(/1111111/g, '7')
    .replace(/111111/g, '6')
    .replace(/11111/g, '5')
    .replace(/1111/g, '4')
    .replace(/111/g, '3')
    .replace(/11/g, '2')
}

function expandFenEmptySquares (fen) {
  return fen.replace(/9/g, '111111111')
    .replace(/8/g, '11111111')
    .replace(/7/g, '1111111')
    .replace(/6/g, '111111')
    .replace(/5/g, '11111')
    .replace(/4/g, '1111')
    .replace(/3/g, '111')
    .replace(/2/g, '11')
}

// returns the distance between two squares
function squareDistance (squareA, squareB) {
  const squareAArray = squareA.split('')
  const squareAx = COLUMNS.indexOf(squareAArray[0]) + 1
  const squareAy = parseInt(squareAArray[1], 10)

  const squareBArray = squareB.split('')
  const squareBx = COLUMNS.indexOf(squareBArray[0]) + 1
  const squareBy = parseInt(squareBArray[1], 10)

  const xDelta = Math.abs(squareAx - squareBx)
  const yDelta = Math.abs(squareAy - squareBy)

  if (xDelta >= yDelta) return xDelta
  return yDelta
}

// returns an array of closest squares from square
function createRadius (square) {
  const squares = []

  // calculate distance of all squares
  for (let i = 0; i < COLUMNS.length; i++) {
    for (let j = ROW_LOW; j <= ROW_TOP; j++) {
      const s = COLUMNS[i] + j

      // skip the square we're starting from
      if (square === s) continue

      squares.push({
        square: s,
        distance: squareDistance(square, s)
      })
    }
  }

  // sort by distance
  squares.sort(function (a, b) {
    return a.distance - b.distance
  })

  // just return the square code
  const surroundingSquares = []
  for (let i = 0; i < squares.length; i++) {
    surroundingSquares.push(squares[i].square)
  }

  return surroundingSquares
}

// returns the square of the closest instance of piece
// returns false if no instance of piece is found in position
function findClosestPiece (position, piece, square) {
  // create array of closest squares from square
  const closestSquares = createRadius(square)

  // search through the position in order of distance for the piece
  for (let i = 0; i < closestSquares.length; i++) {
    const s = closestSquares[i]

    if (position.hasOwnProperty(s) && position[s] === piece) {
      return s
    }
  }

  return false
}

// given a position and a set of moves, return a new position
// with the moves executed
function calculatePositionFromMoves (position, moves) {
  const newPosition = deepCopy(position)

  for (const i in moves) {
    if (!moves.hasOwnProperty(i)) continue

    // skip the move if the position doesn't have a piece on the source square
    if (!newPosition.hasOwnProperty(i)) continue

    const piece = newPosition[i]
    delete newPosition[i]
    newPosition[moves[i]] = piece
  }

  return newPosition
}

// calculate an array of animations that need to happen in order to get
// from pos1 to pos2
function calculateAnimations (pos1, pos2) {
  // make copies of both
  pos1 = deepCopy(pos1)
  pos2 = deepCopy(pos2)

  const animations = []
  const squaresMovedTo = {}

  // remove pieces that are the same in both positions
  for (const i in pos2) {
    if (!pos2.hasOwnProperty(i)) continue

    if (pos1.hasOwnProperty(i) && pos1[i] === pos2[i]) {
      delete pos1[i]
      delete pos2[i]
    }
  }

  // find all the "move" animations
  for (const i in pos2) {
    if (!pos2.hasOwnProperty(i)) continue

    const closestPiece = findClosestPiece(pos1, pos2[i], i)
    if (closestPiece) {
      animations.push({
        type: 'move',
        source: closestPiece,
        destination: i,
        piece: pos2[i]
      })

      delete pos1[closestPiece]
      delete pos2[i]
      squaresMovedTo[i] = true
    }
  }

  // "add" animations
  for (const i in pos2) {
    if (!pos2.hasOwnProperty(i)) continue

    animations.push({
      type: 'add',
      square: i,
      piece: pos2[i]
    })

    delete pos2[i]
  }

  // "clear" animations
  for (const i in pos1) {
    if (!pos1.hasOwnProperty(i)) continue

    // do not clear a piece if it is on a square that is the result
    // of a "move", ie: a piece capture
    if (squaresMovedTo.hasOwnProperty(i)) continue

    animations.push({
      type: 'clear',
      square: i,
      piece: pos1[i]
    })

    delete pos1[i]
  }

  return animations
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

function buildContainerHTML (hasSparePieces) {
  let html = '<div class="{xiangqiboard}">'

  if (hasSparePieces) {
    html += '<div class="{sparePieces} {sparePiecesTop}"></div>'
  }

  html += '<div class="{board}"></div>'

  if (hasSparePieces) {
    html += '<div class="{sparePieces} {sparePiecesBottom}"></div>'
  }

  html += '</div>'

  return interpolateTemplate(html, CSS)
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function expandConfigArgumentShorthand (config) {
  if (config === 'start') {
    config = { position: deepCopy(START_POSITION) }
  } else if (validFen(config)) {
    config = { position: fenToObj(config) }
  } else if (validPositionObject(config)) {
    config = { position: deepCopy(config) }
  }

  // config must be an object
  if (Object.prototype.toString.call(config) !== '[object Object]') config = {}

  return config
}

// validate config / set default options
function expandConfig (config) {
  // default for orientation is red
  if (config.orientation !== 'black') config.orientation = 'red'

  // default for showNotation is false
  if (config.showNotation !== true) config.showNotation = false

  // default for draggable is false
  if (config.draggable !== true) config.draggable = false

  // default for dropOffBoard is 'snapback'
  if (config.dropOffBoard !== 'trash') config.dropOffBoard = 'snapback'

  // default for sparePieces is false
  if (config.sparePieces !== true) config.sparePieces = false

  // draggable must be true if sparePieces is enabled
  if (config.sparePieces) config.draggable = true

  // default piece theme is wikimedia
  if (!config.hasOwnProperty('pieceTheme') ||
      (!isString(config.pieceTheme) && !isFunction(config.pieceTheme))) {
    config.pieceTheme = 'img/xiangqipieces/wikimedia/{piece}.svg'
  }

  // default board theme is wikimedia
  if (!config.hasOwnProperty('boardTheme') || !isString(config.boardTheme)) {
    config.boardTheme = 'img/xiangqiboards/wikimedia/xiangqiboard.svg'
  }

  // animation speeds
  if (!validAnimationSpeed(config.appearSpeed)) config.appearSpeed = DEFAULT_APPEAR_SPEED
  if (!validAnimationSpeed(config.moveSpeed)) config.moveSpeed = DEFAULT_MOVE_SPEED
  if (!validAnimationSpeed(config.snapbackSpeed)) config.snapbackSpeed = DEFAULT_SNAPBACK_SPEED
  if (!validAnimationSpeed(config.snapSpeed)) config.snapSpeed = DEFAULT_SNAP_SPEED
  if (!validAnimationSpeed(config.trashSpeed)) config.trashSpeed = DEFAULT_TRASH_SPEED

  // throttle rate
  if (!validThrottleRate(config.dragThrottleRate)) config.dragThrottleRate = DEFAULT_DRAG_THROTTLE_RATE

  return config
}

// ---------------------------------------------------------------------------
// Module Exports
// ---------------------------------------------------------------------------

module.exports = {
  ROW_TOP,
  ROW_LOW,
  ROW_LENGTH,
  COLUMNS,
  DEFAULT_DRAG_THROTTLE_RATE,
  ELLIPSIS,
  MINIMUM_JQUERY_VERSION,
  START_FEN,
  START_POSITION,
  DEFAULT_APPEAR_SPEED,
  DEFAULT_MOVE_SPEED,
  DEFAULT_SNAPBACK_SPEED,
  DEFAULT_SNAP_SPEED,
  DEFAULT_TRASH_SPEED,
  CSS,
  throttle,
  uuid,
  deepCopy,
  parseSemVer,
  validSemanticVersion,
  interpolateTemplate,
  isString,
  isFunction,
  isInteger,
  validAnimationSpeed,
  validThrottleRate,
  validMove,
  validSquare,
  validPieceCode,
  validFen,
  validPositionObject,
  isTouchDevice,
  validJQueryVersion,
  fenToPieceCode,
  pieceCodeToFen,
  fenToObj,
  objToFen,
  squeezeFenEmptySquares,
  expandFenEmptySquares,
  squareDistance,
  createRadius,
  findClosestPiece,
  calculatePositionFromMoves,
  calculateAnimations,
  buildContainerHTML,
  expandConfigArgumentShorthand,
  expandConfig
}
