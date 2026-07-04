/* ═══════════════════════════════════════════════════════
   Fate Battle — Buff / Debuff System  v2
   多乘区伤害公式（参考炽焰天穹）：

   最终伤害 = 基础伤害
       × 攻击力乘区  (1 + ATK_PCT总和/100)
       × 伤害加成区  (1 + DMG_BONUS总和/100)
       × 暴击乘区    命中暴击时 (1 + CRIT_DMG/100)
       × 特攻乘区    (1 + 职阶克制/条件特攻)
       × 易伤乘区    (1 + 目标VULN总和/100)
     最后被防御乘区修正：
       × 防御乘区    max(0.1, 1 - DEF_PCT总和/100)

   同区内加算，跨区乘算。
   往不同乘区堆buff收益 >> 单区叠加。
   ═══════════════════════════════════════════════════════ */

const BuffSystem = (function () {
    'use strict';

    let _nextId = 1;

    // ── Buff 类型定义 ──
    // zone: 标记所属乘区（用于tooltip分组）
    const BUFF_TYPES = {
        // ═══ 攻击力乘区 ═══  同区加算
        ATK_PCT:   { name: '攻击力%',   icon: '⚔',  color: '#e74c3c', stackMode: 'add', zone: 'atk' },
        ATK_FLAT:  { name: '攻击力+',   icon: '⚔',  color: '#e57373', stackMode: 'add', zone: 'flat' },
        ATK_DOWN:  { name: '攻击弱化',  icon: '⚔↓', color: '#95a5a6', stackMode: 'add', zone: 'atk' },

        // ═══ 伤害加成区 ═══  同区加算
        DMG_BONUS:     { name: '伤害加成',   icon: '💢', color: '#ff7043', stackMode: 'add', zone: 'dmg' },
        SKILL_DMG_UP:  { name: '技能增伤',   icon: '📖', color: '#ab47bc', stackMode: 'add', zone: 'dmg' },
        NOBLE_DMG_UP:  { name: '宝具增伤',   icon: '🌀', color: '#7e57c2', stackMode: 'add', zone: 'dmg' },

        // ═══ 暴击乘区 ═══
        CRIT_RATE: { name: '暴击率',    icon: '💥', color: '#f39c12', stackMode: 'add', zone: 'crit' },
        CRIT_DMG:  { name: '暴击伤害',  icon: '✦',  color: '#ffb300', stackMode: 'add', zone: 'crit' },

        // ═══ 特攻乘区 ═══  条件触发 同区加算
        CLASS_ADV:    { name: '职阶克制', icon: '▲',  color: '#26a69a', stackMode: 'add', zone: 'special' },
        LOW_HP_BONUS: { name: '处刑者',   icon: '☠',  color: '#ef5350', stackMode: 'add', zone: 'special' },

        // ═══ 易伤乘区（挂在敌方身上） ═══
        VULN:      { name: '易伤',     icon: '🔻', color: '#ef9a9a', stackMode: 'add', zone: 'vuln' },
        VULN_SKILL:{ name: '技能易伤', icon: '📕', color: '#ce93d8', stackMode: 'add', zone: 'vuln' },
        VULN_NOBLE:{ name: '宝具易伤', icon: '📓', color: '#b39ddb', stackMode: 'add', zone: 'vuln' },

        // ═══ 防御乘区（挂在自身） ═══
        DEF_PCT:   { name: '减伤%',    icon: '🛡',  color: '#42a5f5', stackMode: 'add', zone: 'def' },
        DEF_FLAT:  { name: '减伤+',    icon: '🛡',  color: '#64b5f6', stackMode: 'add', zone: 'flat' },
        DEF_DOWN:  { name: '防御弱化', icon: '🛡↓', color: '#78909c', stackMode: 'add', zone: 'def' },

        // ═══ 范围 / 移动 ═══
        RANGE_UP:  { name: '射程提升', icon: '🎯', color: '#66bb6a', stackMode: 'max' },
        MOVE_UP:   { name: '移动提升', icon: '👟', color: '#66bb6a', stackMode: 'max' },
        MOVE_DOWN: { name: '移动降低', icon: '🦶', color: '#78909c', stackMode: 'max' },

        // ═══ 持续伤害 / 恢复（每回合触发） ═══
        REGEN:     { name: '回复',     icon: '💚', color: '#66bb6a', stackMode: 'add',     perTurn: true },
        POISON:    { name: '中毒',     icon: '☠',  color: '#9c27b0', stackMode: 'add',     perTurn: true },
        BURN:      { name: '灼烧',     icon: '🔥', color: '#ff9800', stackMode: 'refresh', perTurn: true },
        NP_REGEN:  { name: 'NP回复',   icon: '⚡', color: '#fdd835', stackMode: 'add',     perTurn: true },
        NP_DRAIN:  { name: 'NP流失',   icon: '⚡↓',color: '#616161', stackMode: 'add',     perTurn: true },

        // ═══ 特殊机制 ═══
        LIFESTEAL: { name: '吸血',     icon: '🩸', color: '#c62828', stackMode: 'add' },
        THORNS:    { name: '反伤',     icon: '🌹', color: '#d32f2f', stackMode: 'add' },
        CHARGE_RATE:{ name: 'NP获取率',icon: '⚡↑',color: '#fdd835', stackMode: 'add' },
        DOUBLE_STRIKE:{ name: '追击', icon: '⚔⚔',color: '#e53935', stackMode: 'add' },

        // ═══ 控制 ═══
        SILENCE:   { name: '沉默',     icon: '🔇', color: '#78909c', stackMode: 'refresh' },
        ROOT:      { name: '定身',     icon: '🔒', color: '#78909c', stackMode: 'refresh' },

        // ═══ 护盾 / 生存 ═══
        SHIELD:    { name: '护盾',     icon: '🛡', color: '#29b6f6', stackMode: 'add' },
        EVADE:     { name: '闪避',     icon: '💨', color: '#eceff1', stackMode: 'count' },
        GUTS:      { name: '毅力',     icon: '❤',  color: '#e53935', stackMode: 'count' },
        IMMUNE_SKILL:  { name: '技能免疫', icon: '✨', color: '#4fc3f7', stackMode: 'count' },
        IMMUNE_NOBLE:  { name: '宝具免疫', icon: '🌟', color: '#ffd54f', stackMode: 'count' },
    };

    // ── 核心 API ──

    function addBuff(unit, type, value, duration, source) {
        if (!unit || !unit.data) return null;
        if (!BUFF_TYPES[type]) { console.warn('Unknown buff type:', type); return null; }
        const def = BUFF_TYPES[type];
        if (!unit.data.buffs) unit.data.buffs = [];

        const existing = unit.data.buffs.find(b => b.type === type && b.source === source);
        if (existing) {
            switch (def.stackMode) {
                case 'add':     existing.value += value; existing.duration = Math.max(existing.duration, duration); return existing;
                case 'max':     existing.value = Math.max(existing.value, value); existing.duration = Math.max(existing.duration, duration); return existing;
                case 'refresh': existing.value = value; existing.duration = duration; return existing;
                case 'count':   existing.value += value; existing.duration = Math.max(existing.duration, duration); return existing;
            }
        }

        const buff = { id: _nextId++, type, value, duration, source: source || '?', def };
        unit.data.buffs.push(buff);
        return buff;
    }

    function removeBuff(unit, idOrType) {
        if (!unit || !unit.data || !unit.data.buffs) return;
        if (typeof idOrType === 'number') {
            unit.data.buffs = unit.data.buffs.filter(b => b.id !== idOrType);
        } else {
            unit.data.buffs = unit.data.buffs.filter(b => b.type !== idOrType);
        }
    }

    function removeBuffBySource(unit, source) {
        if (!unit || !unit.data || !unit.data.buffs) return;
        unit.data.buffs = unit.data.buffs.filter(b => b.source !== source);
    }

    function hasBuffType(unit, type) {
        if (!unit || !unit.data || !unit.data.buffs) return false;
        return unit.data.buffs.some(b => b.type === type && b.duration > 0);
    }

    function getBuffValue(unit, type) {
        if (!unit || !unit.data || !unit.data.buffs) return 0;
        return unit.data.buffs
            .filter(b => b.type === type && b.duration > 0)
            .reduce((sum, b) => sum + b.value, 0);
    }

    function consumeBuff(unit, type) {
        if (!unit || !unit.data || !unit.data.buffs) return false;
        const buff = unit.data.buffs.find(b => b.type === type && b.value > 0);
        if (!buff) return false;
        buff.value--;
        if (buff.value <= 0) removeBuff(unit, buff.id);
        return true;
    }

    // ══════════════════════════════════════════════
    //  多乘区伤害公式
    // ══════════════════════════════════════════════

    function calcDamage(attacker, defender, baseDamage, damageType) {
        const log = [];
        const scale = (typeof DAMAGE_SCALE !== 'undefined') ? DAMAGE_SCALE : 1;
        let dmg = baseDamage * scale;

        // 固定攻击力加成（在乘区之前，也要放大）
        const flatAtk = getBuffValue(attacker, 'ATK_FLAT') * scale;
        if (flatAtk) { dmg += flatAtk; log.push(`攻+${flatAtk}`); }

        // ── 乘区1: 攻击力% ──
        const atkPct = getBuffValue(attacker, 'ATK_PCT') - getBuffValue(attacker, 'ATK_DOWN');
        if (atkPct !== 0) {
            const mult = 1 + atkPct / 100;
            dmg = Math.floor(dmg * Math.max(0.1, mult));
            log.push(`攻击力${atkPct > 0 ? '+' : ''}${atkPct}%`);
        }

        // ── 乘区2: 伤害加成% ──
        let dmgBonus = getBuffValue(attacker, 'DMG_BONUS');
        if (damageType === 'skill') dmgBonus += getBuffValue(attacker, 'SKILL_DMG_UP');
        if (damageType === 'noble') dmgBonus += getBuffValue(attacker, 'NOBLE_DMG_UP');
        if (dmgBonus !== 0) {
            dmg = Math.floor(dmg * (1 + dmgBonus / 100));
            log.push(`增伤+${dmgBonus}%`);
        }

        // ── 乘区3: 暴击 ──
        const critRate = getBuffValue(attacker, 'CRIT_RATE');
        if (critRate > 0 && Math.random() * 100 < critRate) {
            const critDmg = 50 + getBuffValue(attacker, 'CRIT_DMG');
            dmg = Math.floor(dmg * (1 + critDmg / 100));
            log.push(`暴击! +${critDmg}%`);
        }

        // ── 乘区4: 特攻 ──
        let specialPct = getBuffValue(attacker, 'CLASS_ADV');
        const lowHpBonus = getBuffValue(attacker, 'LOW_HP_BONUS');
        if (lowHpBonus > 0 && defender && defender.data) {
            const hpRatio = defender.data.hp / (isFinite(defender.data.maxHp) ? defender.data.maxHp : 100);
            if (hpRatio < 0.5) { specialPct += lowHpBonus; log.push(`处刑+${lowHpBonus}%`); }
        }
        if (specialPct > 0) {
            dmg = Math.floor(dmg * (1 + specialPct / 100));
            if (!log.some(l => l.includes('处刑'))) log.push(`特攻+${specialPct}%`);
        }

        // ── 乘区5: 目标易伤% ──
        if (defender) {
            let vulnPct = getBuffValue(defender, 'VULN');
            if (damageType === 'skill') vulnPct += getBuffValue(defender, 'VULN_SKILL');
            if (damageType === 'noble') vulnPct += getBuffValue(defender, 'VULN_NOBLE');
            if (vulnPct > 0) {
                dmg = Math.floor(dmg * (1 + vulnPct / 100));
                log.push(`易伤+${vulnPct}%`);
            }
        }

        // ── 固定减伤（在乘区之后） ──
        if (defender) {
            const defFlat = getBuffValue(defender, 'DEF_FLAT');
            if (defFlat > 0) { dmg = Math.max(1, dmg - defFlat); log.push(`减伤-${defFlat}`); }
        }

        // ── 乘区6: 防御% ──
        if (defender) {
            const defPct = getBuffValue(defender, 'DEF_PCT') - getBuffValue(defender, 'DEF_DOWN');
            if (defPct !== 0) {
                dmg = Math.floor(dmg * Math.max(0.1, 1 - defPct / 100));
                log.push(`防御${defPct}%`);
            }
        }

        // 随机浮动 ±5%
        const variance = 0.95 + Math.random() * 0.1;
        dmg = Math.floor(dmg * variance);

        return { damage: Math.max(1, dmg), log };
    }

    // ── 受伤前检查（闪避/免疫/护盾） ──
    function checkIncomingBlock(defender, damage, damageType) {
        if (damageType === 'attack' && consumeBuff(defender, 'EVADE')) {
            return { damage: 0, blocked: 'evade' };
        }
        if (damageType === 'skill' && consumeBuff(defender, 'IMMUNE_SKILL')) {
            return { damage: 0, blocked: 'immune_skill' };
        }
        if (damageType === 'noble' && consumeBuff(defender, 'IMMUNE_NOBLE')) {
            return { damage: 0, blocked: 'immune_noble' };
        }

        // 护盾吸收
        const shield = getBuffValue(defender, 'SHIELD');
        if (shield > 0 && damage > 0) {
            if (shield >= damage) {
                _reduceBuffValue(defender, 'SHIELD', damage);
                return { damage: 0, blocked: 'shield', absorbed: damage };
            } else {
                damage -= shield;
                removeBuff(defender, 'SHIELD');
            }
        }
        return { damage, blocked: null };
    }

    // ── 攻击后效果（吸血/追击/反伤） ──
    function getPostAttackEffects(attacker, defender, dealtDamage) {
        const effects = [];
        const lifesteal = getBuffValue(attacker, 'LIFESTEAL');
        if (lifesteal > 0) {
            const heal = Math.floor(dealtDamage * lifesteal / 100);
            effects.push({ type: 'heal', target: 'attacker', value: heal, label: `吸血${heal}HP` });
        }
        const thorns = getBuffValue(defender, 'THORNS');
        if (thorns > 0) {
            const reflect = Math.floor(dealtDamage * thorns / 100);
            effects.push({ type: 'damage', target: 'attacker', value: reflect, label: `反伤${reflect}` });
        }
        const doubleStrike = getBuffValue(attacker, 'DOUBLE_STRIKE');
        if (doubleStrike > 0 && Math.random() * 100 < doubleStrike) {
            effects.push({ type: 'doubleStrike', label: '追击!' });
        }
        // NP获取率加成
        const chargeRate = getBuffValue(attacker, 'CHARGE_RATE');
        if (chargeRate > 0) {
            const bonusNP = Math.floor(chargeRate / 10);
            if (bonusNP > 0) effects.push({ type: 'np', target: 'attacker', value: bonusNP, label: `NP率+${bonusNP}` });
        }
        return effects;
    }

    // 保持旧API兼容
    function modifyOutgoingDamage(attacker, baseDamage) {
        return calcDamage(attacker, null, baseDamage, 'attack').damage;
    }

    function modifyIncomingDamage(defender, baseDamage, damageType) {
        return checkIncomingBlock(defender, baseDamage, damageType);
    }

    function _reduceBuffValue(unit, type, amount) {
        if (!unit.data.buffs) return;
        let remaining = amount;
        unit.data.buffs.forEach(b => {
            if (b.type === type && remaining > 0) {
                const take = Math.min(b.value, remaining);
                b.value -= take;
                remaining -= take;
            }
        });
        unit.data.buffs = unit.data.buffs.filter(b => !(b.type === type && b.value <= 0));
    }

    // ══════════════════════════════════════════════
    //  回合开始 tick
    // ══════════════════════════════════════════════

    function tickBuffs(unit, scene) {
        if (!unit || !unit.data || !unit.data.buffs) return [];
        const logs = [];
        const expired = [];

        unit.data.buffs.forEach(buff => {
            if (buff.def.perTurn && buff.duration > 0) {
                switch (buff.type) {
                    case 'REGEN': {
                        const heal = buff.value;
                        const maxHp = unit.data.maxHp === Infinity ? 99999 : (unit.data.maxHp || 40000);
                        unit.data.hp = Math.min(maxHp, unit.data.hp + heal);
                        if (scene) { scene.updateUnitBars(unit); if (scene.showHealNumber) scene.showHealNumber(unit, heal); }
                        logs.push(`${unit.data.name} 回复${heal}HP (${buff.source})`);
                        break;
                    }
                    case 'POISON': case 'BURN': {
                        const dmg = buff.value;
                        unit.data.hp -= dmg;
                        if (scene) { scene.updateUnitBars(unit); if (scene.showDamageNumber) scene.showDamageNumber(unit, dmg); }
                        logs.push(`${unit.data.name} ${buff.def.name}${dmg}伤害 (${buff.source})`);
                        break;
                    }
                    case 'NP_REGEN': {
                        if (scene) scene.gainNP(unit, buff.value, buff.source);
                        else { unit.data.np = Math.min(unit.data.maxNp === Infinity ? 200 : (unit.data.maxNp || 100), unit.data.np + buff.value); }
                        break;
                    }
                    case 'NP_DRAIN': {
                        unit.data.np = Math.max(0, unit.data.np - buff.value);
                        if (scene) scene.updateUnitBars(unit);
                        logs.push(`${unit.data.name} NP-${buff.value} (${buff.source})`);
                        break;
                    }
                }
            }
            if (buff.duration > 0) {
                buff.duration--;
                if (buff.duration <= 0) expired.push(buff);
            }
        });

        expired.forEach(buff => {
            logs.push(`${unit.data.name} [${buff.def.name}] 效果结束`);
            removeBuff(unit, buff.id);
        });

        if (unit.data.hp <= 0 && scene) {
            if (consumeBuff(unit, 'GUTS')) {
                unit.data.hp = 1;
                scene.updateUnitBars(unit);
                logs.push(`${unit.data.name} 毅力发动!`);
            } else {
                logs.push(`${unit.data.name} 被击败!`);
                scene.destroyUnit(unit);
            }
        }
        return logs;
    }

    // ══════════════════════════════════════════════
    //  范围 / 移动 / 状态查询
    // ══════════════════════════════════════════════

    function getModifiedMoveRange(unit) {
        return Math.max(0, (unit.data.moveRange || 0) + getBuffValue(unit, 'MOVE_UP') - getBuffValue(unit, 'MOVE_DOWN'));
    }
    function getModifiedAttackRange(unit) {
        return (unit.data.attackRange || 0) + getBuffValue(unit, 'RANGE_UP');
    }
    function isSilenced(unit) { return hasBuffType(unit, 'SILENCE'); }
    function isRooted(unit)   { return hasBuffType(unit, 'ROOT'); }

    // ══════════════════════════════════════════════
    //  UI 渲染
    // ══════════════════════════════════════════════

    function renderBuffIcons(scene, unit) {
        if (unit.data._buffIcons) {
            unit.data._buffIcons.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
        }
        unit.data._buffIcons = [];
        if (!unit.data.buffs || unit.data.buffs.length === 0) return;

        const startX = unit.x - 28;
        const startY = unit.y + (GAME_CONFIG.tileSize / 2) + 2;
        const spacing = 13;
        const maxIcons = 5;
        const visibleBuffs = unit.data.buffs.filter(b => b.duration > 0).slice(0, maxIcons);

        visibleBuffs.forEach((buff, i) => {
            const x = startX + i * spacing;
            const y = startY;
            const colorVal = parseInt(buff.def.color.replace('#', ''), 16);
            const bg = scene.add.rectangle(x, y, 11, 11, 0x000000, 0.75).setDepth(15);
            bg.setStrokeStyle(0.5, colorVal, 0.6);
            const txt = scene.add.text(x, y, String(buff.duration > 90 ? '∞' : buff.duration), {
                fontSize: '7px', fill: buff.def.color, fontStyle: 'bold', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(16);
            unit.data._buffIcons.push(bg, txt);
        });

        if (unit.data.buffs.filter(b => b.duration > 0).length > maxIcons) {
            const more = scene.add.text(startX + maxIcons * spacing, startY, '+', {
                fontSize: '7px', fill: '#888', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(16);
            unit.data._buffIcons.push(more);
        }
    }

    function getBuffSummary(unit) {
        if (!unit || !unit.data || !unit.data.buffs) return '';
        return unit.data.buffs.filter(b => b.duration > 0)
            .map(b => `${b.def.icon}${b.value}(${b.duration > 90 ? '∞' : b.duration}t)`)
            .join(' ');
    }

    // ── 公开 API ──
    return Object.freeze({
        BUFF_TYPES,
        addBuff, removeBuff, removeBuffBySource,
        hasBuffType, getBuffValue, consumeBuff,
        tickBuffs,
        calcDamage, checkIncomingBlock, getPostAttackEffects,
        modifyOutgoingDamage, modifyIncomingDamage,
        getModifiedMoveRange, getModifiedAttackRange,
        isSilenced, isRooted,
        renderBuffIcons, getBuffSummary
    });
})();
