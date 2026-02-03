class TestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TestScene' });
        this.highlightTiles = [];
        this.isMoving = false;
        this.ubwActive = false;
        this.ubwSwords = [];
        this.ubwDuration = 0;
    }

    init(data) {
        this.selectedChar = data.character || 'saber_artoria';
        this.highlightTiles = [];
        this.isMoving = false;
        this.ubwActive = false;
        this.ubwSwords = [];
        this.ubwDuration = 0;
    }

    preload() {
        for (const charId in CHARACTERS) {
            const char = CHARACTERS[charId];
            if (char.avatar) {
                this.load.image(charId, char.avatar);
            }
        }
        // 加载武器贴图
        this.load.image('ubw_sword', 'assets/characters/wuqi.png');
    }

    create() {
        audioManager.init();
        
        this.createMap();
        this.createTestUnit();
        this.createTestUI();
        this.createDummyTarget();
        
        this.input.on('pointerdown', (pointer) => {
            audioManager.resume();
            this.handleMapClick(pointer);
        });
    }

    createMap() {
        this.map = [];
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const color = 0x4a7c59;
                const tile = this.add.rectangle(
                    x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    GAME_CONFIG.tileSize - 2, GAME_CONFIG.tileSize - 2, color
                );
                tile.setStrokeStyle(1, 0x2a2a2a);
                this.map[y][x] = { tile, x, y, walkable: true };
            }
        }
    }

    createTestUnit() {
        const charData = CHARACTERS[this.selectedChar];
        const classData = CLASS_CONFIG[charData.class];
        const x = 3, y = 3;
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        let unit;
        if (charData.avatar && this.textures.exists(this.selectedChar)) {
            unit = this.add.image(posX, posY, this.selectedChar);
            unit.setDisplaySize(GAME_CONFIG.tileSize - 8, GAME_CONFIG.tileSize - 8);
        } else {
            unit = this.add.circle(posX, posY, GAME_CONFIG.tileSize / 3, classData.color);
        }
        
        const border = this.add.rectangle(posX, posY, GAME_CONFIG.tileSize - 6, GAME_CONFIG.tileSize - 6);
        border.setStrokeStyle(3, 0x3498db);
        border.setFillStyle();
        
        const hpBarBg = this.add.rectangle(posX, posY - 35, 52, 8, 0x333333);
        const hpBar = this.add.rectangle(posX, posY - 35, 50, 6, 0x2ecc71);
        const npBarBg = this.add.rectangle(posX, posY - 26, 52, 6, 0x333333);
        const npBar = this.add.rectangle(posX - 25, posY - 26, 0, 4, 0xf1c40f);
        npBar.setOrigin(0, 0.5);
        const shieldBar = this.add.rectangle(posX - 25, posY - 42, 0, 4, 0x3498db);
        shieldBar.setOrigin(0, 0.5);
        
        unit.data = {
            x, y, team: 'player', charId: this.selectedChar,
            name: charData.name, className: classData.name, class: charData.class,
            hp: 100, maxHp: 100, np: 100, maxNp: 100, shield: 0,
            diceCount: classData.diceCount, moveRange: classData.moveRange,
            attackRange: classData.attackRange, skills: charData.skills,
            noble: charData.noble, buffs: [], atkBuff: 0, extraDice: 0,
            burstMode: 0, burstAtkBonus: 0, burstRangeBonus: 0,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border,
            // 卫宫专属
            roAiasCount: 0, roAiasLastValue: 0, projectedWeapon: false
        };
        
        this.testUnit = unit;
        this.units = [unit];
    }

    createDummyTarget() {
        const x = 8, y = 3;
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        const dummy = this.add.circle(posX, posY, GAME_CONFIG.tileSize / 3, 0xe74c3c);
        const border = this.add.rectangle(posX, posY, GAME_CONFIG.tileSize - 6, GAME_CONFIG.tileSize - 6);
        border.setStrokeStyle(3, 0xe74c3c);
        border.setFillStyle();
        
        const hpBarBg = this.add.rectangle(posX, posY - 35, 52, 8, 0x333333);
        const hpBar = this.add.rectangle(posX, posY - 35, 50, 6, 0x2ecc71);
        const npBarBg = this.add.rectangle(posX, posY - 26, 52, 6, 0x333333);
        const npBar = this.add.rectangle(posX - 25, posY - 26, 0, 4, 0xf1c40f);
        npBar.setOrigin(0, 0.5);
        const shieldBar = this.add.rectangle(posX - 25, posY - 42, 0, 4, 0x3498db);
        shieldBar.setOrigin(0, 0.5);
        
        dummy.data = {
            x, y, team: 'enemy', name: '测试假人',
            hp: 999, maxHp: 999, np: 0, maxNp: 100, shield: 0,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border
        };
        
        this.dummyTarget = dummy;
        this.units.push(dummy);
    }

    createTestUI() {
        const uiY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        const charData = CHARACTERS[this.selectedChar];
        
        // 背景
        this.add.rectangle(GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2, uiY + 75, 
            GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize, 150, 0x1a1a2e);
        
        // 角色信息
        this.add.text(10, uiY + 10, `测试模式: ${charData.name}`, { fontSize: '20px', fill: '#f1c40f', fontStyle: 'bold' });
        
        this.statusText = this.add.text(10, uiY + 40, '', { fontSize: '14px', fill: '#aaa' });
        this.updateStatus();
        
        // 技能按钮
        const btnY = uiY + 100;
        charData.skills.forEach((skill, i) => {
            this.add.text(10 + i * 180, btnY, `[${i+1}] ${skill.name}`, { fontSize: '14px', fill: '#3498db' })
                .setInteractive()
                .on('pointerdown', () => this.useSkill(i))
                .on('pointerover', function() { this.setStyle({ fill: '#5dade2' }); })
                .on('pointerout', function() { this.setStyle({ fill: '#3498db' }); });
        });
        
        // 宝具按钮
        this.add.text(550, btnY, `[宝具] ${charData.noble.name}`, { fontSize: '14px', fill: '#f1c40f' })
            .setInteractive()
            .on('pointerdown', () => this.useNoble())
            .on('pointerover', function() { this.setStyle({ fill: '#f4d03f' }); })
            .on('pointerout', function() { this.setStyle({ fill: '#f1c40f' }); });
        
        // 控制按钮
        this.add.text(10, uiY + 130, '[移动]', { fontSize: '12px', fill: '#2ecc71' })
            .setInteractive()
            .on('pointerdown', () => this.startMove())
            .on('pointerover', function() { this.setStyle({ fill: '#58d68d' }); })
            .on('pointerout', function() { this.setStyle({ fill: '#2ecc71' }); });
        
        this.add.text(80, uiY + 130, '[重置HP/NP]', { fontSize: '12px', fill: '#2ecc71' })
            .setInteractive().on('pointerdown', () => this.resetStats());
        
        this.add.text(190, uiY + 130, '[重置假人]', { fontSize: '12px', fill: '#2ecc71' })
            .setInteractive().on('pointerdown', () => this.resetDummy());
        
        this.add.text(290, uiY + 130, '[返回]', { fontSize: '12px', fill: '#e74c3c' })
            .setInteractive().on('pointerdown', () => this.scene.start('LobbyScene'));
        
        // 日志
        this.logText = this.add.text(GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + 10, 10, '测试日志:', 
            { fontSize: '12px', fill: '#fff', wordWrap: { width: 220 } });
        this.logs = [];
    }

    updateStatus() {
        const d = this.testUnit.data;
        let status = `HP: ${d.hp}/${d.maxHp}  NP: ${d.np}/${d.maxNp}  护盾: ${d.shield}`;
        if (d.roAiasCount > 0) status += `  七重圆环: ${d.roAiasCount}层`;
        if (d.projectedWeapon) status += `  [投影武器]`;
        this.statusText.setText(status);
    }

    addLog(msg) {
        this.logs.unshift(msg);
        if (this.logs.length > 15) this.logs.pop();
        this.logText.setText('测试日志:\n' + this.logs.join('\n'));
    }

    useSkill(index) {
        const skill = this.testUnit.data.skills[index];
        this.addLog(`使用: ${skill.name}`);
        audioManager.playSkill();
        
        switch(skill.effect) {
            case 'roAias':
                this.useRoAias();
                break;
            case 'projection':
                this.useProjection();
                break;
            case 'tripleStrike':
                this.useTripleStrike();
                break;
            default:
                this.addLog('技能效果未实现');
        }
    }

    useRoAias() {
        const d = this.testUnit.data;
        if (d.roAiasCount >= 7) {
            this.addLog('七重圆环已达上限!');
            return;
        }
        
        const baseShield = Phaser.Math.Between(5, 10);
        const newShield = baseShield + d.roAiasLastValue;
        d.shield += newShield;
        d.roAiasLastValue = newShield;
        d.roAiasCount++;
        
        this.updateUnitBars(this.testUnit);
        this.addLog(`七重圆环第${d.roAiasCount}层: +${newShield}护盾 (累计${d.shield})`);
        this.updateStatus();
    }

    useProjection() {
        const d = this.testUnit.data;
        
        if (d.projectedWeapon) {
            // 已有武器，显示选项菜单
            this.showProjectionOptions();
        } else {
            // 投影新武器
            const diceResult = Phaser.Math.Between(1, 6);
            const bonus = diceResult * 2;
            d.projectedWeapon = true;
            d.projectionBonus = bonus;
            this.addLog(`投影武器完成! 骰子${diceResult}×2=+${bonus}伤害`);
        }
        this.updateStatus();
    }

    showProjectionOptions() {
        // 清除之前的选项按钮
        if (this.projectionBtns) {
            this.projectionBtns.forEach(btn => btn.destroy());
        }
        this.projectionBtns = [];
        
        const uiY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        
        // 投掷武器
        const btn1 = this.add.text(350, uiY + 70, '[投掷]', { fontSize: '12px', fill: '#e74c3c' })
            .setInteractive()
            .on('pointerdown', () => {
                this.clearProjectionBtns();
                this.projectThrow();
            });
        this.projectionBtns.push(btn1);
        
        // 投影新武器
        const btn2 = this.add.text(420, uiY + 70, '[投影]', { fontSize: '12px', fill: '#f1c40f' })
            .setInteractive()
            .on('pointerdown', () => {
                this.clearProjectionBtns();
                this.projectPlace();
            });
        this.projectionBtns.push(btn2);
        
        this.addLog('选择：投掷武器 / 投影新武器');
    }

    clearProjectionBtns() {
        if (this.projectionBtns) {
            this.projectionBtns.forEach(btn => btn.destroy());
            this.projectionBtns = [];
        }
    }

    projectThrow() {
        const d = this.testUnit.data;
        // 4d6伤害
        const dice = [
            Phaser.Math.Between(1, 6),
            Phaser.Math.Between(1, 6),
            Phaser.Math.Between(1, 6),
            Phaser.Math.Between(1, 6)
        ];
        const damage = dice.reduce((a, b) => a + b, 0);
        
        this.dealDamage(this.dummyTarget, damage);
        
        // 恢复等量NP
        this.testUnit.data.np = Math.min(100, this.testUnit.data.np + damage);
        this.updateUnitBars(this.testUnit);
        
        d.projectedWeapon = false;
        d.projectionBonus = 0;
        
        this.addLog(`投掷武器! [${dice.join('+')}]=${damage}伤害, NP+${damage}`);
        this.updateStatus();
    }

    projectPlace() {
        // 在随机位置放置武器
        let x, y;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(0, GAME_CONFIG.mapWidth - 1);
            y = Phaser.Math.Between(0, GAME_CONFIG.mapHeight - 1);
            attempts++;
        } while ((this.getUnitAt(x, y) || this.getSwordAt(x, y)) && attempts < 20);
        
        if (attempts < 20) {
            const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
            const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
            
            const sword = this.add.image(posX, posY, 'ubw_sword');
            sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
            sword.setOrigin(0.5);
            
            this.ubwSwords.push({ x, y, sprite: sword, damage: Phaser.Math.Between(8, 15) });
            this.addLog(`投影武器于 (${x},${y})`);
        } else {
            this.addLog('没有空位投影武器');
        }
        this.updateStatus();
    }

    useTripleStrike() {
        let totalDamage = 0;
        let totalNp = 0;
        
        for (let i = 0; i < 3; i++) {
            const damage = Phaser.Math.Between(1, 6);
            totalDamage += damage;
            totalNp += damage;
            this.addLog(`第${i+1}击: ${damage}伤害, +${damage}NP`);
        }
        
        this.dealDamage(this.dummyTarget, totalDamage);
        this.testUnit.data.np = Math.min(100, this.testUnit.data.np + totalNp);
        this.updateUnitBars(this.testUnit);
        this.addLog(`鹤翼三连完成! 总伤害${totalDamage}, 总NP+${totalNp}`);
        this.updateStatus();
    }

    useNoble() {
        if (this.testUnit.data.np < 100) {
            this.addLog('NP不足!');
            return;
        }
        
        const noble = this.testUnit.data.noble;
        
        // 根据宝具类型执行不同效果
        if (noble.effect === 'unlimitedBladeWorks') {
            this.useUnlimitedBladeWorks();
        } else {
            // 其他宝具的简化实现
            this.testUnit.data.np = 0;
            this.updateUnitBars(this.testUnit);
            audioManager.playNoble();
            
            const damage = Phaser.Math.Between(30, 50);
            this.dealDamage(this.dummyTarget, damage);
            this.addLog(`${noble.name}造成${damage}伤害`);
            this.updateStatus();
        }
    }

    // 无限剑制完整实现
    useUnlimitedBladeWorks() {
        this.testUnit.data.np = 0;
        this.updateUnitBars(this.testUnit);
        audioManager.playNoble();
        
        // 设置固有结界状态
        this.ubwActive = true;
        this.ubwDuration = 5;
        
        // 记录已有武器的位置
        const existingPositions = [];
        if (this.ubwSwords && this.ubwSwords.length > 0) {
            this.ubwSwords.forEach(sword => {
                existingPositions.push({ x: sword.x, y: sword.y, damage: sword.damage });
                if (sword.sprite) {
                    sword.sprite.destroy();
                }
            });
        }
        
        // 清空数组
        this.ubwSwords = [];
        
        // 改变地图外观
        this.changeMapToUBW();
        
        // 在原位置重新生成武器
        existingPositions.forEach(pos => {
            this.spawnUBWSwordAt(pos.x, pos.y, pos.damage);
        });
        
        // 生成2把新剑
        this.spawnUBWSword();
        this.spawnUBWSword();
        
        this.addLog(`无限剑制展开! 持续${this.ubwDuration}回合`);
        if (existingPositions.length > 0) {
            this.addLog(`投影武器融入结界，共${this.ubwSwords.length}把剑`);
        }
        this.addLog(`剑会自动追踪敌人攻击`);
        
        // 对敌人造成初始伤害
        const diceRolls = [];
        let total = 0;
        for (let i = 0; i < 4; i++) {
            const roll = Phaser.Math.Between(1, 6);
            diceRolls.push(roll);
            total += roll;
        }
        const damage = total * 4;
        
        this.dealDamage(this.dummyTarget, damage);
        this.addLog(`剑雨攻击! [${diceRolls.join('+')}]×4=${damage}伤害`);
        this.updateStatus();
        
        // 立即让武器开始移动
        this.time.delayedCall(500, () => {
            this.processUBWSwords();
        });
        
        // 添加模拟回合按钮
        this.createUBWControls();
    }

    createUBWControls() {
        const uiY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        
        // 模拟回合按钮
        this.ubwNextTurnBtn = this.add.text(400, uiY + 130, '[模拟下一回合]', { fontSize: '12px', fill: '#f1c40f' })
            .setInteractive()
            .on('pointerdown', () => this.simulateUBWTurn())
            .on('pointerover', function() { this.setStyle({ fill: '#f4d03f' }); })
            .on('pointerout', function() { this.setStyle({ fill: '#f1c40f' }); });
        
        // 结束结界按钮
        this.ubwEndBtn = this.add.text(530, uiY + 130, '[结束结界]', { fontSize: '12px', fill: '#e74c3c' })
            .setInteractive()
            .on('pointerdown', () => this.endUBW())
            .on('pointerover', function() { this.setStyle({ fill: '#ec7063' }); })
            .on('pointerout', function() { this.setStyle({ fill: '#e74c3c' }); });
    }

    simulateUBWTurn() {
        if (!this.ubwActive) return;
        
        this.ubwDuration--;
        this.addLog(`--- 无限剑制剩余 ${this.ubwDuration} 回合 ---`);
        
        // 60%概率生成新剑
        if (Phaser.Math.Between(1, 100) <= 60) {
            this.spawnUBWSword();
        }
        
        // 所有剑自动追踪攻击
        this.processUBWSwords();
        
        // 检查结界是否结束
        if (this.ubwDuration <= 0) {
            this.endUBW();
        }
    }

    changeMapToUBW() {
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.map[y][x].tile.setFillStyle(0x8b4513, 0.8);
                this.map[y][x].tile.setStrokeStyle(1, 0xcd853f);
            }
        }
    }

    restoreMapFromUBW() {
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.map[y][x].tile.setFillStyle(0x4a7c59);
                this.map[y][x].tile.setStrokeStyle(1, 0x2a2a2a);
            }
        }
    }

    spawnUBWSword() {
        let attempts = 0;
        while (attempts < 20) {
            const x = Phaser.Math.Between(0, GAME_CONFIG.mapWidth - 1);
            const y = Phaser.Math.Between(0, GAME_CONFIG.mapHeight - 1);
            
            if (!this.getUnitAt(x, y) && !this.getSwordAt(x, y)) {
                const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                
                // 使用武器贴图
                const sword = this.add.image(posX, posY, 'ubw_sword');
                sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
                sword.setOrigin(0.5);
                
                this.ubwSwords.push({ x, y, sprite: sword, damage: Phaser.Math.Between(8, 15) });
                this.addLog(`剑生成于 (${x},${y})`);
                return;
            }
            attempts++;
        }
    }

    // 在指定位置生成武器
    spawnUBWSwordAt(x, y, damage) {
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        const sword = this.add.image(posX, posY, 'ubw_sword');
        sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
        sword.setOrigin(0.5);
        
        this.ubwSwords.push({ x, y, sprite: sword, damage: damage || Phaser.Math.Between(8, 15) });
    }

    getSwordAt(x, y) {
        return this.ubwSwords.find(s => s.x === x && s.y === y);
    }

    processUBWSwords() {
        if (this.ubwSwords.length === 0) return;
        
        const target = this.dummyTarget;
        if (target.data.hp <= 0) return;
        
        this.ubwSwords.forEach(sword => {
            const dist = Math.abs(target.data.x - sword.x) + Math.abs(target.data.y - sword.y);
            
            if (dist <= 1) {
                // 攻击
                this.swordAttack(sword, target);
            } else {
                // 移动靠近
                this.moveSwordToward(sword, target);
            }
        });
    }

    moveSwordToward(sword, target) {
        const dx = Math.sign(target.data.x - sword.x);
        const dy = Math.sign(target.data.y - sword.y);
        
        let moved = 0;
        for (let i = 0; i < 2 && moved < 2; i++) {
            let newX = sword.x;
            let newY = sword.y;
            let tryHorizontalFirst = Math.abs(target.data.x - sword.x) >= Math.abs(target.data.y - sword.y);
            let canMove = false;
            
            // 尝试第一个方向
            if (tryHorizontalFirst && dx !== 0) {
                newX = sword.x + dx;
                newY = sword.y;
            } else if (dy !== 0) {
                newX = sword.x;
                newY = sword.y + dy;
            } else if (dx !== 0) {
                newX = sword.x + dx;
                newY = sword.y;
            }
            
            // 边界检查
            newX = Math.max(0, Math.min(GAME_CONFIG.mapWidth - 1, newX));
            newY = Math.max(0, Math.min(GAME_CONFIG.mapHeight - 1, newY));
            
            // 检查第一个方向是否可以移动
            if (!this.getUnitAt(newX, newY) && !this.getSwordAt(newX, newY) && (newX !== sword.x || newY !== sword.y)) {
                canMove = true;
            } else {
                // 第一个方向被阻挡，尝试另一个方向
                newX = sword.x;
                newY = sword.y;
                
                if (tryHorizontalFirst && dy !== 0) {
                    // 水平被阻挡，尝试垂直
                    newY = sword.y + dy;
                } else if (!tryHorizontalFirst && dx !== 0) {
                    // 垂直被阻挡，尝试水平
                    newX = sword.x + dx;
                }
                
                // 边界检查
                newX = Math.max(0, Math.min(GAME_CONFIG.mapWidth - 1, newX));
                newY = Math.max(0, Math.min(GAME_CONFIG.mapHeight - 1, newY));
                
                if (!this.getUnitAt(newX, newY) && !this.getSwordAt(newX, newY) && (newX !== sword.x || newY !== sword.y)) {
                    canMove = true;
                }
            }
            
            // 执行移动
            if (canMove) {
                sword.x = newX;
                sword.y = newY;
                moved++;
                
                const dist = Math.abs(target.data.x - sword.x) + Math.abs(target.data.y - sword.y);
                if (dist <= 1) break;
            } else {
                break;
            }
        }
        
        const posX = sword.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = sword.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        this.tweens.add({
            targets: sword.sprite,
            x: posX,
            y: posY,
            duration: 200,
            ease: 'Power2'
        });
        
        const dist = Math.abs(target.data.x - sword.x) + Math.abs(target.data.y - sword.y);
        if (dist <= 1) {
            this.time.delayedCall(250, () => this.swordAttack(sword, target));
        }
    }

    swordAttack(sword, target) {
        if (!target || target.data.hp <= 0) return;
        if (!sword || !sword.sprite) return;
        
        const damage = sword.damage;
        const targetPosX = target.data.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const targetPosY = target.data.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        this.tweens.add({
            targets: sword.sprite,
            x: targetPosX,
            y: targetPosY,
            duration: 100,
            onComplete: () => {
                this.dealDamage(target, damage);
                audioManager.playAttack();
                
                // 武器破碎消失
                sword.sprite.destroy();
                this.ubwSwords = this.ubwSwords.filter(s => s !== sword);
                this.addLog(`剑破碎!`);
            }
        });
        
        this.addLog(`剑攻击假人，造成${damage}伤害`);
    }

    endUBW() {
        if (!this.ubwActive) return;
        
        this.addLog(`无限剑制结束!`);
        
        // 剩余剑转换为NP
        if (this.ubwSwords.length > 0) {
            const npGain = this.ubwSwords.length * 10;
            this.testUnit.data.np = Math.min(100, this.testUnit.data.np + npGain);
            this.updateUnitBars(this.testUnit);
            this.addLog(`剩余${this.ubwSwords.length}把剑，恢复${npGain}NP`);
            
            // 销毁所有剑
            this.ubwSwords.forEach(s => s.sprite.destroy());
        }
        
        this.ubwSwords = [];
        this.ubwActive = false;
        this.ubwDuration = 0;
        
        // 恢复地图
        this.restoreMapFromUBW();
        
        // 移除控制按钮
        if (this.ubwNextTurnBtn) {
            this.ubwNextTurnBtn.destroy();
            this.ubwNextTurnBtn = null;
        }
        if (this.ubwEndBtn) {
            this.ubwEndBtn.destroy();
            this.ubwEndBtn = null;
        }
        
        this.updateStatus();
    }

    dealDamage(unit, damage) {
        if (unit.data.shield > 0) {
            if (unit.data.shield >= damage) {
                unit.data.shield -= damage;
                this.addLog(`护盾吸收${damage}伤害`);
                this.updateUnitBars(unit);
                return;
            } else {
                damage -= unit.data.shield;
                unit.data.shield = 0;
            }
        }
        unit.data.hp -= damage;
        this.updateUnitBars(unit);
    }

    updateUnitBars(unit) {
        const hpPercent = Math.max(0, unit.data.hp / unit.data.maxHp);
        unit.data.hpBar.width = 50 * hpPercent;
        unit.data.hpBar.fillColor = hpPercent > 0.5 ? 0x2ecc71 : (hpPercent > 0.25 ? 0xf39c12 : 0xe74c3c);
        
        const npPercent = unit.data.np / unit.data.maxNp;
        unit.data.npBar.width = 50 * npPercent;
        
        const shieldPercent = Math.min(1, unit.data.shield / 50);
        unit.data.shieldBar.width = 50 * shieldPercent;
    }

    resetStats() {
        this.testUnit.data.hp = 100;
        this.testUnit.data.np = 100;
        this.testUnit.data.shield = 0;
        this.testUnit.data.roAiasCount = 0;
        this.testUnit.data.roAiasLastValue = 0;
        this.testUnit.data.projectedWeapon = false;
        this.updateUnitBars(this.testUnit);
        this.updateStatus();
        this.addLog('状态已重置');
    }

    resetDummy() {
        this.dummyTarget.data.hp = 999;
        this.dummyTarget.data.shield = 0;
        this.updateUnitBars(this.dummyTarget);
        this.addLog('假人已重置');
    }

    // 移动相关方法
    handleMapClick(pointer) {
        if (!this.isMoving) return;
        
        const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
        const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
        
        const moveTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'move');
        if (moveTile) {
            this.addLog(`移动到 (${tileX},${tileY})`);
            this.moveUnit(this.testUnit, tileX, tileY);
            this.clearHighlights();
            this.isMoving = false;
        }
    }

    startMove() {
        if (this.isMoving) {
            this.clearHighlights();
            this.isMoving = false;
            this.addLog('取消移动');
            return;
        }
        
        this.isMoving = true;
        this.showMoveRange(this.testUnit, this.testUnit.data.moveRange);
        this.addLog('选择移动位置（再次点击移动按钮取消）');
    }

    showMoveRange(unit, range) {
        this.clearHighlights();
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - unit.data.x) + Math.abs(y - unit.data.y);
                if (dist <= range && dist > 0 && !this.getUnitAt(x, y)) {
                    const highlight = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0x3498db, 0.4
                    );
                    this.highlightTiles.push({ x, y, highlight, type: 'move' });
                }
            }
        }
    }

    clearHighlights() {
        this.highlightTiles.forEach(t => t.highlight.destroy());
        this.highlightTiles = [];
    }

    getUnitAt(x, y) {
        return this.units.find(u => u.data.x === x && u.data.y === y);
    }

    moveUnit(unit, x, y) {
        unit.data.x = x;
        unit.data.y = y;
        
        audioManager.playMove();
        
        const targetX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const targetY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        // 移动动画
        this.tweens.add({
            targets: [unit, unit.data.border],
            x: targetX,
            y: targetY,
            duration: 300,
            ease: 'Power2'
        });
        
        // UI跟随动画
        this.tweens.add({
            targets: unit.data.hpBar,
            x: targetX,
            y: targetY - 35,
            duration: 300,
            ease: 'Power2'
        });
        this.tweens.add({
            targets: unit.data.hpBarBg,
            x: targetX,
            y: targetY - 35,
            duration: 300,
            ease: 'Power2'
        });
        this.tweens.add({
            targets: unit.data.npBar,
            x: targetX - 25,
            y: targetY - 26,
            duration: 300,
            ease: 'Power2'
        });
        this.tweens.add({
            targets: unit.data.npBarBg,
            x: targetX,
            y: targetY - 26,
            duration: 300,
            ease: 'Power2'
        });
        this.tweens.add({
            targets: unit.data.shieldBar,
            x: targetX - 25,
            y: targetY - 42,
            duration: 300,
            ease: 'Power2'
        });
    }
}
