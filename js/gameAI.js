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
            u.setAlpha(1);
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

        this.diceResult = Phaser.Math.Between(1, 6);
        const effect = RANDOM_EFFECTS[this.diceResult];
        this.diceDisplay.setVisible(true);
        this.diceDisplay.setText(String(this.diceResult));
        this.diceResultText.setText(`敌人随机 ${this.diceResult}: ${effect.name}`);

        const scene = this;
        setTimeout(() => {
            switch(effect.type) {
                case 'move':
                    scene.enemyMove(scene.currentUnit.data.moveRange + 2);
                    break;
                case 'attack':
                    scene.enemyAttack();
                    break;
                case 'skill1':
                case 'skill2':
                case 'skill3':
                    const skillIndex = parseInt(effect.type.slice(-1)) - 1;
                    scene.useSkillEnemy(skillIndex);
                    break;
                case 'charge':
                    scene.currentUnit.data.np = Math.min(100, scene.currentUnit.data.np + 30);
                    scene.updateUnitBars(scene.currentUnit);
                    scene.finishAction();
                    break;
            }
        }, 500);
    },

    enemyMove(range) {
        const players = this.units.filter(u => u.data.team === 'player');
        if (players.length === 0) { this.finishAction(); return; }

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

        this.finishAction();
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
