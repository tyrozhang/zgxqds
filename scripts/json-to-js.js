const fs = require('fs');
const path = require('path');

function stringify(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(item => stringify(item, indent + 1));
    return `[\n${pad}  ${items.join(`,\n${pad}  `)}\n${pad}]`;
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) return '{}';
  const items = entries.map(([k, v]) => {
    const key = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : `'${k}'`;
    return `${key}: ${stringify(v, indent + 1)}`;
  });
  return `{\n${pad}  ${items.join(`,\n${pad}  `)}\n${pad}}`;
}

function convert(file) {
  const jsonPath = path.join(__dirname, '..', 'data', 'openings', `${file}.json`);
  const jsPath = path.join(__dirname, '..', 'data', 'openings', `${file}.js`);

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const output = `module.exports = ${stringify(data)};\n`;
  fs.writeFileSync(jsPath, output, 'utf-8');
  console.log(`Generated: ${jsPath}`);
}

const files = ['feixiang-kaiqu', 'zhongpao-pingfengma'];
files.forEach(convert);
