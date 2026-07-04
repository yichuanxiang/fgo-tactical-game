/* ═══════════════════════════════════════════════════════
   李存勖 — 专属技能 & 被动处理
   被动：登场3只[矢]，只能存活10回合
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── 被动初始化（createUnit 后调用） ──
    function initPassive(unit) {
        if (!unit || !unit.data) return;
        unit.data.arrows = 3;
        unit.data.turnsRemaining = 10;
    }

    // ── 回合开始 tick（在 processBuffTick 之后调用） ──
    function tickPassive(unit, scene) {
        if (!unit || !unit.data || unit.data.charId !== 'archer_licunxu') return;
        unit.data.turnsRemaining--;
        scene.addLog(`${unit.data.name} 剩余${unit.data.turnsRemaining}回合 [矢]×${unit.data.arrows}`);
        if (unit.data.turnsRemaining <= 0) {
            scene.addLog(`${unit.data.name} 存在时间耗尽，退场！`);
            if (scene.createRadialBurstAt) scene.createRadialBurstAt(unit.x, unit.y, 0xffd700, 120, 20, 1500);
            scene.destroyUnit(unit);
        }
    }

    // ── 矢标记 UI（在 buff 图标旁显示） ──
    function renderArrowMarkers(scene, unit) {
        if (unit.data._arrowIcons) {
            unit.data._arrowIcons.forEach(o => { if (o && o.destroy) o.destroy(); });
        }
        unit.data._arrowIcons = [];
        if (unit.data.charId !== 'archer_licunxu') return;

        const arrows = unit.data.arrows || 0;
        const turns = unit.data.turnsRemaining || 0;
        const x = unit.x;
        const y = unit.y - (GAME_CONFIG.tileSize / 2) - 8;

        // 矢标记
        for (let i = 0; i < 3; i++) {
            const ax = x - 12 + i * 12;
            const filled = i < arrows;
            const marker = scene.add.text(ax, y, '↑', {
                fontSize: '10px',
                fill: filled ? '#ffd700' : '#333',
                fontStyle: 'bold',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(18);
            unit.data._arrowIcons.push(marker);
        }

        // 回合倒计时
        const turnColor = turns <= 3 ? '#ff4444' : (turns <= 6 ? '#ffaa00' : '#aaaaaa');
        const turnText = scene.add.text(x + 22, y, `${turns}t`, {
            fontSize: '8px', fill: turnColor,
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(18);
        unit.data._arrowIcons.push(turnText);
    }

    // ═══════════════════════════════════════════════
    //  技能1：枕戈泣血
    // ═══════════════════════════════════════════════
    function usePillowSwordBlood(scene, unit, skill) {
        const d = unit.data;
        const arrows = d.arrows || 0;

        // 弹出模式选择
        scene.clearSkillButtons();
        const cx = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2;
        const cy = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2;

        scene.skillButtons = [];

        // 模式1：泣血（全图AOE+回血）
        const btn1 = scene.createStyledButton(cx - 90, cy, '泣血', 0xe74c3c, '#fff', () => {
            scene.clearSkillButtons();
            _doPillowBlood(scene, unit, skill);
        }, 150, 40);
        btn1.setDepth(200);
        scene.skillButtons.push(btn1);

        // 模式2：射矢（需要矢）
        const canArrow = arrows > 0;
        const btn2 = scene.createStyledButton(cx + 90, cy, canArrow ? `射矢 (矢×${arrows})` : '无矢可射', canArrow ? 0xffd700 : 0x444444, canArrow ? '#000' : '#666', () => {
            if (!canArrow) return;
            scene.clearSkillButtons();
            _doPillowArrow(scene, unit, skill);
        }, 150, 40);
        btn2.setDepth(200);
        scene.skillButtons.push(btn2);

        // 取消
        const btnCancel = scene.createStyledButton(cx, cy + 50, '取消', 0x555555, '#aaa', () => {
            scene.clearSkillButtons();
            // 退还CD
            if (d.skillCDs) {
                const idx = d.skills.findIndex(s => s.effect === 'pillowSwordBlood');
                if (idx >= 0) d.skillCDs[idx] = 0;
            }
            scene.actionText.setText('选择行动');
        }, 80, 30);
        btnCancel.setDepth(200);
        scene.skillButtons.push(btnCancel);

        scene.actionText.setText('选择模式：[泣血]全图伤害回血 / [射矢]消耗矢前方大伤害');
    }

    function _doPillowBlood(scene, unit, skill) {
        const dmg = Phaser.Math.Between(skill.aoeDmgMin, skill.aoeDmgMax);
        const enemies = scene.units.filter(u => u.data && u.data.team !== unit.data.team);

        enemies.forEach(e => {
            const result = BuffSystem.calcDamage(unit, e, Math.round(dmg / DAMAGE_SCALE), 'skill');
            scene.dealDamage(e, result.damage, 'skill');
            if (scene.showDamageNumber) scene.showDamageNumber(e, result.damage);
        });

        // 回复等量HP
        const maxHp = unit.data.maxHp === Infinity ? 99999 : unit.data.maxHp;
        unit.data.hp = Math.min(maxHp, unit.data.hp + dmg);
        scene.updateUnitBars(unit);
        if (scene.showHealNumber) scene.showHealNumber(unit, dmg);
        scene.addLog(`${unit.data.name} 枕戈泣血! 全图${fmtNum(dmg)}伤害+回复${fmtNum(dmg)}HP`);

        if (scene.createRadialBurstAt) scene.createRadialBurstAt(unit.x, unit.y, 0xe74c3c, 100, 16, 1500);
        if (scene.shakeCamera) scene.shakeCamera(120, 0.003);
        audioManager.playSkill();
        scene.finishAction();
    }

    function _doPillowArrow(scene, unit, skill) {
        unit.data.arrows--;
        const arrows = unit.data.arrows;

        // 选择方向
        scene.actionText.setText('选择射击方向');
        scene.showLineAttackDirections(unit, 8);
        scene.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            const dirTile = scene.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'direction');

            if (dirTile) {
                scene.clearHighlights();
                const enemies = scene.getEnemiesInLine(unit, dirTile.dir, 8);
                const baseDmg = Phaser.Math.Between(skill.arrowDmgMin, skill.arrowDmgMax);

                enemies.forEach(e => {
                    // 即死判定
                    const killChance = skill.instakillRate[arrows] || 0;
                    if (Math.random() * 100 < killChance) {
                        scene.addLog(`${unit.data.name} 一箭穿心！${e.data.name} 即死！`);
                        if (scene.showCombatText) scene.showCombatText(e, '即死', '#ff0000', '28px');
                        if (scene.createRadialBurstAt) scene.createRadialBurstAt(e.x, e.y, 0xff0000, 120, 20, 1800);
                        e.data.hp = 0;
                        scene.updateUnitBars(e);
                        scene.destroyUnit(e);
                    } else {
                        const result = BuffSystem.calcDamage(unit, e, Math.round(baseDmg / DAMAGE_SCALE), 'skill');
                        scene.dealDamage(e, result.damage, 'skill');
                        if (scene.showDamageNumber) scene.showDamageNumber(e, result.damage);
                    }
                });

                // 回复NP
                const npGain = Phaser.Math.Between(skill.arrowNpMin, skill.arrowNpMax);
                scene.gainNP(unit, npGain, '射矢');

                scene.addLog(`${unit.data.name} 射矢! 剩余[矢]×${arrows} (即死率${skill.instakillRate[arrows] || 0}%)`);
                if (scene.createRadialBurstAt) scene.createRadialBurstAt(unit.x, unit.y, 0xffd700, 80, 12, 1200);
                if (scene.shakeCamera) scene.shakeCamera(150, 0.005);
                audioManager.playAttack();
                renderArrowMarkers(scene, unit);
                scene.finishAction();
            } else {
                // 没选方向，重新等待
                _doPillowArrow(scene, unit, skill);
            }
        });
    }

    // ═══════════════════════════════════════════════
    //  技能2：临危受命
    // ═══════════════════════════════════════════════
    function useFaceCrisis(scene, unit, skill) {
        const d = unit.data;
        const hpRatio = d.hp / (isFinite(d.maxHp) ? d.maxHp : 36000);
        const missingPct = Math.floor((1 - hpRatio) * 80);
        const atkBonus = Math.max(10, missingPct);

        // 强化下N次伤害
        BuffSystem.addBuff(unit, 'DMG_BONUS', atkBonus, skill.buffedHits + 5, '临危受命');
        BuffSystem.addBuff(unit, 'ATK_PCT', Math.floor(atkBonus * 0.6), skill.buffedHits + 5, '临危受命');
        scene.addLog(`${d.name} 临危受命! 伤害加成+${atkBonus}% 攻击力+${Math.floor(atkBonus * 0.6)}% (血量${Math.round(hpRatio * 100)}%)`);

        // 检查敌方是否在攻击范围
        const attackRange = BuffSystem.getModifiedAttackRange(unit);
        const enemies = scene.units.filter(u => u.data && u.data.team !== d.team);
        const inRange = enemies.some(e => {
            const dist = Math.abs(e.data.x - d.x) + Math.abs(e.data.y - d.y);
            return dist <= attackRange;
        });

        if (inRange) {
            // 在射程内：给护盾，破碎后束缚
            const shieldVal = Phaser.Math.Between(skill.shieldMin, skill.shieldMax);
            BuffSystem.addBuff(unit, 'SHIELD', shieldVal, 99, '临危受命');
            d.crisisShieldActive = true;
            d.crisisRootDuration = skill.rootDuration;
            scene.addLog(`敌方在射程内! 获得${fmtNum(shieldVal)}护盾 (破碎后束缚敌方${skill.rootDuration}回合)`);
        } else {
            // 不在射程内：直接束缚
            enemies.forEach(e => {
                BuffSystem.addBuff(e, 'ROOT', 1, skill.rootDuration, '临危受命');
            });
            scene.addLog(`敌方不在射程内! 束缚全体敌方${skill.rootDuration}回合`);
        }

        if (scene.createRadialBurstAt) scene.createRadialBurstAt(unit.x, unit.y, 0xff6600, 80, 14, 1200);
        scene.refreshAllBuffIcons();
        audioManager.playSkill();
        scene.finishAction();
    }

    // ═══════════════════════════════════════════════
    //  技能3：所向披靡
    // ═══════════════════════════════════════════════
    function useInvincibleAdvance(scene, unit, skill) {
        const d = unit.data;
        const arrows = d.arrows || 0;

        // 对周围敌方造成伤害
        if (skill.skillDamageMin) {
            const dmg = Phaser.Math.Between(skill.skillDamageMin, skill.skillDamageMax);
            scene.units.filter(u => u.data && u.data.team !== d.team).forEach(e => {
                const dist = Math.abs(e.data.x - d.x) + Math.abs(e.data.y - d.y);
                if (dist <= 4) {
                    scene.dealDamage(e, dmg, 'skill');
                    if (scene.showDamageNumber) scene.showDamageNumber(e, dmg);
                }
            });
            scene.addLog(`所向披靡冲击! ${fmtNum(Phaser.Math.Between(skill.skillDamageMin, skill.skillDamageMax))}伤害`);
        }

        // NP回复
        const npPerArrow = Phaser.Math.Between(skill.npPerArrowMin, skill.npPerArrowMax);
        const totalNp = arrows * npPerArrow;
        scene.gainNP(unit, totalNp, `所向披靡(矢×${arrows})`);

        // 强化移动和射程
        BuffSystem.addBuff(unit, 'MOVE_UP', skill.moveBonus, skill.buffDuration, '所向披靡');
        BuffSystem.addBuff(unit, 'RANGE_UP', skill.rangeBonus, skill.buffDuration, '所向披靡');
        scene.addLog(`${d.name} 所向披靡! NP+${totalNp} 移动+${skill.moveBonus} 射程+${skill.rangeBonus} (${skill.buffDuration}回合)`);

        // 瞬移
        d.hasTeleport = true;
        scene.addLog('获得1次瞬移机会');

        if (scene.createRadialBurstAt) scene.createRadialBurstAt(unit.x, unit.y, 0x00ccff, 120, 18, 1500);
        if (scene.playScreenPulse) scene.playScreenPulse(0x00ccff, 0.15, 250);
        if (scene.shakeCamera) scene.shakeCamera(120, 0.003);
        scene.refreshAllBuffIcons();
        renderArrowMarkers(scene, unit);
        audioManager.playSkill();
        scene.finishAction();
    }

    // ═══════════════════════════════════════════════
    //  宝具：三箭定江山
    // ═══════════════════════════════════════════════
    function useThreeArrowsKingdom(scene, unit, noble) {
        const d = unit.data;
        const arrows = Math.max(1, d.arrows || 0);
        d.arrows = 0;

        audioManager.playNoble();
        if (scene.playScreenPulse) scene.playScreenPulse(0xffd700, 0.25, 400);
        if (scene.shakeCamera) scene.shakeCamera(200, 0.006);

        scene.addLog(`${d.name} 宝具发动: 三箭定江山! (矢×${arrows})`);

        const enemies = scene.units.filter(u => u.data && u.data.team !== d.team);
        if (enemies.length === 0) { renderArrowMarkers(scene, unit); scene.finishAction(); return; }

        // 记录剑阵位置
        const formationTiles = [];
        let delay = 0;

        // 阶段1：[矢]次重击 + 留下剑阵
        for (let i = 0; i < arrows; i++) {
            scene.time.delayedCall(delay, () => {
                enemies.forEach(e => {
                    if (!e.data || e.data.hp <= 0) return;
                    const hitDmg = Phaser.Math.Between(noble.hitDmgMin, noble.hitDmgMax);
                    const result = BuffSystem.calcDamage(unit, e, Math.round(hitDmg / DAMAGE_SCALE), 'noble');
                    scene.dealDamage(e, result.damage, 'noble');
                    if (scene.showDamageNumber) scene.showDamageNumber(e, result.damage);
                    scene.addLog(`第${i + 1}箭! ${e.data.name} 受到${fmtNum(result.damage)}伤害`);

                    // 在敌人周围留下剑阵
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
                            const fx = e.data.x + dx, fy = e.data.y + dy;
                            if (fx >= 0 && fx < GAME_CONFIG.mapWidth && fy >= 0 && fy < GAME_CONFIG.mapHeight) {
                                if (!formationTiles.some(t => t.x === fx && t.y === fy)) {
                                    formationTiles.push({ x: fx, y: fy });
                                    const px = fx * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                                    const py = fy * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                                    const tile = scene.add.rectangle(px, py, GAME_CONFIG.tileSize - 6, GAME_CONFIG.tileSize - 6, 0xffd700, 0.3)
                                        .setStrokeStyle(1.5, 0xffd700, 0.7).setDepth(3);
                                    formationTiles[formationTiles.length - 1].tile = tile;
                                }
                            }
                        }
                    }
                });
                if (scene.shakeCamera) scene.shakeCamera(100, 0.004);
            });
            delay += 400;
        }

        // 阶段2：冲击位移（2次）
        const chargeCount = 2;
        for (let c = 0; c < chargeCount; c++) {
            scene.time.delayedCall(delay, () => {
                enemies.forEach(e => {
                    if (!e.data || e.data.hp <= 0) return;

                    // 冲击伤害
                    const chgDmg = Phaser.Math.Between(noble.chargeDmgMin, noble.chargeDmgMax);
                    const chgResult = BuffSystem.calcDamage(unit, e, Math.round(chgDmg / DAMAGE_SCALE), 'noble');
                    scene.dealDamage(e, chgResult.damage, 'noble');
                    if (scene.showDamageNumber) scene.showDamageNumber(e, chgResult.damage);

                    // 强制位移：推向远离李存勖的方向
                    const pushDx = Math.sign(e.data.x - d.x) || 1;
                    const pushDy = Math.sign(e.data.y - d.y) || 0;
                    const pushDist = 2;
                    let newX = e.data.x, newY = e.data.y;
                    for (let step = 0; step < pushDist; step++) {
                        const nx = newX + pushDx, ny = newY + pushDy;
                        if (nx < 0 || nx >= GAME_CONFIG.mapWidth || ny < 0 || ny >= GAME_CONFIG.mapHeight) break;
                        if (scene.getUnitAt(nx, ny)) break;

                        newX = nx; newY = ny;

                        // 经过剑阵？二次伤害！
                        if (formationTiles.some(t => t.x === nx && t.y === ny)) {
                            const fmDmg = Phaser.Math.Between(noble.formationDmgMin, noble.formationDmgMax);
                            e.data.hp -= fmDmg;
                            scene.updateUnitBars(e);
                            if (scene.showDamageNumber) scene.showDamageNumber(e, fmDmg);
                            scene.addLog(`${e.data.name} 经过剑阵! 受到${fmtNum(fmDmg)}二次伤害`);
                            if (scene.createRadialBurstAt) {
                                const px = nx * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                                const py = ny * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                                scene.createRadialBurstAt(px, py, 0xffd700, 50, 10, 800);
                            }
                        }
                    }

                    // 执行位移
                    if (newX !== e.data.x || newY !== e.data.y) {
                        scene.moveUnit(e, newX, newY);
                        scene.addLog(`冲击! ${e.data.name} 被推到 (${newX},${newY})`);
                    }

                    if (e.data.hp <= 0) {
                        scene.addLog(`${e.data.name} 被击败!`);
                        scene.destroyUnit(e);
                    }
                });
                if (scene.shakeCamera) scene.shakeCamera(150, 0.005);
            });
            delay += 500;
        }

        // 清理剑阵 + 结束
        scene.time.delayedCall(delay + 600, () => {
            formationTiles.forEach(t => {
                if (t.tile) {
                    scene.tweens.add({ targets: t.tile, alpha: 0, duration: 400, onComplete: () => t.tile.destroy() });
                }
            });
            renderArrowMarkers(scene, unit);
            scene.finishAction();
        });
    }

    // ═══════════════════════════════════════════════
    //  注册到全局
    // ═══════════════════════════════════════════════
    window.LiCunxuSkills = {
        initPassive,
        tickPassive,
        renderArrowMarkers,
        usePillowSwordBlood,
        useFaceCrisis,
        useInvincibleAdvance,
        useThreeArrowsKingdom
    };
})();
