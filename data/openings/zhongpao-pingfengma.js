module.exports = {
  id: 'zhongpao-pingfengma',
  meta: {
    name: '开局教学：当头炮分支演示',
    notation: 'ucci',
    author: 'tyrozhang',
    source: '自研教学谱',
    ecco: 'C40',
    difficulty: '初级',
    tags: [
      '中炮',
      '屏风马',
      '顺手炮',
      '开局原理'
    ],
    description: '本棋谱演示红方当头炮后，黑方的三种应对选择，包含正确走法与常见错误分析。',
    _fixNote: '2026-04-21: 修正UCCI move坐标，以SAN为基准反推正确坐标'
  },
  moves: [
    {
      move: 'h2e2',
      san: '炮二平五',
      comment: '本棋谱演示红方当头炮后，黑方的三种应对选择',
      branches: [
        {
          label: '屏风马',
          moves: [
            {
              move: 'h9g7',
              san: '马8进7',
              comment: '屏风马，最稳健的应法',
              eval: '0.0',
              tags: [
                'recommended',
                'main_line'
              ]
            },
            {
              move: 'h0g2',
              san: '马二进三'
            },
            {
              move: 'i9h9',
              san: '车9平8',
              comment: '红方跳马出车'
            },
            {
              move: 'i0h0',
              san: '车一平二'
            },
            {
              move: 'b9c7',
              san: '马2进3',
              comment: '形成中炮对屏风马经典布局',
              eval: '0.0',
              tags: [
                'balanced'
              ]
            }
          ]
        },
        {
          label: '顺手炮',
          moves: [
            {
              move: 'h7e7',
              san: '炮8平5',
              comment: '针锋相对，以攻对攻',
              eval: '0.0',
              tags: [
                'recommended',
                'sharp'
              ]
            },
            {
              move: 'h0g2',
              san: '马二进三',
              comment: '双方各出大子'
            },
            {
              move: 'h9g7',
              san: '马8进7'
            },
            {
              move: 'i0h0',
              san: '车一平二'
            },
            {
              move: 'i9i8',
              san: '车9进1',
              comment: '顺炮直车对横车'
            },
            {
              move: 'b0c2',
              san: '马八进七'
            },
            {
              move: 'i8f8',
              san: '车9平4',
              comment: '黑方横车占右肋道'
            },
            {
              move: 'g3g4',
              san: '兵三进一',
              comment: '红方挺三兵活马'
            },
            {
              move: 'b9c7',
              san: '马2进3',
              comment: '局面均势，对攻激烈',
              eval: '0.0',
              tags: [
                'balanced',
                'tactical'
              ]
            }
          ]
        },
        {
          label: '过早补士✗',
          moves: [
            {
              move: 'f9e8',
              san: '士6进5',
              comment: '过早补士，违反快出大子原则',
              eval: '-0.8',
              tags: [
                'bad',
                'slow_development',
                'principle_violation'
              ]
            },
            {
              move: 'h0g2',
              san: '马二进三',
              comment: '红方正常出子'
            },
            {
              move: 'h9g7',
              san: '马8进7'
            },
            {
              move: 'i0h0',
              san: '车一平二'
            },
            {
              move: 'i9h9',
              san: '车9平8',
              comment: '黑车只能直出'
            },
            {
              move: 'b0c2',
              san: '马八进七'
            },
            {
              move: 'b7f7',
              san: '炮2平4',
              comment: '黑方平炮准备开车路'
            },
            {
              move: 'h2h8',
              san: '车二进六',
              comment: '红车过河压制，黑方被动',
              eval: '-1.2',
              tags: [
                'active',
                'pressing'
              ],
              branches: [
                {
                  label: '兑车✗',
                  moves: [
                    {
                      move: 'h7i7',
                      san: '炮8平9',
                      comment: '兑车试图缓解压力，错误',
                      eval: '-2.5',
                      tags: [
                        'bad',
                        'passive'
                      ]
                    },
                    {
                      move: 'h8f8',
                      san: '车二平三',
                      comment: '红方平车压马'
                    },
                    {
                      move: 'i7i8',
                      san: '炮9退1'
                    },
                    {
                      move: 'b2i2',
                      san: '炮八平九',
                      comment: '红方平炮通车路'
                    },
                    {
                      move: 'b9c7',
                      san: '马2进3'
                    },
                    {
                      move: 'a0b0',
                      san: '车九平八',
                      comment: '红方出车'
                    },
                    {
                      move: 'a8b8',
                      san: '车1平2'
                    },
                    {
                      move: 'e4e5',
                      san: '兵五进一',
                      comment: '红方中路突破，黑方难以防守',
                      eval: '-4.0',
                      tags: [
                        'critical',
                        'attack'
                      ]
                    }
                  ]
                },
                {
                  label: '跳马✗',
                  moves: [
                    {
                      move: 'b9c7',
                      san: '马2进3',
                      comment: '跳马试图快速出子',
                      eval: '-2.0',
                      tags: [
                        'inaccurate'
                      ]
                    },
                    {
                      move: 'e4e5',
                      san: '兵五进一',
                      comment: '红方冲中兵突破'
                    },
                    {
                      move: 'e6e5',
                      san: '卒5进1'
                    },
                    {
                      move: 'e2e5',
                      san: '炮五进三',
                      comment: '红方中炮取卒'
                    },
                    {
                      move: 'h7e7',
                      san: '炮8平5'
                    },
                    {
                      move: 'e5e7',
                      san: '炮五进二',
                      comment: '兑炮后中路空虚'
                    },
                    {
                      move: 'c9e7',
                      san: '象3进5'
                    },
                    {
                      move: 'h8f8',
                      san: '车二平三',
                      comment: '红车压马，局势崩溃',
                      eval: '-6.0',
                      tags: [
                        'crushing',
                        'winning'
                      ]
                    },
                    {
                      move: 'c7e8',
                      san: '马3退4'
                    },
                    {
                      move: 'c2e3',
                      san: '马七进五',
                      comment: '红马跃出，配合车炮形成杀势',
                      eval: '-8.0',
                      tags: [
                        'checkmate_threat'
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
