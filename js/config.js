// 游戏配置
const TILE_SIZE = 64;
const MAP_WIDTH = 12;
const MAP_HEIGHT = 8;

const GAME_CONFIG = {
    tileSize: TILE_SIZE,
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT
};

// 职阶配置：移动范围、攻击范围、攻击骰子数
const CLASS_CONFIG = {
    saber: { name: '剑阶', moveRange: 3, attackRange: 1, diceCount: 3, color: 0x3498db },
    archer: { name: '弓阶', moveRange: 2, attackRange: 4, diceCount: 2, color: 0x2ecc71 },
    lancer: { name: '枪阶', moveRange: 4, attackRange: 2, diceCount: 3, color: 0x9b59b6 },
    rider: { name: '骑阶', moveRange: 5, attackRange: 1, diceCount: 2, color: 0xf39c12 },
    caster: { name: '术阶', moveRange: 2, attackRange: 3, diceCount: 2, color: 0xe91e63 },
    assassin: { name: '杀阶', moveRange: 4, attackRange: 1, diceCount: 4, color: 0x607d8b },
    berserker: { name: '狂阶', moveRange: 3, attackRange: 1, diceCount: 5, color: 0xe74c3c }
};

// 骰子效果
const DICE_EFFECTS = {
    1: { name: '攻击', desc: '进行一次普通攻击', type: 'attack' },
    2: { name: '治疗', desc: '掷骰子恢复HP', type: 'heal' },
    3: { name: '血祭', desc: '消耗15点HP发动任意技能', type: 'bloodSkill' },
    4: { name: '充能', desc: '掷骰子增加宝具值', type: 'charge' },
    5: { name: '技能轮盘', desc: '再掷一次决定使用哪个技能', type: 'skillRoulette' },
    6: { name: '职阶技能', desc: '发动职阶固有技能', type: 'classSkill' }
};

// 职阶固有技能
const CLASS_SKILLS = {
    saber: { name: '对魔力', desc: '免疫下一次技能伤害（非普攻和宝具）', effect: 'magicImmune' },
    archer: { name: '单独行动', desc: '本回合再行动一次，但不能发动技能', effect: 'extraActionNoSkill' },
    lancer: { name: '战斗续行', desc: '下次HP归零时恢复至1，可叠加次数', effect: 'guts' },
    rider: { name: '骑乘', desc: '下一次行动后可以额外移动一次', effect: 'rideMove' },
    caster: { name: '阵地作成', desc: '放置随机效果地形（伤害/治疗/充能/障碍）', effect: 'fieldCreate' },
    assassin: { name: '气息遮断', desc: '免疫下一次普攻伤害', effect: 'evade' },
    berserker: { name: '狂化', desc: '下次行动增加直接普攻选项', effect: 'berserkAttack' }
};
