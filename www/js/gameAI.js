/* ═══════════════════════════════════════════════════════
   Fate Battle — Enemy AI Mixin
   Extracted from GameScene. Handles local enemy turns
   when playing in single-player or test mode.
   ═══════════════════════════════════════════════════════ */

Object.assign(GameScene.prototype, {

    startEnemyTurn() {
        this.currentTurn = 'enemy';
        this.showTurnBanner('玩家2 回合');
        this.turnText.setText('当前回合: 玩家2');
        this.turnIndicator.setText('⚡ 玩家2 回合');
        this.addLog('--- 玩家2 回合 ---');

        this.updateTrapVisibility();
        this.processBuffTick('enemy');
        this.processBurnDamage('enemy');
        this.processMillenniumCastle('enemy');
        this.processNobleClones();

        if (this.timeStopTurns > 0) {
            this.timeStopTurns--;
            this.addLog(`固有时域制: 时间停止剩余${this.timeStopTurns}回合`);
            if (this.timeStopTurns <= 0) {
                this.addLog('时间重新开始流动');
                this.timeStopCaster = null;
            }
        }

        if (this.ubwActive && this.ubwOwner && this.ubwOwner.data.team === 'enemy') {
            this.processUBWTurn();
        }

        const enemyUnits = this.units.filter(u => u.data.team === 'enemy');
        enemyUnits.forEach(u => {
            u.data.acted = false;
            u.data.hasMoved = false;
            u.data.hasActed = false;
            u.setAlpha(1);
            this.tickSkillCDs(u);
            if (u.data.silenced > 0) u.data.silenced--;
            if (u.data.forAllOne > 0) {
                u.data.forAllOne--;
                if (u.data.forAllOne <= 0) {
                    u.setAlpha(1);
                    u.data.critNext = false;
                    this.addLog(`${u.data.name} 骑士不留名效果结束`);
                }
            }
            if (u.data.nobleSeal > 0) {
                u.data.nobleSeal--;
                if (u.data.nobleSeal <= 0) {
                    this.addLog(`${u.data.name} 宝具封印解除`);
                }
            }
            if (u.data.stolenNoble && u.data.stolenNoble.turnsLeft > 0) {
                u.data.stolenNoble.turnsLeft--;
                if (u.data.stolenNoble.turnsLeft <= 0) {
                    this.addLog(`${u.data.name} 偷来的宝具 ${u.data.stolenNoble.noble.name} 消失了`);
                    u.data.stolenNoble = null;
                }
            }
        });

        const playerUnits = this.units.filter(u => u.data.team === 'player');
        playerUnits.forEach(u => {
            u.data.acted = true;
            u.setAlpha(0.5);
        });

        const scene = this;
        setTimeout(() => scene.selectNextUnit(), 1000);
    },

    enemyAction() {
        if (!this.currentUnit || this.currentUnit.data.team !== 'enemy') return;

        const unit = this.currentUnit;
        const d = unit.data;
        const scene = this;

        // AI决策：移动+行动双阶段
        setTimeout(() => {
            // 阶段1：移动（向最近的敌人靠近）
            if (!d.hasMoved) {
                scene.enemyMove(d.moveRange);
            }

            // 阶段2：行动（优先攻击，其次技能）
            setTimeout(() => {
                // 检查是否可以宝具
                if (d.np >= 100 && !d.nobleSeal) {
                    scene.useNoble();
                    return;
                }

                // 检查是否有可用技能（CD就绪）
                const availableSkill = scene.enemyPickSkill(unit);
                if (availableSkill !== -1 && Math.random() < 0.4) {
                    const skill = d.skills[availableSkill];
                    const cdValue = skill.cd || SKILL_CD_DEFAULT[availableSkill] || 3;
                    d.skillCDs[availableSkill] = cdValue;
                    scene.actionText.setText(`${d.name} 使用 ${skill.name}`);
                    scene.executeSkill(availableSkill);
                    return;
                }

                // 普通攻击
                scene.enemyAttack();
            }, 600);
        }, 500);
    },

    enemyPickSkill(unit) {
        const d = unit.data;
        const cds = d.skillCDs || [];
        const sealed = d.sealedSkills || {};
        const available = [];
        for (let i = 0; i < d.skills.length; i++) {
            if ((cds[i] || 0) <= 0 && !(sealed[i] && sealed[i] > 0)) {
                available.push(i);
            }
        }
        if (available.length === 0) return -1;
        return available[Phaser.Math.Between(0, available.length - 1)];
    },

    enemyMove(range) {
        const players = this.units.filter(u => u.data.team === 'player');
        if (players.length === 0) { this.currentUnit.data.hasMoved = true; return; }

        let nearest = players[0];
        let minDist = Infinity;
        players.forEach(p => {
            const dist = Math.abs(p.data.x - this.currentUnit.data.x) + Math.abs(p.data.y - this.currentUnit.data.y);
            if (dist < minDist) { minDist = dist; nearest = p; }
        });

        const dx = Math.sign(nearest.data.x - this.currentUnit.data.x);
        const dy = Math.sign(nearest.data.y - this.currentUnit.data.y);

        let newX = this.currentUnit.data.x + dx * Math.min(range, Math.abs(nearest.data.x - this.currentUnit.data.x));
        let newY = this.currentUnit.data.y + dy * Math.min(range, Math.abs(nearest.data.y - this.currentUnit.data.y));

        newX = Math.max(0, Math.min(GAME_CONFIG.mapWidth - 1, newX));
        newY = Math.max(0, Math.min(GAME_CONFIG.mapHeight - 1, newY));

        if (!this.getUnitAt(newX, newY)) {
            this.moveUnit(this.currentUnit, newX, newY);
        }

        this.currentUnit.data.hasMoved = true;
    },

    enemyAttack() {
        const players = this.units.filter(u => u.data.team === 'player');
        let target = null;

        for (const p of players) {
            const dist = Math.abs(p.data.x - this.currentUnit.data.x) + Math.abs(p.data.y - this.currentUnit.data.y);
            if (dist <= this.currentUnit.data.attackRange) {
                target = p;
                break;
            }
        }

        if (target) {
            this.attack(this.currentUnit, target);
        } else {
            this.actionText.setText('敌人没有可攻击的目标');
            this.finishAction();
        }
    },

    useSkillEnemy(index) {
        const skill = this.currentUnit.data.skills[index];
        if (!skill) { this.finishAction(); return; }

        this.actionText.setText(`${this.currentUnit.data.name} 使用 ${skill.name}`);

        switch(skill.effect) {
            case 'heal':
                this.currentUnit.data.hp = Math.min(this.currentUnit.data.maxHp, this.currentUnit.data.hp + skill.value);
                this.updateUnitBars(this.currentUnit);
                break;
            case 'atkBuff':
                this.currentUnit.data.atkBuff += skill.value;
                break;
            case 'directDamage':
                const players = this.units.filter(u => u.data.team === 'player');
                if (players.length > 0) {
                    this.dealDamage(players[0], skill.value, 'skill');
                }
                break;
        }

        this.finishAction();
    }

});
