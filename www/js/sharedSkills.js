/* ═══════════════════════════════════════════════════════
   Fate Battle — 共享技能模块
   所有技能/宝具效果在此统一调度。
   GameScene 和 TestScene 只需调用 SharedSkills.executeSkill()
   和 SharedSkills.executeNobleEffect()，无需各自维护 switch。
   ═══════════════════════════════════════════════════════ */

const SharedSkills = (function() {
    'use strict';

    // ── 技能调度入口 ──
    function executeSkill(scene, unit, index) {
        const skill = unit.data.skills[index];
        if (!skill) { scene.finishAction(); return; }
        scene.actionText.setText(`使用技能: ${skill.name}`);
        audioManager.playSkill();

        // 自动施加技能定义中的 buffs（给自己）
        _applySkillBuffs(scene, unit, skill);

        // 自动施加技能定义中的 enemyBuffs（给所有敌方）
        _applySkillEnemyBuffs(scene, unit, skill);

        // 尝试共享模块内置处理器
        if (_handleBuiltin(scene, unit, skill)) return;

        // 回退到场景自带处理器
        if (typeof scene._onSkill === 'function') {
            scene._onSkill(skill, index);
        } else {
            scene.finishAction();
        }
    }

    // ── 自动施加 skill.buffs ──
    function _applySkillBuffs(scene, unit, skill) {
        if (!skill.buffs || !skill.buffs.length) return;
        skill.buffs.forEach(b => {
            const val = b.value != null ? b.value : Phaser.Math.Between(b.min || 0, b.max || 0);
            BuffSystem.addBuff(unit, b.type, val, b.duration || 3, skill.name);
            const def = BuffSystem.BUFF_TYPES[b.type];
            if (def) scene.addLog(`${unit.data.name} [${def.name}]+${val} (${b.duration || 3}回合)`);
        });
        if (scene.refreshAllBuffIcons) scene.refreshAllBuffIcons();
    }

    // ── 自动施加 skill.enemyBuffs ──
    function _applySkillEnemyBuffs(scene, unit, skill) {
        if (!skill.enemyBuffs || !skill.enemyBuffs.length) return;
        const enemies = scene.units.filter(u => u.data && u.data.team !== unit.data.team && !u.data.isClone);
        if (enemies.length === 0) return;
        skill.enemyBuffs.forEach(b => {
            enemies.forEach(enemy => {
                const val = b.value != null ? b.value : Phaser.Math.Between(b.min || 0, b.max || 0);
                BuffSystem.addBuff(enemy, b.type, val, b.duration || 3, skill.name);
                const def = BuffSystem.BUFF_TYPES[b.type];
                if (def) scene.addLog(`${enemy.data.name} [${def.name}]+${val} (${b.duration || 3}回合)`);
            });
        });
        if (scene.refreshAllBuffIcons) scene.refreshAllBuffIcons();
    }

    // ── 宝具调度入口 ──
    function executeNobleEffect(scene, unit, noble) {
        scene.actionText.setText(`宝具发动: ${noble.name}!`);

        // 尝试共享模块内置处理器
        if (_handleNobleBuiltin(scene, unit, noble)) return;

        // 回退到场景自带处理器
        if (typeof scene._onNoble === 'function') {
            scene._onNoble(noble);
        } else {
            // 通用 AOE
            const enemies = scene.units.filter(u => u.data && u.data.team !== unit.data.team);
            enemies.forEach(e => {
                const dist = Math.abs(e.data.x - unit.data.x) + Math.abs(e.data.y - unit.data.y);
                if (dist <= (noble.range || 5)) { scene.dealDamage(e, noble.damage || 50, 'noble'); }
            });
            scene.finishAction();
        }
    }

    // ── 内置技能处理器 ──
    function _handleBuiltin(scene, unit, skill) {
        switch (skill.effect) {
            // 通用效果 — 走 BuffSystem
            case 'heal': {
                const healAmt = Phaser.Math.Between(skill.value || 2000, (skill.value || 2000) + 1500);
                unit.data.hp = Math.min(unit.data.maxHp === Infinity ? 99999 : (unit.data.maxHp || 40000), unit.data.hp + healAmt);
                scene.updateUnitBars(unit);
                scene.addLog(`${unit.data.name} 恢复${fmtNum(healAmt)}HP`);
                if (scene.showHealNumber) scene.showHealNumber(unit, healAmt);
                scene.finishAction(); return true;
            }
            case 'charge': {
                const npAmt = Phaser.Math.Between(skill.value || 15, (skill.value || 15) + 15);
                scene.gainNP(unit, npAmt, skill.name);
                scene.finishAction(); return true;
            }
            case 'atkBuff': {
                const atkPct = Phaser.Math.Between(skill.value || 15, (skill.value || 15) + 15);
                BuffSystem.addBuff(unit, 'ATK_PCT', atkPct, skill.turns || 3, skill.name);
                scene.addLog(`${unit.data.name} 攻击力+${atkPct}% (${skill.turns || 3}回合)`);
                scene.refreshAllBuffIcons();
                scene.finishAction(); return true;
            }
            case 'extraDice':
                unit.data.extraDice = (unit.data.extraDice || 0) + (skill.value || 2); scene.finishAction(); return true;
            case 'burstMode':
                unit.data.burstMode = skill.value || 3; unit.data.burstAtkBonus = skill.atkBonus || 10;
                unit.data.burstRangeBonus = skill.rangeBonus || 2; scene.finishAction(); return true;
            case 'shield': {
                const shieldVal = Phaser.Math.Between(skill.value || 3000, (skill.value || 3000) + 2000);
                BuffSystem.addBuff(unit, 'SHIELD', shieldVal, 99, skill.name);
                scene.addLog(`${unit.data.name} 获得${fmtNum(shieldVal)}护盾`);
                scene.refreshAllBuffIcons();
                scene.updateUnitBars(unit); scene.finishAction(); return true;
            }
            case 'evade':
                BuffSystem.addBuff(unit, 'EVADE', 1, 99, skill.name);
                scene.addLog(`${unit.data.name} 获得闪避`);
                scene.refreshAllBuffIcons();
                scene.finishAction(); return true;
            case 'guts':
                BuffSystem.addBuff(unit, 'GUTS', 1, 99, skill.name);
                scene.addLog(`${unit.data.name} 获得毅力`);
                scene.refreshAllBuffIcons();
                scene.finishAction(); return true;
            case 'critBuff': {
                const critVal = Phaser.Math.Between(30, 60);
                BuffSystem.addBuff(unit, 'CRIT_UP', critVal, skill.turns || 2, skill.name);
                scene.addLog(`${unit.data.name} 暴击率+${critVal}% (${skill.turns || 2}回合)`);
                scene.refreshAllBuffIcons();
                scene.finishAction(); return true;
            }
            case 'healAll': {
                const healVal = Phaser.Math.Between(skill.value || 1500, (skill.value || 1500) + 1000);
                scene.units.filter(u => u.data && u.data.team === unit.data.team).forEach(u => {
                    u.data.hp = Math.min(u.data.maxHp === Infinity ? 99999 : (u.data.maxHp || 40000), u.data.hp + healVal);
                    scene.updateUnitBars(u);
                    if (scene.showHealNumber) scene.showHealNumber(u, healVal);
                });
                scene.addLog(`全体回复${healVal}HP`);
                scene.finishAction(); return true;
            }
            case 'teamAtkBuff': {
                const teamAtkPct = Phaser.Math.Between(skill.value || 10, (skill.value || 10) + 12);
                scene.units.filter(u => u.data && u.data.team === unit.data.team).forEach(u => {
                    BuffSystem.addBuff(u, 'ATK_PCT', teamAtkPct, 3, skill.name);
                });
                scene.addLog(`全体攻击力+${teamAtkPct}% (3回合)`);
                scene.refreshAllBuffIcons();
                scene.finishAction(); return true;
            }
            case 'directDamage':
                scene.showAttackRange(unit);
                if (scene.highlightTiles && scene.highlightTiles.length > 0) {
                    scene._setupSkillDamageInput(skill.value || 20);
                } else { scene.finishAction(); }
                return true;

            // ── 水月无影 ──
            case 'timeStop':     _useTimeStop(scene, unit, skill); return true;
            case 'millenniumCastle': _useMillenniumCastle(scene, unit, skill); return true;
            case 'moonShadow':   _useMoonShadow(scene, unit, skill); return true;

            default: return false; // 未处理，回退到 scene._onSkill
        }
    }

    function _handleNobleBuiltin(scene, unit, noble) {
        switch (noble.effect) {
            case 'moonSpringFlowers': _useMoonSpringFlowers(scene, unit, noble); return true;
            case 'lineAoe': case 'aoe':
                scene.units.filter(u => u.data && u.data.team !== unit.data.team).forEach(e => {
                    const dist = Math.abs(e.data.x - unit.data.x) + Math.abs(e.data.y - unit.data.y);
                    if (dist <= (noble.range || 5)) { scene.dealDamage(e, noble.damage || 50, 'noble'); }
                });
                scene.finishAction(); return true;
            case 'single': case 'pierce':
                const enemies = scene.units.filter(u => u.data && u.data.team !== unit.data.team);
                if (enemies.length > 0) {
                    let nearest = enemies[0], minDist = Infinity;
                    enemies.forEach(e => {
                        const d = Math.abs(e.data.x - unit.data.x) + Math.abs(e.data.y - unit.data.y);
                        if (d < minDist) { minDist = d; nearest = e; }
                    });
                    scene.dealDamage(nearest, noble.damage || 50, 'noble');
                }
                scene.finishAction(); return true;
            default: return false;
        }
    }

    // ═══════════════════════════════════════════════════
    // 水月无影 — 固有时域制
    // ═══════════════════════════════════════════════════
    function _useTimeStop(scene, unit, skill) {
        const d = unit.data;
        const duration = Phaser.Math.Between(2, 3);
        scene.timeStopTurns = (scene.timeStopTurns || 0) + duration;
        scene.timeStopCaster = unit;

        // 直接伤害（走乘区：吃自身攻击力/伤害加成 + 目标易伤）
        if (skill.skillDamageMin) {
            const dmg = Phaser.Math.Between(skill.skillDamageMin, skill.skillDamageMax || skill.skillDamageMin);
            scene.units.filter(function(u) { return u.data && u.data.team !== d.team; }).forEach(function(e) {
                const result = BuffSystem.calcDamage(unit, e, Math.round(dmg / DAMAGE_SCALE), 'skill');
                scene.dealDamage(e, result.damage, 'skill');
                if (scene.showDamageNumber) scene.showDamageNumber(e, result.damage);
                scene.addLog(`${e.data.name} 受到时域崩坏 ${fmtNum(result.damage)}伤害`);
            });
        }

        if (scene.createRadialBurstAt) scene.createRadialBurstAt(unit.x, unit.y, 0x88ccff, 100, 18, 1800);
        if (scene.playScreenPulse) scene.playScreenPulse(0x88ccff, 0.15, 250);
        if (scene.shakeCamera) scene.shakeCamera(120, 0.003);
        scene.addLog(`${d.name} 发动固有时域制！时间停止${duration}回合！`);
        scene.finishAction();
    }

    // ═══════════════════════════════════════════════════
    // 水月无影 — 月瞳·城临
    // ═══════════════════════════════════════════════════
    function _doCastleEffect(scene, unit, skill) {
        const d = unit.data;
        const duration = Phaser.Math.Between(2, 4);
        scene.millenniumCastleActive = true;
        scene.millenniumCastleTurns = duration;
        scene.millenniumCastleCaster = unit;
        scene.millenniumCastleBurnMin = skill.burnMin || 10;
        scene.millenniumCastleBurnMax = skill.burnMax || 20;
        scene.millenniumCastleNpMin = skill.npRegenMin || 5;
        scene.millenniumCastleNpMax = skill.npRegenMax || 15;
        scene.millenniumCastleOriginalTiles = [];
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            scene.millenniumCastleOriginalTiles[y] = [];
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                scene.millenniumCastleOriginalTiles[y][x] = scene.map[y][x].baseColor;
            }
        }
        const mapPixelW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const mapPixelH = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        const centerX = mapPixelW / 2, centerY = mapPixelH / 2;
        if (scene.millenniumCastleBg) scene.millenniumCastleBg.destroy();
        if (scene.textures.exists('millennium_castle_bg')) {
            scene.millenniumCastleBg = scene.add.image(centerX, centerY, 'millennium_castle_bg');
            scene.millenniumCastleBg.setDisplaySize(mapPixelW, mapPixelH).setDepth(-0.5).setAlpha(0);
            scene.tweens.add({ targets: scene.millenniumCastleBg, alpha: 0.45, duration: 800, ease: 'Quad.easeIn' });
        } else {
            scene.millenniumCastleBg = scene.add.rectangle(centerX, centerY, mapPixelW, mapPixelH, 0x1a0a2e, 0.3).setDepth(-0.5);
        }
        const castleColors = [0x2a1a3e, 0x1e1430, 0x332044, 0x261838, 0x2d1c3a, 0x1f1232];
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const tile = scene.map[y][x].tile;
                const newColor = castleColors[(x * 7 + y * 13) % castleColors.length];
                scene.map[y][x].baseColor = newColor;
                const dist = Math.abs(d.x - x) + Math.abs(d.y - y);
                scene.time.delayedCall(dist * 30, () => { tile.setFillStyle(newColor, 0.6); tile.setStrokeStyle(1.5, 0x6c3483, 0.4); });
            }
        }
        if (scene.createRadialBurstAt) scene.createRadialBurstAt(unit.x, unit.y, 0x6c3483, 120, 20, 1800);
        if (scene.playScreenPulse) scene.playScreenPulse(0x6c3483, 0.18, 300);
        if (scene.shakeCamera) scene.shakeCamera(150, 0.002);
        // 立即伤害（走乘区：吃自身攻击力/伤害加成 + 目标易伤）
        if (skill.skillDamageMin) {
            var burstDmg = Phaser.Math.Between(skill.skillDamageMin, skill.skillDamageMax || skill.skillDamageMin);
            scene.units.filter(function(u) { return u.data && u.data.team !== d.team; }).forEach(function(e) {
                var res = BuffSystem.calcDamage(unit, e, Math.round(burstDmg / DAMAGE_SCALE), 'skill');
                scene.dealDamage(e, res.damage, 'skill');
                if (scene.showDamageNumber) scene.showDamageNumber(e, res.damage);
                scene.addLog(e.data.name + ' 受到千年城降临冲击 ' + fmtNum(res.damage) + ' 伤害');
            });
        }
        // 侵蚀伤害
        scene.units.filter(function(u) { return u.data && u.data.team !== d.team; }).forEach(function(e) {
            var dmg = Phaser.Math.Between(skill.burnMin || 10, skill.burnMax || 20);
            e.data.hp -= dmg;
            scene.updateUnitBars(e);
            if (scene.showDamageNumber) scene.showDamageNumber(e, dmg);
            scene.addLog(e.data.name + ' 受到千年城侵蚀 ' + dmg + ' 伤害');
            if (e.data.hp <= 0) { scene.addLog(e.data.name + ' 被千年城吞噬!'); scene.destroyUnit(e); }
            if (!e.data.nobleSeal || e.data.nobleSeal <= 0) e.data.nobleSeal = 1;
        });
        // 自身恢复NP
        var npRegen = Phaser.Math.Between(skill.npRegenMin || 5, skill.npRegenMax || 15);
        d.np = Math.min(d.maxNp === Infinity ? 200 : (d.maxNp || 100), d.np + npRegen);
        scene.updateUnitBars(unit);
        scene.addLog(`${d.name} 展开千年城！持续${duration}回合`);
        scene.finishAction();
    }

    function _useMillenniumCastle(scene, unit, skill) {
        // 有技能视频则先播放（用原生 HTML5 video 元素）
        var videoKey = 'skill_millennium_castle';
        var hasVideo = scene.cache && scene.cache.video && scene.cache.video.exists(videoKey);
        if (hasVideo) {
            var gameCanvas = scene.sys.game.canvas;
            var rect = gameCanvas.getBoundingClientRect();
            // 创建原生 video 元素覆盖 canvas
            var el = document.createElement('video');
            el.src = 'assets/skills/mooncell_castle.mp4';
            el.style.position = 'fixed';
            el.style.left = rect.left + 'px';
            el.style.top = rect.top + 'px';
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.style.zIndex = '99999';
            el.style.background = '#000';
            el.setAttribute('playsinline', '');
            document.body.appendChild(el);
            var finished = false;
            var skip = function() {
                if (finished) return;
                finished = true;
                try { el.pause(); } catch(e) {}
                if (el.parentNode) el.parentNode.removeChild(el);
                _doCastleEffect(scene, unit, skill);
            };
            el.addEventListener('ended', skip);
            el.addEventListener('error', skip);
            el.addEventListener('click', skip);
            // 15秒超时兜底
            scene.time.delayedCall(15000, function() { if (!finished) skip(); });
            el.play().catch(function() { skip(); });
        } else {
            _doCastleEffect(scene, unit, skill);
        }
    }

    // ═══════════════════════════════════════════════════
    // 水月无影 — 月影（分身）
    // ═══════════════════════════════════════════════════
    function _useMoonShadow(scene, unit, skill) {
        const d = unit.data;
        if (d.isClone) { scene.addLog('分身无法再次分身'); scene.finishAction(); return; }
        const hpRatio = Phaser.Math.Between(25, 50) / 100;
        const hpCost = Math.floor(d.hp * hpRatio);
        if (d.hp <= hpCost) { scene.addLog('HP不足'); scene.finishAction(); return; }
        d.hp -= hpCost;
        scene.updateUnitBars(unit);
        if (scene.showDamageNumber) scene.showDamageNumber(unit, hpCost);

        const adjPos = _findAdjacentEmpty(scene, d.x, d.y);
        if (!adjPos) { d.hp += hpCost; scene.updateUnitBars(unit); scene.addLog('无空位'); scene.finishAction(); return; }
        const clone = _createCloneUnit(scene, adjPos.x, adjPos.y, d.team, d.charId, unit);
        // 分身死亡时爆炸伤害（走乘区）
        if (skill && skill.skillDamageMin) {
            clone.data.deathExplodeMin = skill.skillDamageMin;
            clone.data.deathExplodeMax = skill.skillDamageMax || skill.skillDamageMin;
        }
        if (scene.createRadialBurstAt) scene.createRadialBurstAt(adjPos.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            adjPos.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2, 0xb8a9d4, 60, 12, 1200);
        scene.addLog(`${d.name} 消耗${fmtNum(hpCost)}HP(${Math.round(hpRatio * 100)}%)，召唤月之分身！`);
        scene.finishAction();
    }

    // ═══════════════════════════════════════════════════
    // 水月无影 — 宝具：月淮泉·花影
    // ═══════════════════════════════════════════════════
    function _useMoonSpringFlowers(scene, unit, noble) {
        const d = unit.data, cloneCount = Phaser.Math.Between(5, 7);
        const inCastle = scene.millenniumCastleActive && scene.millenniumCastleTurns > 0;
        audioManager.playNoble();
        if (scene.createRadialBurstAt) scene.createRadialBurstAt(unit.x, unit.y, 0xd4b8f0, 100, 12, 1500);
        if (scene.playScreenPulse) scene.playScreenPulse(0xb8a9d4, 0.22, 300);
        if (scene.shakeCamera) scene.shakeCamera(200, 0.005);

        // 宝具直接伤害
        if (noble.nobleDamageMin) {
            const nobleDmg = Phaser.Math.Between(noble.nobleDamageMin, noble.nobleDamageMax || noble.nobleDamageMin);
            scene.units.filter(u => u.data && u.data.team !== d.team).forEach(e => {
                const result = BuffSystem.calcDamage(unit, e, Math.round(nobleDmg / DAMAGE_SCALE), 'noble');
                scene.dealDamage(e, result.damage, 'noble');
                if (scene.showDamageNumber) scene.showDamageNumber(e, result.damage);
                scene.addLog(`月淮泉冲击 ${e.data.name} ${fmtNum(result.damage)}伤害`);
            });
        }

        scene.addLog(`${d.name} 发动宝具: 月淮泉·花影！召唤${cloneCount}个月之分身！`);
        if (inCastle) scene.addLog('千年城中！退场伤害增强');
        let spawned = 0;
        const delay = 60; // 更快的召唤间隔
        for (let i = 0; i < cloneCount; i++) {
            scene.time.delayedCall(i * delay, () => {
                const pos = _findAdjacentEmpty(scene, d.x, d.y);
                if (pos) {
                    const clone = _createCloneUnit(scene, pos.x, pos.y, d.team, d.charId, unit);
                    clone.data.isNobleClone = true; clone.data.nobleCloneTurns = 1;
                    clone.data.nobleCloneExitMin = noble.exitDamageMin || 20;
                    clone.data.nobleCloneExitMax = noble.exitDamageMax || 40;
                    clone.data.nobleCloneInCastle = inCastle;
                    clone.data.name = CHARACTERS[d.charId].name + '(花影)';
                    clone.data.np = 0;
                    clone.setAlpha(0);
                    scene.tweens.add({ targets: clone, alpha: 0.55, duration: 200 });
                    const px = pos.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                    const py = pos.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                    if (scene.createRadialBurstAt) scene.createRadialBurstAt(px, py, 0xd4b8f0, 40, 8, 800);
                    spawned++;
                }
            });
        }
        scene.time.delayedCall(cloneCount * delay + 300, () => {
            scene.finishAction();
        });
    }

    // ═══════════════════════════════════════════════════
    // 通用 — 千年城管理
    // ═══════════════════════════════════════════════════
    function processMillenniumCastle(scene) {
        if (!scene.millenniumCastleActive || scene.millenniumCastleTurns <= 0) return;
        const caster = scene.millenniumCastleCaster;
        if (!caster || !caster.data) { endMillenniumCastle(scene); return; }
        scene.units.filter(u => u.data && u.data.team !== caster.data.team).forEach(e => {
            const dmg = Phaser.Math.Between(scene.millenniumCastleBurnMin, scene.millenniumCastleBurnMax);
            e.data.hp -= dmg; scene.updateUnitBars(e);
            if (scene.showDamageNumber) scene.showDamageNumber(e, dmg);
            scene.addLog(`${e.data.name} 千年城侵蚀 ${dmg} 伤害`);
            if (e.data.hp <= 0) { scene.addLog(`${e.data.name} 被千年城吞噬!`); scene.destroyUnit(e); }
            if (!e.data.nobleSeal || e.data.nobleSeal <= 0) e.data.nobleSeal = 1;
        });
        const npRegen = Phaser.Math.Between(scene.millenniumCastleNpMin, scene.millenniumCastleNpMax);
        caster.data.np = Math.min(caster.data.maxNp === Infinity ? 200 : (caster.data.maxNp || 100), caster.data.np + npRegen);
        scene.updateUnitBars(caster);
        scene.millenniumCastleTurns--;
        if (scene.millenniumCastleTurns <= 0) endMillenniumCastle(scene);
    }

    function endMillenniumCastle(scene) {
        scene.millenniumCastleActive = false; scene.millenniumCastleTurns = 0;
        if (scene.millenniumCastleBg) {
            scene.tweens.add({ targets: scene.millenniumCastleBg, alpha: 0, duration: 600,
                onComplete: () => { if (scene.millenniumCastleBg) { scene.millenniumCastleBg.destroy(); scene.millenniumCastleBg = null; } } });
        }
        if (scene.millenniumCastleOriginalTiles) {
            for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
                for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                    const origColor = scene.millenniumCastleOriginalTiles[y]?.[x];
                    if (origColor !== undefined && scene.map[y]?.[x]) {
                        const tile = scene.map[y][x].tile;
                        scene.map[y][x].baseColor = origColor;
                        const dist = Math.abs(Math.floor(GAME_CONFIG.mapWidth / 2) - x) + Math.abs(Math.floor(GAME_CONFIG.mapHeight / 2) - y);
                        scene.time.delayedCall(dist * 20, () => { tile.setFillStyle(origColor, 1); tile.setStrokeStyle(1, 0x101722, 0.82); });
                    }
                }
            }
        }
        scene.addLog('千年城消散了...');
    }

    function processNobleClones(scene) {
        scene.units.filter(u => u.data && u.data.isNobleClone).forEach(clone => {
            clone.data.nobleCloneTurns--;
            if (clone.data.nobleCloneTurns <= 0) {
                if (clone.data.nobleCloneInCastle) {
                    const dmg = Phaser.Math.Between(clone.data.nobleCloneExitMin, clone.data.nobleCloneExitMax);
                    scene.units.filter(u => u.data && u.data.team !== clone.data.team && !u.data.isClone && !u.data.isNobleClone).forEach(e => {
                        const dist = Math.abs(e.data.x - clone.data.x) + Math.abs(e.data.y - clone.data.y);
                        if (dist <= 2) {
                            const res = BuffSystem.calcDamage(clone, e, Math.round(dmg / DAMAGE_SCALE), 'noble');
                            scene.dealDamage(e, res.damage, 'noble');
                            if (scene.showDamageNumber) scene.showDamageNumber(e, res.damage);
                            if (scene.createRadialBurstAt) scene.createRadialBurstAt(e.x, e.y, 0xd4b8f0, 45, 8, 800);
                            scene.addLog(`花影退场: ${e.data.name} 受到${fmtNum(res.damage)}伤害`);
                        }
                    });
                }
                _destroyCloneUnit(scene, clone);
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // 通用 — 分身管理
    // ═══════════════════════════════════════════════════
    function _findAdjacentEmpty(scene, x, y) {
        const candidates = [];
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (Math.abs(dx) + Math.abs(dy) !== 2) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < GAME_CONFIG.mapWidth && ny >= 0 && ny < GAME_CONFIG.mapHeight &&
                    !scene.units.find(u => u.data && u.data.x === nx && u.data.y === ny) &&
                    scene.map[ny] && scene.map[ny][nx] && scene.map[ny][nx].walkable) {
                    candidates.push({ x: nx, y: ny });
                }
            }
        }
        return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
    }

    function _createCloneUnit(scene, x, y, team, charId, originalUnit) {
        const charData = CHARACTERS[charId], classData = CLASS_CONFIG[charData.class];
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        let sprite, portraitH = 0;

        if (charData.avatar && scene.textures.exists(charId)) {
            const tex = scene.textures.get(charId);
            const aspectRatio = tex.getSourceImage().width / tex.getSourceImage().height;
            const displayW = GAME_CONFIG.tileSize - 6;
            const displayH = Math.min(displayW / aspectRatio, GAME_CONFIG.tileSize - 6);
            portraitH = displayH;
            sprite = scene.add.image(posX, posY, charId).setDisplaySize(displayW, displayH).setDepth(8);
        } else {
            sprite = scene.add.circle(posX, posY, GAME_CONFIG.tileSize / 3, classData.color).setDepth(8);
        }
        sprite.setAlpha(0.65).setTint(0xccbbff);

        const borderH = portraitH > 0 ? portraitH + 12 : GAME_CONFIG.tileSize - 6;
        const borderY = posY;
        const border = scene.add.rectangle(posX, borderY, GAME_CONFIG.tileSize - 6, borderH)
            .setStrokeStyle(2.5, 0xb8a9d4, 0.9).setFillStyle(0x2a1a4e, 0.25).setDepth(7);

        const cloneLabel = scene.add.text(posX, posY + GAME_CONFIG.tileSize / 2 - 4, '月影', {
            fontSize: '9px', fill: '#b8a9d4', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(12);

        const hpBarBg = scene.add.rectangle(posX, posY - 35, 42, 6, 0x101722, 0.9).setDepth(10);
        const hpBar = scene.add.rectangle(posX, posY - 35, 40, 4, 0x9b59b6).setDepth(11);
        const npBarBg = scene.add.rectangle(posX, posY - 26, 42, 5, 0x101722, 0.9).setDepth(10);
        const npBar = scene.add.rectangle(posX - 20, posY - 26, 0, 3, 0xf1c40f).setDepth(11).setOrigin(0, 0.5);
        const shieldBar = scene.add.rectangle(posX - 20, posY - 42, 0, 3, 0x3498db).setDepth(11).setOrigin(0, 0.5);

        // 分身作为完整独立单位：有自己的HP/NP/技能CD/行动
        const cloneHp = Math.floor(originalUnit.data.hp * 0.6);
        const cloneMaxHp = Math.floor((isFinite(originalUnit.data.maxHp) ? originalUnit.data.maxHp : 40000) * 0.6);
        sprite.data = {
            x, y, team, charId, name: charData.name + '(月影)',
            className: classData.name, class: charData.class,
            hp: cloneHp, maxHp: cloneMaxHp,
            np: 0, maxNp: originalUnit.data.maxNp,
            shield: 0, diceCount: charData.diceCount || classData.diceCount,
            moveRange: classData.moveRange, attackRange: classData.attackRange,
            skills: charData.skills, noble: charData.noble,
            buffs: [], atkBuff: 0, extraDice: 0, burstMode: 0,
            burstAtkBonus: 0, burstRangeBonus: 0, silenced: 0,
            doubleDamage: false, berserk: false, guts: false,
            extraAction: false, acted: false,
            hasMoved: false, hasActed: false,
            skillCDs: charData.skills.map(() => 0),
            isClone: true, cloneMaster: originalUnit,
            fullClone: true,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border, cloneLabel
        };
        scene.units.push(sprite);
        return sprite;
    }

    function _destroyCloneUnit(scene, unit) {
        if (!unit || !unit.data) return;
        const d = unit.data;
        if (d.isClone && !d.isNobleClone && d.cloneMaster && d.cloneMaster.data) {
            const np = d.np || 0;
            if (np > 0) {
                const maxNp = d.cloneMaster.data.maxNp === Infinity ? 200 : (d.cloneMaster.data.maxNp || 100);
                d.cloneMaster.data.np = Math.min(maxNp, (d.cloneMaster.data.np || 0) + np);
                scene.updateUnitBars(d.cloneMaster);
                scene.addLog(`月影NP(${np})转移至本体`);
            }
        }
        [unit, d.border, d.hpBar, d.hpBarBg, d.npBar, d.npBarBg, d.shieldBar, d.cloneLabel].forEach(el => {
            if (el) scene.tweens.add({ targets: el, alpha: 0, scaleX: 0.5, scaleY: 0.5, duration: 300, onComplete: () => el.destroy() });
        });
        scene.units = scene.units.filter(u => u !== unit);
    }

    // ── 公开 API ──
    return {
        executeSkill,
        executeNobleEffect,
        processMillenniumCastle,
        endMillenniumCastle,
        processNobleClones,
    };
})();
