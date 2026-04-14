const PIECE_CHARS = {
  'R': '俥', 'N': '傌', 'B': '相', 'A': '仕', 'K': '帥', 'C': '炮', 'P': '兵',
  'r': '車', 'n': '馬', 'b': '象', 'a': '士', 'k': '將', 'c': '砲', 'p': '卒'
};

Component({
  properties: {
    boardData: { type: Array, value: [] },
    selected: { type: Array, value: null },
    // TODO: implement board flip (mirror row/col) for black perspective
    flip: { type: Boolean, value: false }
  },

  data: {
    ctx: null,
    cellSize: 0,
    margin: 24,
    canvasRect: null
  },

  lifetimes: {
    ready() {
      this.initCanvas();
    }
  },

  observers: {
    'boardData,selected,flip': function () {
      this.draw();
    }
  },

  methods: {
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select('#chessboard').fields({ node: true, size: true }).exec((res) => {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        const width = res[0].width;
        const height = res[0].height;
        const margin = 24;
        const cellSize = (width - margin * 2) / 8;
        this.setData({ ctx, cellSize, margin, width, height });
        this.draw();
      });
      query.select('#chessboard').boundingClientRect().exec((res2) => {
        const rect = res2[0];
        this.setData({ canvasRect: rect });
      });
    },

    draw() {
      const { ctx, cellSize, margin, width, height } = this.data;
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      this.drawBoard(ctx, cellSize, margin, width, height);
      this.drawPieces(ctx, cellSize, margin);
    },

    drawBoard(ctx, cellSize, margin, width, height) {
      ctx.fillStyle = '#f0d9b5';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#5c3a21';
      for (let r = 0; r < 10; r++) {
        ctx.beginPath();
        ctx.moveTo(margin, margin + r * cellSize);
        ctx.lineTo(margin + 8 * cellSize, margin + r * cellSize);
        ctx.stroke();
      }
      for (let c = 0; c < 9; c++) {
        ctx.beginPath();
        ctx.moveTo(margin + c * cellSize, margin + 0 * cellSize);
        ctx.lineTo(margin + c * cellSize, margin + 4 * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(margin + c * cellSize, margin + 5 * cellSize);
        ctx.lineTo(margin + c * cellSize, margin + 9 * cellSize);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(margin + 3 * cellSize, margin + 0 * cellSize);
      ctx.lineTo(margin + 5 * cellSize, margin + 2 * cellSize);
      ctx.moveTo(margin + 5 * cellSize, margin + 0 * cellSize);
      ctx.lineTo(margin + 3 * cellSize, margin + 2 * cellSize);
      ctx.moveTo(margin + 3 * cellSize, margin + 7 * cellSize);
      ctx.lineTo(margin + 5 * cellSize, margin + 9 * cellSize);
      ctx.moveTo(margin + 5 * cellSize, margin + 7 * cellSize);
      ctx.lineTo(margin + 3 * cellSize, margin + 9 * cellSize);
      ctx.stroke();
    },

    drawPieces(ctx, cellSize, margin) {
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          const p = this.data.boardData[r]?.[c];
          if (!p) continue;
          const x = margin + c * cellSize;
          const y = margin + r * cellSize;
          const isRed = p && p === p.toUpperCase();
          ctx.beginPath();
          ctx.arc(x, y, cellSize * 0.38, 0, Math.PI * 2);
          ctx.fillStyle = '#fff8e7';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = isRed ? '#c0392b' : '#2c3e50';
          ctx.stroke();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = `bold ${cellSize * 0.5}px "KaiTi", serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(PIECE_CHARS[p] || p, x, y + 2);
          if (this.data.selected && this.data.selected[0] === r && this.data.selected[1] === c) {
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, cellSize * 0.42, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    },

    onTap(e) {
      const { cellSize, margin, canvasRect } = this.data;
      if (!canvasRect) return;
      const x = e.detail.x - canvasRect.left;
      const y = e.detail.y - canvasRect.top;
      const c = Math.round((x - margin) / cellSize);
      const r = Math.round((y - margin) / cellSize);
      if (r >= 0 && r < 10 && c >= 0 && c < 9) {
        this.triggerEvent('celltap', { row: r, col: c });
      }
    }
  }
});
