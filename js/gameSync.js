/* ═══════════════════════════════════════════════════════
   Fate Battle — Online Sync Mixin
   Extracted from GameScene. Handles all online mode
   state capture, sync, and remote action replay.
   ═══════════════════════════════════════════════════════ */

Object.assign(GameScene.prototype, {

    setupOnlineCallbacks() {
        networkManager.onGameAction = (action) => {
            console.log('收到对方操作:', action);
            this.handleRemoteAction(action);
        };

        networkManager.onTurnChanged = (data) => {
            console.log('回合切换:', data);
            this.currentTurn = data.currentTurn;
            this.addLog(`--- ${data.currentTurn === 'player' ? '玩家1' : '玩家2'} 回合 ---`);
            this.updateOnlineTurnDisplay();
            this.updateTrapVisibility();

            if (this.isMyTurn()) {
                this.startPlayerTurn();
            } else {
                this.clearSelectionState();
                this.actionText.setText('等待对手行动...');
            }
        };

        networkManager.onPlayerDisconnected = () => {
            this.actionText.setText('对手已断开连接!');
            this.addLog('对手已断开连接!');
            this.gameOver = true;
        };
    },

    handleRemoteAction(action) {
        switch (action.type) {
            case 'stateSync':
                this.applyRemoteState(action.state);
                break;
            case 'move':
                this.handleRemoteMove(action);
                break;
            case 'attack':
                this.handleRemoteAttack(action);
                break;
            case 'skill':
                this.handleRemoteSkill(action);
                break;
            case 'noble':
                this.handleRemoteNoble(action);
                break;
            case 'dice':
                this.handleRemoteDice(action);
                break;
            case 'endTurn':
                break;
        }
    },

    handleRemoteMove(action) {
        const unit = this.units.find(u => u.data && u.data.team === action.team);
        if (unit && typeof action.toX === 'number' && typeof action.toY === 'number') {
            this.moveUnit(unit, action.toX, action.toY);
            this.addLog(`${unit.data.name} 移动到 (${action.toX}, ${action.toY})`);
        }
    },

    handleRemoteAttack(action) {
        const attacker = this.units.find(u => u.data && u.data.team === action.team);
        const target = this.units.find(u => u.data && u.data.team !== action.team);
        if (attacker && target) {
            if (typeof action.damage === 'number') {
                this.playCharAttackEffect(attacker, target);
                this.dealDamage(target, action.damage, 'attack');
                this.addLog(`${attacker.data.name} 攻击造成 ${action.damage} 伤害`);
            }
        }
    },

    handleRemoteSkill(action) {
        const unit = this.units.find(u => u.data && u.data.team === action.team);
        if (unit) {
            const skillName = action.skillName || '技能';
            this.addLog(`${unit.data.name} 使用了 ${skillName}`);
            audioManager.playSkill();
        }
    },

    handleRemoteNoble(action) {
        const unit = this.units.find(u => u.data && u.data.team === action.team);
        if (unit) {
            const nobleName = action.nobleName || '宝具';
            this.addLog(`${unit.data.name} 发动宝具: ${nobleName}`);
            this.playNobleScreenFx();
            audioManager.playNoble();
        }
    },

    handleRemoteDice(action) {
        const result = action.result;
        const effect = RANDOM_EFFECTS[result];
        if (effect) {
            this.addLog(`对方随机决定: ${result} (${effect.name})`);
        } else {
            this.addLog(`对方随机决定: ${result}`);
        }
    },

    updateOnlineTurnDisplay() {
        const isMyTurn = this.currentTurn === this.myTeam;
        const turnName = this.currentTurn === 'player' ? '玩家1' : '玩家2';

        if (isMyTurn) {
            this.turnText.setText(`当前回合: ${turnName} (你的回合)`);
            this.turnText.setStyle({ fill: '#2ecc71' });
            this.turnIndicator.setText(`⚡ ${turnName} 回合 · 你的回合`);
            this.turnIndicator.setStyle({ fill: '#2ecc71' });
        } else {
            this.turnText.setText(`当前回合: ${turnName} (等待对方)`);
            this.turnText.setStyle({ fill: '#e74c3c' });
            this.turnIndicator.setText(`⏳ ${turnName} 回合 · 等待对手`);
            this.turnIndicator.setStyle({ fill: '#e74c3c' });
        }
    },

    isMyTurn() {
        if (!this.onlineMode) return true;
        return this.currentTurn === this.myTeam;
    },

    initOnlineBattleState() {
        const turnName = this.currentTurn === 'player' ? '玩家1' : '玩家2';
        this.turnText.setText(`当前回合: ${turnName}`);
        this.turnIndicator.setText(`⚡ ${turnName} 回合`);
        this.addLog(`--- ${turnName} 回合 ---`);
        this.showTurnBanner(`${turnName} 回合`);

        const activeUnits = this.units.filter(u => u.data.team === this.currentTurn);
        const waitingUnits = this.units.filter(u => u.data.team !== this.currentTurn);

        activeUnits.forEach(u => { u.data.acted = false; u.setAlpha(1); });
        waitingUnits.forEach(u => { u.data.acted = true; u.setAlpha(0.5); });

        this.turnIndex = 0;
        this.updateOnlineTurnDisplay();
        this.updateTrapVisibility();

        if (this.isMyTurn()) {
            const scene = this;
            setTimeout(() => scene.selectNextUnit(), 1200);
        } else {
            this.clearSelectionState();
            this.actionText.setText('等待对手行动...');
        }
    },

    clearSelectionState() {
        this.clearHighlights();
        this.clearSkillButtons();

        if (this.selectedUnit && this.selectedUnit.data) {
            if (this.selectedUnit.data.selectTween) {
                this.selectedUnit.data.selectTween.stop();
                this.selectedUnit.data.selectTween = null;
            }
            const borderColor = this.selectedUnit.data.team === 'player' ? 0x3498db : 0xe74c3c;
            this.selectedUnit.data.border.setScale(1);
            this.selectedUnit.data.border.setStrokeStyle(3, borderColor);
        }

        this.selectedUnit = null;
        this.currentUnit = null;
        this.waitingForAction = false;
        this.diceResult = null;

        if (this.diceDisplay) this.diceDisplay.setVisible(false);
        if (this.diceResultText) this.diceResultText.setText('');
    },

    cloneState(value) {
        if (value == null) return value;
        return JSON.parse(JSON.stringify(value));
    },

    getUnitByTeam(team) {
        return this.units.find(u => u.data && u.data.team === team) || null;
    },

    captureMapState() {
        if (!this.map) return [];
        return this.map.map(row => row.map(cell => ({
            baseColor: cell.baseColor,
            walkable: cell.walkable
        })));
    },

    captureUnitState(unit) {
        if (!unit || !unit.data) return null;

        const data = unit.data;
        const snapshot = {};
        const skipKeys = new Set(['hpBar', 'hpBarBg', 'npBar', 'npBarBg', 'shieldBar', 'border', 'selectTween']);

        Object.keys(data).forEach(key => {
            if (skipKeys.has(key)) return;
            if (key === 'porcelainEntity') {
                snapshot.porcelainEntity = data.porcelainEntity ? {
                    x: data.porcelainEntity.x,
                    y: data.porcelainEntity.y,
                    damage: data.porcelainEntity.damage,
                    maxDamage: data.porcelainEntity.maxDamage
                } : null;
                return;
            }
            snapshot[key] = this.cloneState(data[key]);
        });

        return snapshot;
    },

    captureGameState() {
        return {
            currentTurn: this.currentTurn,
            gameOver: this.gameOver,
            mapTiles: this.captureMapState(),
            units: this.units
                .filter(unit => unit && unit.data)
                .map(unit => this.captureUnitState(unit)),
            fieldEffects: (this.fieldEffects || []).map(effect => ({
                x: effect.x, y: effect.y, team: effect.team,
                effect: effect.effect, value: effect.value
            })),
            ambushTraps: (this.ambushTraps || []).map(trap => ({
                x: trap.x, y: trap.y, ownerTeam: trap.ownerTeam,
                rootDuration: trap.rootDuration
            })),
            ubw: {
                active: this.ubwActive,
                duration: this.ubwDuration,
                ownerTeam: this.ubwOwner && this.ubwOwner.data ? this.ubwOwner.data.team : null,
                backgroundIndex: this.ubwBackgroundIndex,
                swords: (this.ubwSwords || []).map(sword => ({
                    x: sword.x, y: sword.y, damage: sword.damage,
                    ownerTeam: sword.ownerTeam || (this.ubwOwner && this.ubwOwner.data ? this.ubwOwner.data.team : null),
                    weaponIndex: sword.weaponIndex ?? 0
                }))
            }
        };
    },

    broadcastStateSync(reason = 'action') {
        if (!this.onlineMode) return;
        networkManager.sendAction({
            type: 'stateSync',
            reason,
            state: this.captureGameState()
        });
    },

    applyMapState(mapTiles) {
        if (!mapTiles || !this.map) return;
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const snapshotCell = mapTiles[y] && mapTiles[y][x];
                if (!snapshotCell) continue;
                this.map[y][x].baseColor = snapshotCell.baseColor;
                this.map[y][x].walkable = snapshotCell.walkable !== false;
                if (!this.ubwActive) {
                    this.map[y][x].tile.setFillStyle(this.map[y][x].baseColor);
                    this.map[y][x].tile.setStrokeStyle(1, 0x2a2a2a);
                }
            }
        }
    },

    setUnitPositionInstant(unit, x, y) {
        const targetX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const targetY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        unit.x = targetX;
        unit.y = targetY;
        unit.data.border.x = targetX;
        unit.data.border.y = targetY;
        unit.data.hpBar.x = targetX;
        unit.data.hpBar.y = targetY - 35;
        unit.data.hpBarBg.x = targetX;
        unit.data.hpBarBg.y = targetY - 35;
        unit.data.npBar.x = targetX - 25;
        unit.data.npBar.y = targetY - 26;
        unit.data.npBarBg.x = targetX;
        unit.data.npBarBg.y = targetY - 26;
        unit.data.shieldBar.x = targetX - 25;
        unit.data.shieldBar.y = targetY - 42;
    },

    syncPorcelainEntity(unit, porcelainState, previousPorcelain = null) {
        const porcelainToDestroy = previousPorcelain || unit.data.porcelainEntity;
        if (porcelainToDestroy) {
            if (porcelainToDestroy.sprite) porcelainToDestroy.sprite.destroy();
            if (porcelainToDestroy.hpBar) porcelainToDestroy.hpBar.destroy();
            if (porcelainToDestroy.hpBarBg) porcelainToDestroy.hpBarBg.destroy();
            if (porcelainToDestroy.dmgText) porcelainToDestroy.dmgText.destroy();
            if (unit.data) unit.data.porcelainEntity = null;
        }
        if (!porcelainState) return;

        const posX = porcelainState.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = porcelainState.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const tileSize = GAME_CONFIG.tileSize;
        let porcelain;

        if (this.textures.exists('ciqi')) {
            porcelain = this.add.image(posX, posY, 'ciqi');
            const targetSize = tileSize - 10;
            porcelain.setScale(Math.min(targetSize / porcelain.width, targetSize / porcelain.height));
        } else {
            porcelain = this.add.circle(posX, posY, tileSize / 3, 0xffffff);
            porcelain.setStrokeStyle(3, 0x9b59b6);
        }

        const hpBarBg = this.add.rectangle(posX, posY - 30, 52, 8, 0x333333);
        const hpBar = this.add.rectangle(posX - 25, posY - 30, 0, 6, 0x9b59b6);
        hpBar.setOrigin(0, 0.5);
        const dmgText = this.add.text(posX, posY + 25, porcelainState.damage.toString(), {
            fontSize: '12px', fill: '#9b59b6', fontStyle: 'bold'
        }).setOrigin(0.5);

        unit.data.porcelainEntity = {
            sprite: porcelain, x: porcelainState.x, y: porcelainState.y,
            damage: porcelainState.damage || 0, maxDamage: porcelainState.maxDamage || 100,
            hpBar, hpBarBg, dmgText
        };
        unit.data.porcelainEntity.hpBar.width = 50 * (unit.data.porcelainEntity.damage / unit.data.porcelainEntity.maxDamage);
    },

    syncFieldEffects(fieldEffects) {
        (this.fieldEffects || []).forEach(effect => { if (effect.tile) effect.tile.destroy(); });
        this.fieldEffects = [];

        (fieldEffects || []).forEach(effect => {
            let color = 0x7f8c8d;
            switch (effect.effect) {
                case 'damage': color = 0xe74c3c; break;
                case 'heal': color = 0x2ecc71; break;
                case 'charge': color = 0xf1c40f; break;
                case 'block': color = 0x7f8c8d; break;
            }

            const effectTile = this.add.rectangle(
                effect.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                effect.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10,
                color, 0.4
            );
            effectTile.setStrokeStyle(2, color);
            this.fieldEffects.push({ ...effect, tile: effectTile });
        });
    },

    syncAmbushTraps(traps) {
        (this.ambushTraps || []).forEach(trap => { if (trap.sprite) trap.sprite.destroy(); });
        this.ambushTraps = [];

        (traps || []).forEach(trap => {
            this.ambushTraps.push({
                ...trap,
                sprite: this.createAmbushTrapSprite(trap.x, trap.y, trap.ownerTeam)
            });
        });
        this.updateTrapVisibility();
    },

    ensureUBWBackground(bgIndex) {
        const mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const mapH = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;

        if (this.ubwBackground && this.ubwBackgroundIndex === bgIndex) {
            this.ubwBackground.setDisplaySize(mapW, mapH);
            this.ubwBackground.setAlpha(0.9);
            return;
        }
        if (this.ubwBackground) this.ubwBackground.destroy();

        this.ubwBackgroundIndex = bgIndex ?? 0;
        this.ubwBackground = this.add.image(mapW / 2, mapH / 2, `ubw_bg_${this.ubwBackgroundIndex}`);
        this.ubwBackground.setDisplaySize(mapW, mapH);
        this.ubwBackground.setDepth(-1);
        this.ubwBackground.setAlpha(0.9);
    },

    syncUBWSwords(swords) {
        (this.ubwSwords || []).forEach(sword => { if (sword.sprite) sword.sprite.destroy(); });
        this.ubwSwords = [];

        (swords || []).forEach(sword => {
            const posX = sword.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
            const posY = sword.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
            const weaponIndex = sword.weaponIndex ?? 0;
            const sprite = this.add.image(posX, posY, `weapon_${weaponIndex}`);
            sprite.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
            sprite.setOrigin(0.5);
            this.ubwSwords.push({ x: sword.x, y: sword.y, damage: sword.damage, ownerTeam: sword.ownerTeam, weaponIndex, sprite });
        });
    },

    clearUBWVisualState() {
        if (this.ubwBackground) { this.ubwBackground.destroy(); this.ubwBackground = null; }
        (this.ubwSwords || []).forEach(sword => { if (sword.sprite) sword.sprite.destroy(); });
        this.ubwSwords = [];
        this.ubwActive = false;
        this.ubwOwner = null;
        this.ubwDuration = 0;
        this.ubwBackgroundIndex = null;

        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                if (!this.map || !this.map[y] || !this.map[y][x]) continue;
                this.map[y][x].tile.setFillStyle(this.map[y][x].baseColor);
                this.map[y][x].tile.setStrokeStyle(1, 0x2a2a2a);
            }
        }
    },

    syncUBWState(ubwState) {
        if (!ubwState || !ubwState.active) { this.clearUBWVisualState(); return; }

        this.ubwActive = true;
        this.ubwDuration = ubwState.duration || 0;
        this.ubwOwner = this.getUnitByTeam(ubwState.ownerTeam);
        this.ensureUBWBackground(ubwState.backgroundIndex ?? 0);

        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.map[y][x].tile.setFillStyle(0x000000, 0.2);
                this.map[y][x].tile.setStrokeStyle(1, 0xcd853f, 0.5);
            }
        }
        this.syncUBWSwords(ubwState.swords || []);
    },

    applyUnitState(unitState) {
        if (!unitState) return;

        let unit = this.getUnitByTeam(unitState.team);
        if (!unit) {
            unit = this.createUnit(unitState.x, unitState.y, unitState.team, unitState.charId);
        }

        const preservedRefs = {
            hpBar: unit.data.hpBar, hpBarBg: unit.data.hpBarBg,
            npBar: unit.data.npBar, npBarBg: unit.data.npBarBg,
            shieldBar: unit.data.shieldBar, border: unit.data.border,
            selectTween: unit.data.selectTween || null
        };

        const previousPorcelain = unit.data.porcelainEntity || null;
        const porcelainState = unitState.porcelainEntity || null;
        const sanitizedState = this.cloneState(unitState);
        delete sanitizedState.porcelainEntity;

        unit.data = { ...sanitizedState, ...preservedRefs };

        this.setUnitPositionInstant(unit, unit.data.x, unit.data.y);
        this.updateUnitBars(unit);
        this.syncPorcelainEntity(unit, porcelainState, previousPorcelain);

        if (unit.data.acted) {
            unit.setAlpha(0.5);
            unit.data.border.setStrokeStyle(3, unit.data.team === 'player' ? 0x3498db : 0xe74c3c);
        } else {
            unit.setAlpha(1);
        }
    },

    applyRemoteState(state) {
        if (!state) return;

        this.currentTurn = state.currentTurn || this.currentTurn;
        this.gameOver = !!state.gameOver;

        this.applyMapState(state.mapTiles);

        const incomingTeams = new Set((state.units || []).map(unit => unit.team));
        this.units
            .filter(unit => unit.data && !incomingTeams.has(unit.data.team))
            .forEach(unit => this.destroyUnit(unit));

        (state.units || []).forEach(unitState => this.applyUnitState(unitState));

        this.syncFieldEffects(state.fieldEffects || []);
        this.syncAmbushTraps(state.ambushTraps || []);
        this.syncUBWState(state.ubw);
        this.updateTrapVisibility();
        this.updateOnlineTurnDisplay();

        if (!this.isMyTurn()) {
            this.clearSelectionState();
            this.actionText.setText('等待对手行动...');
        }

        if (this.currentUnit && this.currentUnit.data) {
            this.updateNobleButton();
            this.updateBerserkButton();
        }

        if (!this.gameOver) {
            this.checkGameOver();
        }
    }

});
