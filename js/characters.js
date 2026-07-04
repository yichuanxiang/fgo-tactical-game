// 角色数据
const CHARACTERS = {
    // 角色
    saber_artoria: {
        name: '阿尔托莉雅·潘德拉贡',
        class: 'saber',
        avatar: 'assets/characters/saber_artoria.png',
        skills: [
            { name: '魔力放出', desc: '发动风王铁锤(范围5，伤害=(6-距离)×1~6)，之后2次攻击范围+2、伤害+(1~6)×3', effect: 'burstWithHammer', turns: 2, rangeBonus: 2, multiplier: 3, hammerRange: 5 },
            { name: '阿瓦隆', desc: '接下来1~6次受到伤害时，回复该伤害一半的HP和NP', effect: 'avalonCounter' },
            { 
                name: '圆桌誓约', 
                desc: 'NP+(1~6)×10，召唤1~3位圆桌骑士的加护，提供各种增益效果', 
                effect: 'roundTableOath'
            }
        ],
        noble: { name: '誓约胜利之剑', desc: '对直线上所有敌人造成20~120伤害并附加3回合灼烧(每回合10伤害)，无视护盾', effect: 'excaliburLine', diceCount: 4, multiplier: 5, burnDamage: 10, burnTurns: 3, pierceShield: true }
    },
    archer_emiya: {
        name: '卫宫',
        class: 'archer',
        avatar: 'assets/characters/archer_emiya.png',
        skills: [
            { name: '炽天覆七重圆环', desc: '获得护盾(2~12+上次值)，可叠加7次，满7层免疫一次宝具伤害', effect: 'roAias' },
            { name: '投影魔术', desc: '投影武器；已有武器可：投掷(6~36伤害+等量NP) 或 投影放置新武器(3~18伤害)', effect: 'projection' },
            { name: '鹤翼三连', desc: '选择方向连续直线攻击3次，每次3~18伤害并恢复等量NP，最后一击双倍伤害', effect: 'tripleStrike' }
        ],
        noble: { name: '无限剑制', desc: '展开固有结界5回合，剑自动追踪攻击，敌方宝具生成新剑', effect: 'unlimitedBladeWorks', duration: 5 }
    },
    caster_helewei: {
        name: '何乐为',
        class: 'caster',
        avatar: 'assets/characters/helewei.png',
        skills: [
            { 
                name: '瓷器攻击', 
                desc: '获得瓷器，所有受到的伤害转移到瓷器上；再次使用时瓷器爆炸，对敌方造成累积伤害×1.5(最多150)', 
                effect: 'porcelainAttack',
                maxDamage: 100,
                damageMultiplier: 1.5
            },
            { 
                name: '玫瑰剑士', 
                desc: '对五角星范围内造成3~18伤害并施加标记(10回合)，有标记的敌人受此技能伤害+50%', 
                effect: 'roseSwordsman',
                baseDice: 3,
                markDuration: 10,
                markBonus: 0.5
            },
            { 
                name: '卷狗之光', 
                desc: '恢复4~24宝具值，获得1~3次额外行动，但每次行动后随机封锁一个技能3回合', 
                effect: 'dogLight',
                npDice: 4,
                sealDuration: 3
            }
        ],
        noble: { 
            name: '何乐不为·有何不为', 
            desc: '接下来3次行动强制变为普通攻击，攻击附加中毒(每回合12伤害)和减速(-1移动)；若敌方有玫瑰标记，伤害变为范围伤害', 
            effect: 'heleweiBurst',
            forcedAttacks: 3,
            poisonDamage: 12,
            poisonTurns: 3,
            slowAmount: 1
        }
    },
    // 敌方角色
    berserker_lancelot: {
        name: '兰斯洛特',
        class: 'berserker',
        avatar: 'assets/characters/lancelot.png',
        skills: [
            { 
                name: '骑士不留名', 
                desc: '隐身2回合：免疫技能伤害，下次攻击暴击(×1.5)，移动后可再移动一次；发动时NP+5~30',
                effect: 'forAllOne',
                duration: 2
            },
            { 
                name: '无毁的湖光', 
                desc: '装备阿隆戴特：获得护盾(6~36)，护盾存在时受击反弹30%伤害并回复3~18NP，攻击+10',
                effect: 'arondight',
                shieldDice: 3,
                shieldMultiplier: 2,
                reflectPercent: 0.3,
                atkBonus: 10
            },
            { 
                name: '永恒之臂', 
                desc: '夺取敌方宝具3回合：敌方无法使用宝具，兰斯洛特可使用偷来的宝具',
                effect: 'knightOfOwner',
                sealDuration: 3
            }
        ],
        noble: { 
            name: '缚锁全开·过载', 
            desc: '阿隆戴特过载！对单体造成24~144伤害，无视闪避；若已夺取宝具则使用偷来的宝具',
            effect: 'arondightOverload',
            diceCount: 6,
            multiplier: 4,
            ignoreEvade: true
        }
    },
    // 水月无影 - 月之癌
    mooncell_mizuki: {
        name: '水月无影',
        class: 'mooncell',
        avatar: 'assets/characters/moon_shadow.png',
        skills: [
            {
                name: '固有时域制',
                desc: '停止时间2~3回合：只有自己和有对时间对策的敌方可以行动，停止期间自身攻击+5~15',
                effect: 'timeStop'
            },
            {
                name: '月瞳·城临',
                desc: '展开千年城2~4回合：地图变为千年城，敌方每回合扣10~20HP且无法释放宝具，自身在城中时每回合恢复5~15NP',
                effect: 'millenniumCastle',
                burnMin: 10,
                burnMax: 20,
                npRegenMin: 5,
                npRegenMax: 15
            },
            {
                name: '月影',
                desc: '消耗25%~50%HP召唤月之分身，分身与本体属性一致，在本体行动后行动；分身被击杀后剩余NP转移给本体',
                effect: 'moonShadow'
            }
        ],
        noble: {
            name: '月淮泉·花影',
            desc: '召唤5~7个月之分身持续1回合，若处于千年城中则分身退场时对周围敌人造成20~40伤害',
            effect: 'moonSpringFlowers',
            duration: 1,
            exitDamageMin: 20,
            exitDamageMax: 40
        }
    },
    // 韩信 - 兵仙
    lancer_hanxin: {
        name: '韩信',
        class: 'lancer',
        avatar: 'assets/characters/hanxin.png',
        passive: 'duoduoyishan', // 多多益善：HP和NP无上限，总和>200时回复减半
        skills: [
            { 
                name: '暗度陈仓', 
                desc: '瞬移到任意位置，下次行动变为普攻(伤害×2)，回复等量NP，扣除伤害一半的HP',
                effect: 'secretPath'
            },
            { 
                name: '背水一战', 
                desc: 'HP越低伤害越高(损失HP转为攻击加成)；HP≤30%时获得一次战斗续行',
                effect: 'lastStand'
            },
            { 
                name: '十面埋伏', 
                desc: '在范围内布置陷阱(最多10个)，敌人经过触发3~18伤害+定身1回合',
                effect: 'ambush',
                maxTraps: 10,
                rootDuration: 1
            }
        ],
        noble: { 
            name: '国士无双', 
            desc: '对攻击范围内全体敌人造成10~60伤害，NP超过100的部分每50点+50%伤害',
            effect: 'unrivaledGeneral'
        }
    }
};
