// 角色数据
const CHARACTERS = {
    // 角色
    saber_artoria: {
        name: '阿尔托莉雅·潘德拉贡',
        class: 'saber',
        avatar: 'assets/characters/saber_artoria.png',
        skills: [
            { name: '魔力放出', desc: '强化下3次攻击，攻击范围+1，伤害+骰子值', effect: 'burstModeRoll', turns: 3, rangeBonus: 1 },
            { name: '阿瓦隆', desc: '获得(骰子×5)点护盾', effect: 'shieldRoll', multiplier: 5 },
            { name: '卡里斯玛', desc: '宝具值+(骰子×8)，并可移动一次', effect: 'chargeRollAndMove', multiplier: 8 }
        ],
        noble: { name: '誓约胜利之剑', desc: '对范围内敌人造成伤害，无视护盾并击退2格', effect: 'excaliburAoe', diceCount: 3, multiplier: 6, range: 4, knockback: 2, pierceShield: true }
    },
    archer_emiya: {
        name: '卫宫',
        class: 'archer',
        avatar: 'assets/characters/archer_emiya.png',
        skills: [
            { name: '炽天覆七重圆环', desc: '获得护盾，可叠加7次，每次护盾值递增', effect: 'roAias' },
            { name: '投影魔术', desc: '投影武器，下次攻击可破碎增伤；已有武器时可投掷', effect: 'projection' },
            { name: '鹤翼三连', desc: '连续攻击3次，每次造成骰子伤害并恢复等量NP', effect: 'tripleStrike' }
        ],
        noble: { name: '无限剑制', desc: '展开固有结界，改变地形，生成可控制的剑', effect: 'unlimitedBladeWorks', duration: 5 }
    },
    lancer_cu: {
        name: '库丘林',
        class: 'lancer',
        skills: [
            { name: '战斗续行', desc: '本回合受到致命伤害时保留1点HP', effect: 'guts', value: 1 },
            { name: '矢避之加护', desc: '本回合闪避一次攻击', effect: 'evade', value: 1 },
            { name: '原初符文', desc: '恢复25点HP', effect: 'heal', value: 25 }
        ],
        noble: { name: '刺穿死棘之枪', desc: '对单体造成70点伤害，无视防御', effect: 'pierce', damage: 70, range: 2 }
    },
    caster_medea: {
        name: '美狄亚',
        class: 'caster',
        skills: [
            { name: '高速神言', desc: '宝具值+35', effect: 'charge', value: 35 },
            { name: '金羊之皮', desc: '恢复全体友军15点HP', effect: 'healAll', value: 15 },
            { name: '领地创造', desc: '在当前位置创造结界，友军站上恢复10HP', effect: 'field', value: 10 }
        ],
        noble: { name: '万符必应破戒', desc: '解除目标所有增益并造成45点伤害', effect: 'dispel', damage: 45, range: 3 }
    },
    
    // 敌方角色
    berserker_herc: {
        name: '赫拉克勒斯',
        class: 'berserker',
        skills: [
            { name: '勇猛', desc: '攻击力+20持续2回合', effect: 'atkBuff', value: 20 },
            { name: '心眼(伪)', desc: '闪避一次攻击', effect: 'evade', value: 1 },
            { name: '战斗续行', desc: '致命伤害时保留1HP', effect: 'guts', value: 1 }
        ],
        noble: { name: '射殺す百頭', desc: '对单体造成80点伤害', effect: 'single', damage: 80, range: 1 }
    },
    assassin_hassan: {
        name: '哈桑',
        class: 'assassin',
        skills: [
            { name: '气息遮断', desc: '进入隐身状态1回合', effect: 'stealth', value: 1 },
            { name: '投掷(短刀)', desc: '对远处目标造成20点伤害', effect: 'directDamage', value: 20 },
            { name: '自我改造', desc: '攻击力+15', effect: 'atkBuff', value: 15 }
        ],
        noble: { name: '妄想心音', desc: '即死判定，失败则造成60点伤害', effect: 'instakill', damage: 60, range: 1 }
    }
};
