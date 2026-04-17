module.exports = {
  id: 'feixiang-kaiqu',
  meta: {
    name: '开局教学：飞相局体系分支演示',
    notation: 'ucci',
    author: 'tyrozhang',
    source: '自研教学谱',
    ecco: 'A00',
    difficulty: '初级',
    tags: ['飞相', '飞相局', '稳健开局', '开局原理'],
    description: '本棋谱演示红方飞相（相三进五）后，黑方的三种主流应对：飞象局、起马局、挺卒局，含正确走法与常见错误分析。飞相局核心理念：稳健出子，不急于平中炮。'
  },
  moves: [
    {
      move: 'g0e2',
      san: '相三进五',
      comment: '飞相局，红方第一步飞相护住中路，布局稳健，避免激烈的中炮对攻。e2位相不可再被己方棋子占用。',
      branches: [
        {
          label: '飞象局（对飞象）',
          moves: [
            {
              move: 'c9e7',
              san: '象7进5',
              comment: '对飞象，最对称、最稳健的应法，双方均以守为攻',
              eval: '0.0',
              tags: ['recommended', 'main_line', 'symmetrical']
            },
            {
              move: 'b0c2',
              san: '马二进三',
              comment: '红方跳右马，占据要道，准备出右车'
            },
            {
              move: 'b9c7',
              san: '马8进7',
              comment: '黑方对称跳马，出子对等'
            },
            {
              move: 'a0b0',
              san: '车一平二',
              comment: '红方出右车，沿二路出击，飞相局中车比炮更重要'
            },
            {
              move: 'a9b9',
              san: '车9平8',
              comment: '黑方出左车，对应出子'
            },
            {
              move: 'h0g2',
              san: '马八进七',
              comment: '红方再出左马，双马跃出，形成飞相对飞象的标准均势阵型',
              eval: '0.0',
              tags: ['balanced', 'standard_position']
            }
          ]
        },
        {
          label: '起马局（马8进7）',
          moves: [
            {
              move: 'b9c7',
              san: '马8进7',
              comment: '黑方直接跳马，积极出子，争夺主动',
              eval: '0.0',
              tags: ['recommended', 'active']
            },
            {
              move: 'b0c2',
              san: '马二进三',
              comment: '红方对应跳右马，正常发展'
            },
            {
              move: 'h9g7',
              san: '马2进3',
              comment: '黑方双马出动，准备组成屏风马阵型'
            },
            {
              move: 'a0b0',
              san: '车一平二',
              comment: '红方出右车，沿二路展开'
            },
            {
              move: 'a9b9',
              san: '车9平8',
              comment: '黑方出左车，双方出子节奏相当'
            },
            {
              move: 'h0g2',
              san: '马八进七',
              comment: '红方再出左马，双马护卫，形成飞相对屏风马的稳健阵型',
              eval: '0.0',
              tags: ['balanced', 'solid']
            },
            {
              move: 'd9e8',
              san: '士6进5',
              comment: '黑方补士巩固阵型，飞相局节奏较慢，补士时机合理',
              eval: '0.0',
              tags: ['solid', 'defensive']
            }
          ]
        },
        {
          label: '挺卒局（急进中兵）✗',
          moves: [
            {
              move: 'e6e5',
              san: '卒5进1',
              comment: '黑方急进中卒，试图快速打开局面，但开局过早进攻，违反出子优先原则，红方趁机加快出子节奏',
              eval: '-0.5',
              tags: ['inaccurate', 'principle_violation', 'premature_attack']
            },
            {
              move: 'b0c2',
              san: '马二进三',
              comment: '红方正常跳马，不理黑方挑衅，以出子速度回应'
            },
            {
              move: 'b9c7',
              san: '马8进7',
              comment: '黑方被迫正常出子，先前挺卒未获实质好处'
            },
            {
              move: 'a0b0',
              san: '车一平二',
              comment: '红方出右车，抢先占据二路要道'
            },
            {
              move: 'h9g7',
              san: '马2进3',
              comment: '黑方跳右马'
            },
            {
              move: 'h2h5',
              san: '炮二进五',
              comment: '红方炮过河封压，限制黑方7路马，并压缩黑方右翼出子空间',
              eval: '-1.2',
              tags: ['active', 'pressure', 'territory']
            },
            {
              move: 'e6e5',
              san: '卒5进1',
              comment: '黑方继续挺中卒，试图加强中路，但红方已占先手，效果有限'
            },
            {
              move: 'c2e3',
              san: '马三进四',
              comment: '红马跃出占据四路要道，同时护住过河炮，黑方局面被动',
              eval: '-1.5',
              tags: ['better_development', 'active'],
              branches: [
                {
                  label: '马踩炮✗',
                  moves: [
                    {
                      move: 'c7e6',
                      san: '马7进6',
                      comment: '黑方跳马踩炮，试图夺回子力，但红方有后续追击手段',
                      eval: '-1.5',
                      tags: ['material_attempt']
                    },
                    {
                      move: 'b0e0',
                      san: '车二进五',
                      comment: '红车顺势过河压马，直逼黑方空虚的右翼，黑方子力拥堵难以应对'
                    },
                    {
                      move: 'e6c5',
                      san: '马6退5',
                      comment: '黑方马退中路防守'
                    },
                    {
                      move: 'i0i1',
                      san: '车一进一',
                      comment: '红方再出左车，配合右车形成双车压境，黑方布局彻底失败',
                      eval: '-4.0',
                      tags: ['crushing', 'checkmate_threat']
                    }
                  ]
                },
                {
                  label: '补象防守',
                  moves: [
                    {
                      move: 'c9e7',
                      san: '象7进5',
                      comment: '黑方补象加强防御，相对稳健的应对',
                      eval: '-1.0',
                      tags: ['defensive', 'better']
                    },
                    {
                      move: 'b0d0',
                      san: '车二进四',
                      comment: '红车巡河，占据四路要道，继续压制黑方'
                    },
                    {
                      move: 'f9g8',
                      san: '士4进5',
                      comment: '黑方补士巩固士角，防御红方双车的潜在威胁'
                    },
                    {
                      move: 'h0g2',
                      san: '马八进七',
                      comment: '红方出左马，双马占据要道，红方出子全面领先，黑方开局失误导致全局被动',
                      eval: '-2.0',
                      tags: ['dominant', 'better_development']
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
}
