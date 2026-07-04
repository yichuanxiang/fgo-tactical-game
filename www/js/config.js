// 游戏配置
const TILE_SIZE = 64;
const MAP_WIDTH = 12;
const MAP_HEIGHT = 8;

// 服务器地址
const SERVER_URL = 'https://fgo-tactical-game.onrender.com';

const GAME_CONFIG = {
    tileSize: TILE_SIZE,
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT
};

// 职阶配置：移动范围、攻击范围、攻击随机强度
const CLASS_CONFIG = {
    saber: { name: '剑阶', moveRange: 3, attackRange: 2, diceCount: 3, color: 0x3498db },
    archer: { name: '弓阶', moveRange: 2, attackRange: 4, diceCount: 2, color: 0x2ecc71 },
    lancer: { name: '枪阶', moveRange: 2, attackRange: 4, diceCount: 3, color: 0x9b59b6 },
    rider: { name: '骑阶', moveRange: 5, attackRange: 1, diceCount: 2, color: 0xf39c12 },
    caster: { name: '术阶', moveRange: 1, attackRange: 6, diceCount: 3, color: 0xe91e63 },
    assassin: { name: '杀阶', moveRange: 4, attackRange: 1, diceCount: 4, color: 0x607d8b },
    berserker: { name: '狂阶', moveRange: 3, attackRange: 1, diceCount: 5, color: 0xe74c3c },
    mooncell: { name: '月之癌', moveRange: 2, attackRange: 3, diceCount: 3, color: 0xb8a9d4 }
};

// 随机强度：返回连续随机数 (n 到 n*6)
/**
 * @param {number} randomStrength
 * @returns {number}
 */
function rollFate(randomStrength) {
    if (typeof BattleCore !== 'undefined') {
        return BattleCore.rollFate(randomStrength);
    }

    const min = randomStrength;
    const max = randomStrength * 6;
    return Phaser.Math.Between(min, max);
}

// 单次随机数 (1-6)
function rollSingleFate() {
    if (typeof BattleCore !== 'undefined') {
        return BattleCore.rollSingleFate();
    }

    return Phaser.Math.Between(1, 6);
}

// NP充能配置（区间值，每次随机波动）
const NP_GAIN = {
    onAttackHit: [12, 20],
    onTakeDamage: [5, 12],
    onSkillHit: [8, 15],
    onKill: [20, 35]
};

/**
 * @param {number | [number, number]} range
 * @returns {number}
 */
function rollNPGain(range) {
    if (typeof range === 'number') return range;
    return Phaser.Math.Between(range[0], range[1]);
}

// 全局伤害倍率（让伤害匹配万级HP）
const DAMAGE_SCALE = 50;

// 数值格式化：万级显示
/**
 * @param {number} n
 * @returns {string}
 */
function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return String(n);
}

// 技能默认冷却
const SKILL_CD_DEFAULT = [2, 3, 4];

// 职阶固有技能
const CLASS_SKILLS = {
    saber: { name: '对魔力', desc: '免疫下一次技能伤害（非普攻和宝具）', effect: 'magicImmune' },
    archer: { name: '单独行动', desc: '本回合再行动一次，但不能发动技能', effect: 'extraActionNoSkill' },
    lancer: { name: '战斗续行', desc: '下次HP归零时恢复至1，可叠加次数', effect: 'guts' },
    rider: { name: '骑乘', desc: '下一次行动后可以额外移动一次', effect: 'rideMove' },
    caster: { name: '阵地作成', desc: '放置随机效果地形（伤害/治疗/充能/障碍）', effect: 'fieldCreate' },
    assassin: { name: '气息遮断', desc: '免疫下一次普攻伤害', effect: 'evade' },
    berserker: { name: '狂化', desc: '下次行动增加直接普攻选项；攻击命中NP+2~12，下次受伤NP-2~12', effect: 'berserkAttack' },
    mooncell: { name: '月之转移', desc: '全图任意位置传送', effect: 'teleport' }
};
