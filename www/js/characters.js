// 角色数据 — 万级HP体系，每个角色有清晰的强项和弱点
const CHARACTERS = {
    saber_artoria: {
        name: '阿尔托莉雅·潘德拉贡',
        class: 'saber',
        avatar: 'assets/characters/saber_artoria.png',
        hp: 42000, np: 0,
        // ★ 均衡爆发型 — 攻击力+暴击双乘区，防御靠阿瓦隆撑一波
        // ✗ 弱点：没有持续增伤，爆发窗口过后伤害回落；没有控制
        skills: [
            {
                name: '魔力放出',
                desc: '风王铁锤(范围5)+攻击力+20~30%×2回合+暴击率+20~35%×2回合',
                effect: 'burstWithHammer', turns: 2, rangeBonus: 2, multiplier: 3, hammerRange: 5, cd: 3,
                buffs: [
                    { type: 'ATK_PCT', min: 20, max: 30, duration: 2 },
                    { type: 'CRIT_RATE', min: 20, max: 35, duration: 2 }
                ]
            },
            {
                name: '阿瓦隆',
                desc: '减伤+15~25%×3回合+每回合回复1500~2500HP+毅力1次',
                effect: 'avalonCounter', cd: 4,
                buffs: [
                    { type: 'DEF_PCT', min: 15, max: 25, duration: 3 },
                    { type: 'REGEN', min: 1500, max: 2500, duration: 3 },
                    { type: 'GUTS', value: 1, duration: 99 }
                ]
            },
            {
                name: '圆桌誓约',
                desc: 'NP+30, 伤害加成+20~35%×3回合, 暴击伤害+25~45%×3回合',
                effect: 'roundTableOath', cd: 5,
                buffs: [
                    { type: 'DMG_BONUS', min: 20, max: 35, duration: 3 },
                    { type: 'CRIT_DMG', min: 25, max: 45, duration: 3 }
                ]
            }
        ],
        noble: { name: '誓约胜利之剑', desc: '直线伤害+灼烧1800×3回合+无视护盾', effect: 'excaliburLine', diceCount: 4, multiplier: 5, burnDamage: 1800, burnTurns: 3, pierceShield: true }
    },
    archer_emiya: {
        name: '卫宫',
        class: 'archer',
        avatar: 'assets/characters/archer_emiya.png',
        hp: 32000, np: 0,
        // ★ 持续输出型 — 技能增伤+NP率+追击，远距离安全输出
        // ✗ 弱点：最脆之一，护盾破了就是纸；暴击乘区空白
        skills: [
            {
                name: '炽天覆七重圆环',
                desc: '护盾3000~5000+宝具免疫1次+反伤15~25%×3回合',
                effect: 'roAias', cd: 2,
                buffs: [
                    { type: 'SHIELD', min: 3000, max: 5000, duration: 99 },
                    { type: 'IMMUNE_NOBLE', value: 1, duration: 99 },
                    { type: 'THORNS', min: 15, max: 25, duration: 3 }
                ]
            },
            {
                name: '投影魔术',
                desc: '技能增伤+25~40%×3回合+攻击力+15~30+NP获取率+30~50%×3回合',
                effect: 'projection', cd: 3,
                buffs: [
                    { type: 'SKILL_DMG_UP', min: 25, max: 40, duration: 3 },
                    { type: 'ATK_FLAT', min: 15, max: 30, duration: 3 },
                    { type: 'CHARGE_RATE', min: 30, max: 50, duration: 3 }
                ]
            },
            {
                name: '鹤翼三连',
                desc: '直线3次攻击+追击30~50%×2回合+伤害加成+15~25%×2回合',
                effect: 'tripleStrike', cd: 4,
                buffs: [
                    { type: 'DOUBLE_STRIKE', min: 30, max: 50, duration: 2 },
                    { type: 'DMG_BONUS', min: 15, max: 25, duration: 2 }
                ]
            }
        ],
        noble: { name: '无限剑制', desc: '结界5回合+剑追踪+宝具增伤生效', effect: 'unlimitedBladeWorks', duration: 5 }
    },
    caster_helewei: {
        name: '何乐为',
        class: 'caster',
        avatar: 'assets/characters/helewei.png',
        hp: 28000, np: 20,
        // ★ Debuff毒师型 — 堆易伤+DOT慢慢磨，自身增伤辅助
        // ✗ 弱点：血最少，没有硬防御（无护盾/减伤/闪避），怕被贴脸
        skills: [
            {
                name: '瓷器攻击',
                desc: '瓷器吸收伤害+敌方通用易伤+15~25%×4回合+技能免疫1次',
                effect: 'porcelainAttack', maxDamage: 100, damageMultiplier: 1.5, cd: 2,
                buffs: [
                    { type: 'IMMUNE_SKILL', value: 1, duration: 99 }
                ],
                enemyBuffs: [
                    { type: 'VULN', min: 15, max: 25, duration: 4 }
                ]
            },
            {
                name: '玫瑰剑士',
                desc: '范围伤害+敌方技能易伤+20~35%×4回合+中毒1500~2500×3回合',
                effect: 'roseSwordsman', baseDice: 3, markDuration: 10, markBonus: 0.5, cd: 3,
                enemyBuffs: [
                    { type: 'VULN_SKILL', min: 20, max: 35, duration: 4 },
                    { type: 'POISON', min: 1500, max: 2500, duration: 3 }
                ]
            },
            {
                name: '卷狗之光',
                desc: 'NP+15~30+伤害加成+20~30%×3回合+1~3次额外行动(每次封1技能)',
                effect: 'dogLight', npDice: 4, sealDuration: 3, cd: 5,
                buffs: [
                    { type: 'DMG_BONUS', min: 20, max: 30, duration: 3 }
                ]
            }
        ],
        noble: {
            name: '何乐不为·有何不为',
            desc: '3次强攻+中毒2000×3回合+减速+宝具易伤30%×3回合',
            effect: 'heleweiBurst', forcedAttacks: 3, poisonDamage: 2000, poisonTurns: 3, slowAmount: 1
        }
    },
    berserker_lancelot: {
        name: '兰斯洛特',
        class: 'berserker',
        avatar: 'assets/characters/lancelot.png',
        hp: 46000, np: 0,
        // ★ 暴击吸血型 — 超高暴击爆发+吸血续航，近战压制
        // ✗ 弱点：射程只有1，被风筝就废；没有伤害加成/易伤乘区，buff覆盖面窄
        skills: [
            {
                name: '骑士不留名',
                desc: '闪避1次+暴击率+35~50%×2回合+暴击伤害+40~65%×2回合',
                effect: 'forAllOne', duration: 2, cd: 4,
                buffs: [
                    { type: 'EVADE', value: 1, duration: 99 },
                    { type: 'CRIT_RATE', min: 35, max: 50, duration: 2 },
                    { type: 'CRIT_DMG', min: 40, max: 65, duration: 2 }
                ]
            },
            {
                name: '无毁的湖光',
                desc: '护盾3500~5500+攻击力+15~20%×3回合+吸血20~30%×3回合',
                effect: 'arondight', shieldDice: 3, shieldMultiplier: 2, reflectPercent: 0.3, atkBonus: 10, cd: 3,
                buffs: [
                    { type: 'SHIELD', min: 3500, max: 5500, duration: 99 },
                    { type: 'ATK_PCT', min: 15, max: 20, duration: 3 },
                    { type: 'LIFESTEAL', min: 20, max: 30, duration: 3 }
                ]
            },
            {
                name: '永恒之臂',
                desc: '处刑者(HP<50%特攻)+30~50%×3回合+敌方防御弱化+10~20%×3回合+敌方NP流失5~10×3回合',
                effect: 'knightOfOwner', sealDuration: 3, cd: 5,
                enemyBuffs: [
                    { type: 'DEF_DOWN', min: 10, max: 20, duration: 3 },
                    { type: 'NP_DRAIN', min: 5, max: 10, duration: 3 }
                ],
                buffs: [
                    { type: 'LOW_HP_BONUS', min: 30, max: 50, duration: 3 }
                ]
            }
        ],
        noble: {
            name: '缚锁全开·过载',
            desc: '单体爆发+无视闪避+宝具增伤生效',
            effect: 'arondightOverload', diceCount: 6, multiplier: 4, ignoreEvade: true
        }
    },
    mooncell_mizuki: {
        name: '水月无影',
        class: 'mooncell',
        avatar: 'assets/characters/moon_shadow.png',
        hp: 40000, np: 15,
        // ★ 时空控制+DOT型 — 控制锁人+持续掉血+分身围殴
        // ✗ 弱点：普攻倍率(diceCount=3)偏低，爆发不如纯输出角色
        skills: [
            {
                name: '固有时域制',
                desc: '对敌方造成3000~5000伤害+时停2~3回合+攻击力+25~35%×3回合+伤害加成+20~30%×3回合+敌方定身2回合+沉默1回合+灼烧1500×2回合',
                effect: 'timeStop', cd: 4,
                skillDamageMin: 3000, skillDamageMax: 5000,
                buffs: [
                    { type: 'ATK_PCT', min: 25, max: 35, duration: 3 },
                    { type: 'DMG_BONUS', min: 20, max: 30, duration: 3 }
                ],
                enemyBuffs: [
                    { type: 'ROOT', value: 1, duration: 2 },
                    { type: 'SILENCE', value: 1, duration: 1 },
                    { type: 'BURN', min: 1500, max: 1500, duration: 2 }
                ]
            },
            {
                name: '月瞳·城临',
                desc: '对敌方立即造成4000~6000伤害+千年城2~4回合+灼烧2500~4000/回合+通用易伤+20~30%×3回合+宝具易伤+20~30%×3回合+自身NP回复8~15/回合',
                effect: 'millenniumCastle', burnMin: 2500, burnMax: 4000, npRegenMin: 8, npRegenMax: 15, cd: 3,
                skillDamageMin: 4000, skillDamageMax: 6000,
                enemyBuffs: [
                    { type: 'VULN', min: 20, max: 30, duration: 3 },
                    { type: 'VULN_NOBLE', min: 20, max: 30, duration: 3 }
                ],
                buffs: [
                    { type: 'NP_REGEN', min: 8, max: 15, duration: 3 }
                ]
            },
            {
                name: '月影',
                desc: '召唤分身(分身死亡时对周围爆炸2500~4000伤害)+减伤+20~30%×3回合+暴击率+15~25%×3回合+闪避1次+NP获取率+30~50%×3回合+中毒1200×2回合',
                effect: 'moonShadow', cd: 3,
                skillDamageMin: 2500, skillDamageMax: 4000,
                buffs: [
                    { type: 'DEF_PCT', min: 20, max: 30, duration: 3 },
                    { type: 'CRIT_RATE', min: 15, max: 25, duration: 3 },
                    { type: 'EVADE', value: 1, duration: 99 },
                    { type: 'CHARGE_RATE', min: 30, max: 50, duration: 3 }
                ],
                enemyBuffs: [
                    { type: 'POISON', min: 1200, max: 1200, duration: 2 }
                ]
            }
        ],
        noble: {
            name: '月淮泉·花影',
            desc: '对全体敌方造成6000~9000伤害+5~7分身+千年城中退场爆伤5000~8000',
            effect: 'moonSpringFlowers', duration: 1, nobleDamageMin: 6000, nobleDamageMax: 9000, exitDamageMin: 5000, exitDamageMax: 8000
        }
    },
    lancer_hanxin: {
        name: '韩信',
        class: 'lancer',
        avatar: 'assets/characters/hanxin.png',
        hp: 38000, np: 0,
        passive: 'duoduoyishan',
        // ★ 斩杀收割型 — 敌人越残伤害越高，瞬移贴脸一刀斩
        // ✗ 弱点：前期伤害一般，需要先把敌人磨到半血；无上限被动是双刃剑(>200回复减半)
        skills: [
            {
                name: '暗度陈仓',
                desc: '瞬移+下次伤害×2+伤害加成+30~45%×1回合+追击40~60%×1回合',
                effect: 'secretPath', cd: 3,
                buffs: [
                    { type: 'DMG_BONUS', min: 30, max: 45, duration: 1 },
                    { type: 'DOUBLE_STRIKE', min: 40, max: 60, duration: 1 }
                ]
            },
            {
                name: '背水一战',
                desc: '处刑者(HP<50%)+35~60%×3回合+暴击率+25~40%×3回合+HP≤30%获得毅力',
                effect: 'lastStand', cd: 4,
                buffs: [
                    { type: 'LOW_HP_BONUS', min: 35, max: 60, duration: 3 },
                    { type: 'CRIT_RATE', min: 25, max: 40, duration: 3 }
                ]
            },
            {
                name: '十面埋伏',
                desc: '布置陷阱+敌方攻击弱化-15~25%×2回合+防御弱化+10~20%×2回合+定身1回合',
                effect: 'ambush', maxTraps: 10, rootDuration: 1, cd: 3,
                enemyBuffs: [
                    { type: 'ATK_DOWN', min: 15, max: 25, duration: 2 },
                    { type: 'DEF_DOWN', min: 10, max: 20, duration: 2 },
                    { type: 'ROOT', value: 1, duration: 1 }
                ]
            }
        ],
        noble: {
            name: '国士无双',
            desc: '范围爆发+NP溢出加成+宝具增伤生效',
            effect: 'unrivaledGeneral'
        }
    },
    // ═══ 李存勖 — 限时爆发弓手 ═══
    archer_licunxu: {
        name: '李存勖',
        class: 'archer',
        avatar: 'assets/characters/li_cunxu.png',
        hp: 38000, np: 0,
        diceCount: 5,
        passive: 'tenTurnLimit',
        // ★ 限时10回合 + 3只[矢] — 伤害极高但时间有限
        // ✗ 弱点：10回合后强制退场；矢用完宝具废掉
        skills: [
            {
                name: '枕戈泣血',
                desc: '[泣血]全图3000~5000伤害+等量回复 或 [射矢]消耗1矢，直线10000~16000伤害+回30~45NP+概率即死',
                effect: 'pillowSwordBlood', cd: 2,
                aoeDmgMin: 3000, aoeDmgMax: 5000,
                arrowDmgMin: 10000, arrowDmgMax: 16000,
                arrowNpMin: 30, arrowNpMax: 45,
                instakillRate: [5, 20, 40],
                buffs: [
                    { type: 'ATK_PCT', min: 10, max: 20, duration: 1 }
                ]
            },
            {
                name: '临危受命',
                desc: '强化下2次伤害(HP越低越强，最高+80%双乘区)+伤害加成+20~35%×2回合+条件束缚/护盾',
                effect: 'faceCrisis', cd: 3,
                buffedHits: 2,
                shieldMin: 4000, shieldMax: 6000,
                rootDuration: 2,
                buffs: [
                    { type: 'DMG_BONUS', min: 20, max: 35, duration: 2 },
                    { type: 'CRIT_RATE', min: 25, max: 40, duration: 2 }
                ]
            },
            {
                name: '所向披靡',
                desc: '对周围敌方造成4000~6000伤害+NP([矢]×12~20)+移动+3射程+3×2回合+瞬移+攻击力+25~35%×2回合',
                effect: 'invincibleAdvance', cd: 4,
                skillDamageMin: 4000, skillDamageMax: 6000,
                npPerArrowMin: 12, npPerArrowMax: 20,
                moveBonus: 3, rangeBonus: 3, buffDuration: 2,
                buffs: [
                    { type: 'ATK_PCT', min: 25, max: 35, duration: 2 }
                ]
            }
        ],
        noble: {
            name: '三箭定江山',
            desc: '消耗全部[矢]：[矢]次重击8000~12000+剑阵+冲击位移5000~8000+剑阵二次伤害5000~8000',
            effect: 'threeArrowsKingdom',
            hitDmgMin: 8000, hitDmgMax: 12000,
            chargeDmgMin: 5000, chargeDmgMax: 8000,
            formationDmgMin: 5000, formationDmgMax: 8000
        }
    }
};
