const fs = require('fs');
const path = require('path');

const PGN_PATH = path.join(__dirname, '../docs/示例棋谱.pgn');
const DATA_DIR = path.join(__dirname, '../data/openings');
const OUTPUT_PATH = path.join(DATA_DIR, 'zhongpao-pingfengma.json');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');

// 硬编码 lookup：示例 PGN 中所有中文走法 -> ICCS
const SAN_TO_ICCS = {
  '炮二平五': 'h2e2',
  '马8进7': 'b9c7',
  '马二进三': 'b0c2',
  '车9平8': 'a9b9',
  '车一平二': 'a0b0',
  '马2进3': 'h9g7',
  '兵七进一': 'c3c4',
  '卒7进1': 'c6c5',
  '炮8平5': 'b7e7',
  '车9进1': 'a9a8',
  '马八进七': 'h0g2',
  '车9平4': 'a8d8',
  '兵三进一': 'c1c2',
  '士6进5': 'd9e8',
  '炮2平4': 'h7e7',
  '车二进六': 'b0b6',
  '炮8平9': 'b7a7',
  '车二平三': 'b0b2',
  '炮9退1': 'a7a8',
  '炮八平九': 'h2a2',
  '车九平八': 'i0h0',
  '车1平2': 'i9h9',
  '兵五进一': 'c2c3',
  '卒5进1': 'c5c4',
  '炮五进三': 'e2e5',
  '炮五进二': 'e5e8',
  '象3进5': 'c9e7',
  '马3退4': 'c5b5',
  '马七进五': 'c3d4',
};

function stripDecorators(san) {
  return san.replace(/[\?\!]+$/, '').trim();
}

function resolveSan(san) {
  const clean = stripDecorators(san);
  const iccs = SAN_TO_ICCS[clean];
  if (!iccs) {
    throw new Error(`Unknown move: ${clean}`);
  }
  return { move: iccs, san: clean };
}

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i])) { i++; continue; }
    if (text[i] === '{') {
      let j = i + 1;
      while (j < text.length && text[j] !== '}') j++;
      tokens.push({ type: 'comment', value: text.slice(i + 1, j).trim() });
      i = j + 1;
      continue;
    }
    if (text[i] === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
    if (text[i] === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
    if (/\d/.test(text[i])) {
      let j = i;
      while (j < text.length && /\d/.test(text[j])) j++;
      if (text[j] === '.' && text[j + 1] === '.') j += 3;
      else if (text[j] === '.') j++;
      tokens.push({ type: 'number', value: text.slice(i, j) });
      i = j;
      continue;
    }
    let j = i;
    while (j < text.length && !/\s/.test(text[j]) && text[j] !== '(' && text[j] !== ')' && text[j] !== '{') j++;
    const raw = text.slice(i, j);
    if (raw === '*') {
      tokens.push({ type: 'result', value: raw });
    } else if ((raw === '??' || raw === '?!' || raw === '?' || raw === '!!' || raw === '!')
        && tokens.length > 0 && tokens[tokens.length - 1].type === 'move') {
      tokens[tokens.length - 1].value += raw;
    } else {
      tokens.push({ type: 'move', value: raw });
    }
    i = j;
  }
  return tokens;
}

function parseVariation(tokens, idx, isMainLine) {
  const nodes = [];
  let i = idx;
  let pendingComment = '';
  let currentParent = null; // 当前主变路径的最后一个节点

  function flushComment(node) {
    if (pendingComment) {
      if (!node.comment) {
        node.comment = pendingComment;
      } else {
        node.comment += '\n' + pendingComment;
      }
      pendingComment = '';
    }
  }

  function createNode(moveToken) {
    const { move, san } = resolveSan(moveToken.value);
    const node = {
      move,
      san,
      isMainLine,
      children: []
    };
    flushComment(node);
    const commentText = node.comment || '';
    if (commentText.includes('分支类型：错误')) {
      node.isTypicalError = true;
      const m = commentText.match(/错误原因：([^\n]+)/);
      if (m) node.errorComment = m[1].trim();
    }
    return node;
  }

  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.type === 'rparen') {
      i++;
      break;
    }
    if (tok.type === 'lparen') {
      // 变着分支：挂到 currentParent 下
      const branchParent = currentParent;
      const childResult = parseVariation(tokens, i + 1, false);
      i = childResult.index;
      if (branchParent) {
        branchParent.children.push(...childResult.nodes);
      }
      continue;
    }
    if (tok.type === 'comment') {
      pendingComment = pendingComment ? pendingComment + '\n' + tok.value : tok.value;
      i++;
      continue;
    }
    if (tok.type === 'number' || tok.type === 'result') {
      i++;
      continue;
    }
    if (tok.type === 'move') {
      const node = createNode(tok);
      if (!currentParent) {
        // 第一个节点
        nodes.push(node);
      } else {
        // 挂到当前路径末尾
        currentParent.children.push(node);
      }
      currentParent = node;
      i++;
      continue;
    }
    i++;
  }

  return { nodes, index: i };
}

function main() {
  const pgnText = fs.readFileSync(PGN_PATH, 'utf-8');
  const moveText = pgnText.replace(/\[[^\]]+\]\s*/g, '').trim();
  const tokens = tokenize(moveText);
  const result = parseVariation(tokens, 0, true);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const eventMatch = pgnText.match(/\[Event "([^"]+)"\]/);
  const eventName = eventMatch ? eventMatch[1] : '中炮对屏风马';

  const output = {
    id: 'zhongpao-pingfengma',
    meta: {
      name: eventName,
      category: 'zhongpao'
    },
    tree: result.nodes[0] || null
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log('Generated:', OUTPUT_PATH);

  const index = {
    categories: [
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
      }
    ]
  };

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');
  console.log('Generated:', INDEX_PATH);
}

main();
