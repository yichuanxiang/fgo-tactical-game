class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.selectedUnit = null;
        this.units = [];
        this.currentTurn = 'player';
        this.highlightTiles = [];
        this.diceResult = null;
        this.waitingForAction = false;
        this.turnIndex = 0;
        this.currentUnit = null;
        this.gameOver = false;
        this.player1Char = 'saber_artoria';
        this.player2Char = 'archer_emiya';
        // UBW相关
        this.ubwActive = false;
        this.ubwOwner = null;
        this.ubwDuration = 0;
        this.ubwSwords = [];
        // 在线模式
        this.onlineMode = false;
        this.myTeam = null;
    }

    init(data) {
        if (data) {
            this.onlineMode = data.mode === 'online';
            
            if (this.onlineMode && data.players) {
                // 在线模式：从服务器数据获取角色
                const p1 = data.players.find(p => p.team === 'player');
                const p2 = data.players.find(p => p.team === 'enemy');
                this.player1Char = p1 ? p1.character : 'saber_artoria';
                this.player2Char = p2 ? p2.character : 'archer_emiya';
                this.myTeam = networkManager.myTeam;
                this.currentTurn = data.currentTurn || 'player';
            } else {
                // 本地模式
                this.player1Char = data.player1 || 'saber_artoria';
                this.player2Char = data.player2 || 'archer_emiya';
            }
        }
        // 重置UBW状态
        this.ubwActive = false;
        this.ubwOwner = null;
        this.ubwDuration = 0;
        this.ubwSwords = [];
    }

    preload() {
        // 加载所有角色头像
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
        // 初始化音效
        audioManager.init();
        
        this.createMap();
        this.createUnits();
        this.createUI();
        this.createDiceUI();
        this.createLogPanel();
        this.createTooltip();
        this.startPlayerTurn();
        
        // 点击时启用音效（浏览器要求用户交互后才能播放音频）
        this.input.on('pointerdown', () => {
            audioManager.resume();
        });
        
        // 在线模式设置
        if (this.onlineMode) {
            this.setupOnlineCallbacks();
            this.updateOnlineTurnDisplay();
        }
    }

    setupOnlineCallbacks() {
        // 收到对方操作
        networkManager.onGameAction = (action) => {
            this.handleRemoteAction(action);
        };
        
        // 回合切换
        networkManager.onTurnChanged = (data) => {
            this.currentTurn = data.currentTurn;
            this.startPlayerTurn();
            this.updateOnlineTurnDisplay();
        };
        
        // 对方断开
        networkManager.onPlayerDisconnected = () => {
            this.actionText.setText('对手已断开连接!');
            this.gameOver = true;
        };
    }

    handleRemoteAction(action) {
        // 处理对方的操作
        switch (action.type) {
            case 'move':
                const unit = this.units.find(u => u.data.team === action.team);
                if (unit) {
                    this.moveUnit(unit, action.x, action.y);
                }
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
                // 回合结束由服务器处理
                break;
        }
    }

    handleRemoteAttack(action) {
        const attacker = this.units.find(u => u.data.team === action.team);
        const target = this.units.find(u => u.data.team !== action.team);
        if (attacker && target) {
            this.dealDamage(target, action.damage, 'attack');
            this.addLog(`${attacker.data.name} 攻击造成 ${action.damage} 伤害`);
        }
    }

    handleRemoteSkill(action) {
        const unit = this.units.find(u => u.data.team === action.team);
        if (unit) {
            this.addLog(`${unit.data.name} 使用了 ${action.skillName}`);
            // 技能效果会通过后续的 damage/heal 等 action 同步
        }
    }

    handleRemoteNoble(action) {
        const unit = this.units.find(u => u.data.team === action.team);
        if (unit) {
            this.addLog(`${unit.data.name} 发动宝具: ${action.nobleName}`);
        }
    }

    handleRemoteDice(action) {
        this.addLog(`对方掷骰子: ${action.result}`);
    }

    updateOnlineTurnDisplay() {
        const isMyTurn = this.currentTurn === this.myTeam;
        const turnName = this.currentTurn === 'player' ? '玩家1' : '玩家2';
        
        if (isMyTurn) {
            this.turnText.setText(`当前回合: ${turnName} (你的回合)`);
            this.turnText.setStyle({ fill: '#2ecc71' });
        } else {
            this.turnText.setText(`当前回合: ${turnName} (等待对方)`);
            this.turnText.setStyle({ fill: '#e74c3c' });
        }
    }

    isMyTurn() {
        if (!this.onlineMode) return true;
        return this.currentTurn === this.myTeam;
    }

    createMap() {
        this.map = [];
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const isGrass = Math.random() > 0.15;
                const color = isGrass ? 0x4a7c59 : 0x8b7355;
                const tile = this.add.rectangle(
                    x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    GAME_CONFIG.tileSize - 2,
                    GAME_CONFIG.tileSize - 2,
                    color
                );
                tile.setStrokeStyle(1, 0x2a2a2a);
                this.map[y][x] = { tile, x, y, walkable: true };
            }
        }
    }

    createUnits() {
        // 玩家1（左边）
        this.createUnit(1, 3, 'player', this.player1Char);
        
        // 玩家2（右边）
        this.createUnit(10, 4, 'enemy', this.player2Char);
    }

    createUnit(x, y, team, charId) {
        const charData = CHARACTERS[charId];
        const classData = CLASS_CONFIG[charData.class];
        
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        let unit;
        // 如果有头像就用头像，否则用圆形
        if (charData.avatar && this.textures.exists(charId)) {
            unit = this.add.image(posX, posY, charId);
            unit.setDisplaySize(GAME_CONFIG.tileSize - 8, GAME_CONFIG.tileSize - 8);
        } else {
            unit = this.add.circle(posX, posY, GAME_CONFIG.tileSize / 3, classData.color);
        }
        
        // 边框
        const border = this.add.rectangle(posX, posY, GAME_CONFIG.tileSize - 6, GAME_CONFIG.tileSize - 6);
        border.setStrokeStyle(3, team === 'player' ? 0x3498db : 0xe74c3c);
        border.setFillStyle();
        
        // HP条
        const hpBarBg = this.add.rectangle(posX, posY - 35, 52, 8, 0x333333);
        const hpBar = this.add.rectangle(posX, posY - 35, 50, 6, 0x2ecc71);
        
        // 宝具条
        const npBarBg = this.add.rectangle(posX, posY - 26, 52, 6, 0x333333);
        const npBar = this.add.rectangle(posX - 25, posY - 26, 0, 4, 0xf1c40f);
        npBar.setOrigin(0, 0.5);
        
        // 护盾条
        const shieldBar = this.add.rectangle(posX - 25, posY - 42, 0, 4, 0x3498db);
        shieldBar.setOrigin(0, 0.5);
        
        unit.data = {
            x, y, team, charId,
            name: charData.name,
            className: classData.name,
            class: charData.class,
            hp: 100,
            maxHp: 100,
            np: 0,
            maxNp: 100,
            shield: 0,
            diceCount: classData.diceCount,
            moveRange: classData.moveRange,
            attackRange: classData.attackRange,
            skills: charData.skills,
            noble: charData.noble,
            buffs: [],
            atkBuff: 0,
            extraDice: 0,
            burstMode: 0,
            burstAtkBonus: 0,
            burstRangeBonus: 0,
            silenced: 0,
            doubleDamage: false,
            berserk: false,
            guts: false,
            extraAction: false,
            acted: false,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border
        };
        
        this.units.push(unit);
        return unit;
    }

    createUI() {
        const uiY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        
        // 底部UI背景
        this.add.rectangle(GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2, uiY + 75, 
            GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize, 150, 0x1a1a2e);
        
        this.turnText = this.add.text(10, uiY + 10, '当前回合: 玩家1', 
            { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });
        this.unitInfoText = this.add.text(10, uiY + 40, '选择角色', 
            { fontSize: '14px', fill: '#aaa' });
        this.actionText = this.add.text(10, uiY + 65, '', 
            { fontSize: '14px', fill: '#ffcc00' });
        
        // 在线模式显示房间号
        if (this.onlineMode && networkManager.roomCode) {
            this.roomCodeDisplay = this.add.text(
                GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize - 10, 
                uiY + 10, 
                `房间: ${networkManager.roomCode}`, 
                { fontSize: '14px', fill: '#2ecc71' }
            ).setOrigin(1, 0);
        }
    }

    createDiceUI() {
        const uiY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        
        // 骰子显示（左侧）
        this.diceDisplay = this.add.text(50, uiY + 115, '🎲', 
            { fontSize: '36px' }).setOrigin(0.5);
        this.diceDisplay.setVisible(false);
        
        this.diceResultText = this.add.text(100, uiY + 115, '', 
            { fontSize: '14px', fill: '#fff' }).setOrigin(0, 0.5);
        
        // 按钮区域（右侧，间距更大）
        const btnY = uiY + 115;
        const btnStartX = 350;
        const btnGap = 120;
        
        // 移动按钮
        this.moveBtn = this.add.text(btnStartX, btnY, '[ 移动 ]', 
            { fontSize: '18px', fill: '#2ecc71' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.startMoveAction())
            .on('pointerover', () => this.moveBtn.setStyle({ fill: '#58d68d' }))
            .on('pointerout', () => this.moveBtn.setStyle({ fill: '#2ecc71' }));
        
        // 掷骰子按钮
        this.rollBtn = this.add.text(btnStartX + btnGap, btnY, '[ 掷骰子 ]', 
            { fontSize: '18px', fill: '#3498db' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.rollDice())
            .on('pointerover', () => this.rollBtn.setStyle({ fill: '#5dade2' }))
            .on('pointerout', () => this.rollBtn.setStyle({ fill: '#3498db' }));
        
        // 宝具按钮
        this.nobleBtn = this.add.text(btnStartX + btnGap * 2, btnY, '[ 宝具 ]', 
            { fontSize: '18px', fill: '#555' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.useNoble());
        
        // 狂化普攻按钮（初始隐藏）
        this.berserkBtn = this.add.text(btnStartX + btnGap * 3, btnY, '[ 普攻 ]', 
            { fontSize: '18px', fill: '#e74c3c' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.useBerserkAttack())
            .on('pointerover', () => this.berserkBtn.setStyle({ fill: '#ec7063' }))
            .on('pointerout', () => this.berserkBtn.setStyle({ fill: '#e74c3c' }));
        this.berserkBtn.setVisible(false);
        
        // 结束回合按钮
        this.endTurnBtn = this.add.text(btnStartX + btnGap * 4, btnY, '[ 结束回合 ]', 
            { fontSize: '16px', fill: '#95a5a6' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.endTurn());
    }

    updateBerserkButton() {
        if (this.currentUnit && this.currentUnit.data.berserkAttack) {
            this.berserkBtn.setVisible(true);
            this.berserkBtn.setStyle({ fill: '#e74c3c' });
        } else {
            this.berserkBtn.setVisible(false);
        }
    }

    useBerserkAttack() {
        if (!this.currentUnit || this.currentUnit.data.acted) return;
        if (!this.currentUnit.data.berserkAttack) return;
        if (this.waitingForAction) return;
        
        this.currentUnit.data.berserkAttack = false;
        this.updateBerserkButton();
        
        this.actionText.setText('狂化发动！选择攻击目标');
        this.addLog(`${this.currentUnit.data.name} 狂化普攻!`);
        this.showAttackRange(this.currentUnit);
        this.setupAttackInput();
    }

    startMoveAction() {
        if (!this.currentUnit || this.currentUnit.data.acted) return;
        if (this.waitingForAction) return;
        if (this.onlineMode && !this.isMyTurn()) return;
        
        this.actionText.setText('选择移动位置');
        this.showMoveRange(this.currentUnit, this.currentUnit.data.moveRange);
        this.setupMoveInputAndFinish();
    }

    setupMoveInputAndFinish() {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const moveTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'move');
            if (moveTile) {
                this.addLog(`${this.currentUnit.data.name} 移动到 (${tileX},${tileY})`);
                this.moveUnit(this.currentUnit, tileX, tileY);
                
                // 在线模式同步
                if (this.onlineMode) {
                    networkManager.sendAction({
                        type: 'move',
                        team: this.currentUnit.data.team,
                        x: tileX,
                        y: tileY
                    });
                }
                
                this.finishAction();
            } else {
                this.setupMoveInputAndFinish();
            }
        });
    }

    createLogPanel() {
        const logX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + 10;
        const logY = 10;
        const logWidth = 230;
        const logHeight = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize - 20;
        
        // 日志背景
        this.logBg = this.add.rectangle(logX + logWidth/2, logY + logHeight/2, logWidth, logHeight, 0x2a2a3e)
            .setStrokeStyle(2, 0x4a4a6a);
        
        // 标题
        this.add.text(logX + 10, logY + 10, '战斗日志 (滚轮查看历史)', { fontSize: '14px', fill: '#fff', fontStyle: 'bold' });
        
        // 日志数据
        this.logMessages = [];
        this.logScrollOffset = 0;
        this.maxVisibleLogs = 9;
        this.logLineHeight = 48;
        
        // 创建遮罩区域
        const maskGraphics = this.make.graphics();
        maskGraphics.fillRect(logX, logY + 35, logWidth, logHeight - 45);
        const mask = maskGraphics.createGeometryMask();
        
        // 日志容器
        this.logContainer = this.add.container(logX + 10, logY + 40);
        this.logContainer.setMask(mask);
        
        // 预创建日志文本对象
        this.logTexts = [];
        for (let i = 0; i < 50; i++) {
            const text = this.add.text(0, i * this.logLineHeight, '', { 
                fontSize: '11px', 
                fill: '#ccc', 
                wordWrap: { width: 205 },
                lineSpacing: 2
            });
            this.logContainer.add(text);
            this.logTexts.push(text);
        }
        
        // 滚动条背景
        this.scrollBarBg = this.add.rectangle(logX + logWidth - 12, logY + logHeight/2 + 10, 8, logHeight - 50, 0x1a1a2e);
        
        // 滚动条
        this.scrollBar = this.add.rectangle(logX + logWidth - 12, logY + 45, 6, 50, 0x4a4a6a);
        
        // 监听滚轮事件
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            // 检查鼠标是否在日志区域
            if (pointer.x >= logX && pointer.x <= logX + logWidth && 
                pointer.y >= logY && pointer.y <= logY + logHeight) {
                this.scrollLog(deltaY > 0 ? 1 : -1);
            }
        });
    }

    scrollLog(direction) {
        const maxScroll = Math.max(0, this.logMessages.length - this.maxVisibleLogs);
        this.logScrollOffset = Math.max(0, Math.min(maxScroll, this.logScrollOffset + direction));
        this.updateLogDisplay();
        this.updateScrollBar();
    }

    updateScrollBar() {
        const logX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + 10;
        const logY = 10;
        const logHeight = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize - 20;
        
        const totalLogs = this.logMessages.length;
        const maxScroll = Math.max(1, totalLogs - this.maxVisibleLogs);
        const scrollPercent = this.logScrollOffset / maxScroll;
        
        const trackHeight = logHeight - 60;
        const barHeight = Math.max(30, trackHeight * (this.maxVisibleLogs / Math.max(totalLogs, this.maxVisibleLogs)));
        
        this.scrollBar.setSize(6, barHeight);
        this.scrollBar.y = logY + 50 + scrollPercent * (trackHeight - barHeight);
    }

    addLog(message) {
        this.logMessages.push(message);
        
        // 如果在底部，自动滚动到最新
        const maxScroll = Math.max(0, this.logMessages.length - this.maxVisibleLogs);
        if (this.logScrollOffset >= maxScroll - 1) {
            this.logScrollOffset = maxScroll;
        }
        
        this.updateLogDisplay();
        this.updateScrollBar();
    }

    updateLogDisplay() {
        // 清空所有文本
        this.logTexts.forEach(t => t.setText(''));
        
        // 从滚动位置开始显示
        for (let i = 0; i < this.logTexts.length && i + this.logScrollOffset < this.logMessages.length; i++) {
            const msgIndex = i + this.logScrollOffset;
            const msg = this.logMessages[msgIndex];
            
            if (msg) {
                this.logTexts[i].setText(msg);
                this.logTexts[i].y = i * this.logLineHeight;
                
                // 根据内容类型设置颜色
                if (msg.includes('回合')) {
                    this.logTexts[i].setStyle({ fill: '#f1c40f', fontSize: '11px', wordWrap: { width: 205 } });
                } else if (msg.includes('胜利')) {
                    this.logTexts[i].setStyle({ fill: '#2ecc71', fontSize: '11px', wordWrap: { width: 205 } });
                } else if (msg.includes('死亡') || msg.includes('击败')) {
                    this.logTexts[i].setStyle({ fill: '#e74c3c', fontSize: '11px', wordWrap: { width: 205 } });
                } else if (msg.includes('伤害')) {
                    this.logTexts[i].setStyle({ fill: '#e67e22', fontSize: '11px', wordWrap: { width: 205 } });
                } else if (msg.includes('恢复') || msg.includes('护盾')) {
                    this.logTexts[i].setStyle({ fill: '#3498db', fontSize: '11px', wordWrap: { width: 205 } });
                } else if (msg.includes('掷骰子')) {
                    this.logTexts[i].setStyle({ fill: '#9b59b6', fontSize: '11px', wordWrap: { width: 205 } });
                } else {
                    this.logTexts[i].setStyle({ fill: '#ccc', fontSize: '11px', wordWrap: { width: 205 } });
                }
            }
        }
    }

    createTooltip() {
        // 技能提示框（初始隐藏）
        this.tooltip = this.add.container(0, 0);
        this.tooltip.setVisible(false);
        this.tooltip.setDepth(1000);
        
        this.tooltipBg = this.add.rectangle(0, 0, 280, 200, 0x1a1a2e, 0.95)
            .setStrokeStyle(2, 0xf1c40f)
            .setOrigin(0, 0);
        this.tooltip.add(this.tooltipBg);
        
        this.tooltipText = this.add.text(10, 10, '', { 
            fontSize: '12px', 
            fill: '#fff',
            wordWrap: { width: 260 },
            lineSpacing: 4
        });
        this.tooltip.add(this.tooltipText);
        
        // 监听鼠标移动
        this.input.on('pointermove', (pointer) => {
            this.handleTooltip(pointer);
        });
    }

    handleTooltip(pointer) {
        const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
        const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
        
        // 检查是否在地图范围内
        if (tileX < 0 || tileX >= GAME_CONFIG.mapWidth || tileY < 0 || tileY >= GAME_CONFIG.mapHeight) {
            this.tooltip.setVisible(false);
            return;
        }
        
        const unit = this.getUnitAt(tileX, tileY);
        if (unit) {
            this.showTooltip(unit, pointer.x, pointer.y);
        } else {
            this.tooltip.setVisible(false);
        }
    }

    showTooltip(unit, x, y) {
        const d = unit.data;
        const classSkill = CLASS_SKILLS[d.class];
        
        let text = `【${d.name}】\n`;
        text += `职阶: ${d.className}\n`;
        text += `HP: ${d.hp}/${d.maxHp}  NP: ${d.np}/${d.maxNp}\n`;
        text += `攻击骰子: ${d.diceCount}d6  射程: ${d.attackRange}\n\n`;
        
        text += `═══ 技能 ═══\n`;
        d.skills.forEach((skill, i) => {
            text += `${i+1}. ${skill.name}: ${skill.desc}\n`;
        });
        
        text += `\n═══ 宝具 ═══\n`;
        text += `${d.noble.name}: ${d.noble.desc}\n`;
        
        text += `\n═══ 职阶技能 ═══\n`;
        text += `${classSkill.name}: ${classSkill.desc}`;
        
        this.tooltipText.setText(text);
        
        // 调整背景大小
        const bounds = this.tooltipText.getBounds();
        this.tooltipBg.setSize(bounds.width + 20, bounds.height + 20);
        
        // 调整位置，避免超出屏幕
        let tooltipX = x + 20;
        let tooltipY = y + 20;
        
        const gameWidth = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + 250;
        const gameHeight = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize + 150;
        
        if (tooltipX + bounds.width + 30 > gameWidth) {
            tooltipX = x - bounds.width - 30;
        }
        if (tooltipY + bounds.height + 30 > gameHeight) {
            tooltipY = y - bounds.height - 30;
        }
        
        this.tooltip.setPosition(tooltipX, tooltipY);
        this.tooltip.setVisible(true);
    }

    startPlayerTurn() {
        if (this.onlineMode) {
            // 在线模式：根据当前回合显示
            const turnName = this.currentTurn === 'player' ? '玩家1' : '玩家2';
            this.showTurnBanner(`${turnName} 回合`);
            this.updateOnlineTurnDisplay();
            
            // 处理无限剑制效果
            if (this.ubwActive && this.ubwOwner && this.ubwOwner.data.team === this.currentTurn) {
                this.processUBWTurn();
            }
            
            // 重置当前回合玩家的单位状态
            const currentUnits = this.units.filter(u => u.data.team === this.currentTurn);
            currentUnits.forEach(u => {
                u.data.acted = false;
                u.setAlpha(1);
                if (u.data.silenced > 0) u.data.silenced--;
            });
            
            // 设置对方单位为已行动状态
            const otherUnits = this.units.filter(u => u.data.team !== this.currentTurn);
            otherUnits.forEach(u => {
                u.data.acted = true;
                u.setAlpha(0.5);
            });
            
            this.turnIndex = 0;
            this.time.delayedCall(1000, () => this.selectNextUnit());
            return;
        }
        
        // 本地模式
        this.currentTurn = 'player';
        this.showTurnBanner('玩家1 回合');
        this.turnText.setText('当前回合: 玩家1');
        this.addLog('--- 玩家1 回合 ---');
        
        // 处理无限剑制效果
        if (this.ubwActive && this.ubwOwner && this.ubwOwner.data.team === 'player') {
            this.processUBWTurn();
        }
        
        const playerUnits = this.units.filter(u => u.data.team === 'player');
        playerUnits.forEach(u => {
            u.data.acted = false;
            u.setAlpha(1);
            // 沉默回合递减
            if (u.data.silenced > 0) u.data.silenced--;
        });
        
        this.turnIndex = 0;
        this.time.delayedCall(1000, () => this.selectNextUnit());
    }

    showTurnBanner(text) {
        audioManager.playTurnChange();
        
        const centerX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2;
        const centerY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2;
        
        const banner = this.add.text(centerX, centerY, text, {
            fontSize: '48px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);
        
        this.tweens.add({
            targets: banner,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(500, () => {
                    this.tweens.add({
                        targets: banner,
                        alpha: 0,
                        y: centerY - 50,
                        duration: 300,
                        onComplete: () => banner.destroy()
                    });
                });
            }
        });
    }

    selectNextUnit() {
        if (this.gameOver) return;
        
        const teamUnits = this.units.filter(u => u.data.team === this.currentTurn && !u.data.acted);
        
        if (teamUnits.length === 0) {
            // 当前玩家所有单位都行动完了，切换回合
            this.time.delayedCall(500, () => {
                if (this.currentTurn === 'player') {
                    this.startEnemyTurn();
                } else {
                    this.startPlayerTurn();
                }
            });
            return;
        }
        
        this.currentUnit = teamUnits[0];
        this.selectUnit(this.currentUnit);
        this.diceResult = null;
        this.waitingForAction = false;
        this.diceDisplay.setVisible(false);
        this.diceResultText.setText('');
        
        this.updateNobleButton();
        this.updateBerserkButton();
        
        if (this.currentUnit.data.berserkAttack) {
            this.actionText.setText('选择行动：移动 / 掷骰子 / 宝具 / 普攻(狂化)');
        } else {
            this.actionText.setText('选择行动：移动 / 掷骰子 / 宝具');
        }
    }

    selectUnit(unit) {
        this.clearHighlights();
        
        // 停止之前的选中动画
        if (this.selectedUnit && this.selectedUnit.data.selectTween) {
            this.selectedUnit.data.selectTween.stop();
            this.selectedUnit.data.border.setScale(1);
        }
        
        this.selectedUnit = unit;
        
        if (this.selectedUnit) {
            this.selectedUnit.data.border.setStrokeStyle(4, 0xffff00);
            
            // 选中脉冲动画
            this.selectedUnit.data.selectTween = this.tweens.add({
                targets: this.selectedUnit.data.border,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // 显示移动范围和攻击范围
            this.showUnitRanges(unit);
        }
        
        const d = unit.data;
        let statusText = '';
        if (d.silenced > 0) statusText += ` [沉默${d.silenced}]`;
        if (d.burstMode > 0) statusText += ` [魔放${d.burstMode}]`;
        if (d.shield > 0) statusText += ` [盾${d.shield}]`;
        
        this.unitInfoText.setText(
            `${d.name} [${d.className}] HP:${d.hp}/${d.maxHp} NP:${d.np}/${d.maxNp} 骰子:${d.diceCount}d6 移动:${d.moveRange} 射程:${d.attackRange}${statusText}`
        );
    }

    showUnitRanges(unit) {
        // 显示移动范围（蓝色）
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - unit.data.x) + Math.abs(y - unit.data.y);
                if (dist <= unit.data.moveRange && dist > 0 && !this.getUnitAt(x, y)) {
                    const highlight = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0x3498db, 0.25
                    );
                    this.highlightTiles.push({ x, y, highlight, type: 'preview' });
                }
            }
        }
        
        // 显示攻击范围（红色边框）
        let attackRange = unit.data.attackRange;
        if (unit.data.burstMode > 0) {
            attackRange += unit.data.burstRangeBonus;
        }
        
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - unit.data.x) + Math.abs(y - unit.data.y);
                if (dist <= attackRange && dist > 0) {
                    const highlight = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 8, GAME_CONFIG.tileSize - 8
                    );
                    highlight.setStrokeStyle(2, 0xe74c3c, 0.5);
                    highlight.setFillStyle();
                    this.highlightTiles.push({ x, y, highlight, type: 'preview' });
                }
            }
        }
    }

    updateNobleButton() {
        if (this.currentUnit && this.currentUnit.data.np >= 100) {
            this.nobleBtn.setStyle({ fill: '#f1c40f' });
        } else {
            this.nobleBtn.setStyle({ fill: '#555' });
        }
    }

    rollDice() {
        if (!this.currentUnit || this.currentUnit.data.acted) return;
        if (this.waitingForAction) return;
        if (this.onlineMode && !this.isMyTurn()) return;
        
        audioManager.playDiceRoll();
        
        // 骰子动画
        this.diceDisplay.setVisible(true);
        let rolls = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                rolls++;
                if (rolls >= 10) {
                    rollAnim.remove();
                    audioManager.playDiceResult();
                    this.finishRoll();
                }
            },
            loop: true
        });
    }

    finishRoll() {
        this.diceResult = Phaser.Math.Between(1, 6);
        this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][this.diceResult - 1]);
        
        const effect = DICE_EFFECTS[this.diceResult];
        this.diceResultText.setText(`${this.diceResult}: ${effect.name}`);
        this.actionText.setText(`掷出 ${this.diceResult}: ${effect.desc}`);
        this.addLog(`${this.currentUnit.data.name} 掷骰子: ${this.diceResult} (${effect.name})`);
        
        this.waitingForAction = true;
        this.applyDiceEffect();
    }

    applyDiceEffect() {
        const effect = DICE_EFFECTS[this.diceResult];
        
        // 单独行动限制：不能发动技能
        if (this.currentUnit.data.noSkillThisTurn) {
            if (effect.type === 'bloodSkill' || effect.type === 'skillRoulette' || effect.type === 'classSkill') {
                this.actionText.setText(`单独行动中，无法发动技能!`);
                this.addLog(`单独行动限制，技能无效`);
                this.finishAction();
                return;
            }
        }
        
        switch(effect.type) {
            case 'attack':
                this.showAttackRange(this.currentUnit);
                this.setupAttackInput();
                break;
            case 'heal':
                this.rollForHeal();
                break;
            case 'bloodSkill':
                this.showSkillSelection(true);
                break;
            case 'charge':
                this.rollForCharge();
                break;
            case 'skillRoulette':
                this.rollSkillRoulette();
                break;
            case 'classSkill':
                this.useClassSkill();
                break;
        }
    }

    showSkillSelection(costHp) {
        // 检查沉默
        if (this.currentUnit.data.silenced > 0) {
            this.actionText.setText(`${this.currentUnit.data.name} 被沉默中，无法使用技能!`);
            this.finishAction();
            return;
        }
        
        // 检查单独行动限制
        if (this.currentUnit.data.noSkillThisTurn) {
            this.actionText.setText(`单独行动中，无法发动技能!`);
            this.finishAction();
            return;
        }
        this.clearHighlights();
        const skills = this.currentUnit.data.skills;
        const startX = 300;
        const uiY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize + 80;
        
        this.skillButtons = [];
        skills.forEach((skill, index) => {
            const btn = this.add.text(startX + index * 150, uiY, `[${skill.name}]`, 
                { fontSize: '14px', fill: '#3498db' })
                .setInteractive()
                .on('pointerdown', () => {
                    if (costHp) {
                        this.currentUnit.data.hp -= 15;
                        this.addLog(`${this.currentUnit.data.name} 血祭消耗 15 HP`);
                        this.updateUnitBars(this.currentUnit);
                        if (this.currentUnit.data.hp <= 0) {
                            this.addLog(`${this.currentUnit.data.name} 因血祭死亡!`);
                            audioManager.playDeath();
                            const deadUnit = this.currentUnit;
                            this.currentUnit = null;
                            this.clearSkillButtons();
                            this.destroyUnit(deadUnit);
                            // 如果游戏没结束，继续下一个单位
                            if (!this.gameOver) {
                                this.time.delayedCall(500, () => this.selectNextUnit());
                            }
                            return;
                        }
                    }
                    this.executeSkill(index);
                    this.clearSkillButtons();
                })
                .on('pointerover', () => btn.setStyle({ fill: '#5dade2' }))
                .on('pointerout', () => btn.setStyle({ fill: '#3498db' }));
            this.skillButtons.push(btn);
        });
        
        this.actionText.setText(costHp ? '选择技能（消耗15HP）' : '选择技能');
    }

    rollForHeal() {
        let rolls = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                rolls++;
                if (rolls >= 8) {
                    rollAnim.remove();
                    // 掷2个骰子决定恢复量
                    const roll1 = Phaser.Math.Between(1, 6);
                    const roll2 = Phaser.Math.Between(1, 6);
                    const healAmount = (roll1 + roll2) * 3;
                    this.currentUnit.data.hp = Math.min(this.currentUnit.data.maxHp, this.currentUnit.data.hp + healAmount);
                    this.updateUnitBars(this.currentUnit);
                    audioManager.playHeal();
                    this.showHealNumber(this.currentUnit, healAmount);
                    this.diceResultText.setText(`治疗: [${roll1}+${roll2}]×3`);
                    const msg = `${this.currentUnit.data.name} 恢复 ${healAmount} HP`;
                    this.actionText.setText(msg);
                    this.addLog(msg);
                    this.finishAction();
                }
            },
            loop: true
        });
    }

    rollForCharge() {
        let rolls = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                rolls++;
                if (rolls >= 8) {
                    rollAnim.remove();
                    // 掷2个骰子决定充能量
                    const roll1 = Phaser.Math.Between(1, 6);
                    const roll2 = Phaser.Math.Between(1, 6);
                    const chargeAmount = (roll1 + roll2) * 4;
                    this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + chargeAmount);
                    this.updateUnitBars(this.currentUnit);
                    this.updateNobleButton();
                    audioManager.playCharge();
                    this.diceResultText.setText(`充能: [${roll1}+${roll2}]×4`);
                    const msg = `${this.currentUnit.data.name} 宝具值 +${chargeAmount}`;
                    this.actionText.setText(msg);
                    this.addLog(msg);
                    this.finishAction();
                }
            },
            loop: true
        });
    }

    rollForSkill(type, skill) {
        let rolls = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                rolls++;
                if (rolls >= 8) {
                    rollAnim.remove();
                    const diceResult = Phaser.Math.Between(1, 6);
                    this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][diceResult - 1]);
                    
                    switch(type) {
                        case 'burstMode':
                            const atkBonus = diceResult * (skill.multiplier || 2);
                            this.currentUnit.data.burstMode = skill.turns;
                            this.currentUnit.data.burstAtkBonus = atkBonus;
                            this.currentUnit.data.burstRangeBonus = skill.rangeBonus;
                            this.diceResultText.setText(`骰子: ${diceResult}`);
                            const burstMsg = `${this.currentUnit.data.name} 发动魔力放出，${skill.turns}次攻击+${atkBonus}伤害`;
                            this.actionText.setText(burstMsg);
                            this.addLog(burstMsg);
                            this.finishAction();
                            break;
                        case 'shield':
                            const shieldAmount = diceResult * skill.multiplier;
                            this.currentUnit.data.shield += shieldAmount;
                            this.updateUnitBars(this.currentUnit);
                            audioManager.playShield();
                            this.diceResultText.setText(`骰子: ${diceResult}×${skill.multiplier}`);
                            const shieldMsg = `${this.currentUnit.data.name} 获得 ${shieldAmount} 护盾`;
                            this.actionText.setText(shieldMsg);
                            this.addLog(shieldMsg);
                            this.finishAction();
                            break;
                        case 'chargeAndMove':
                            const chargeAmount = diceResult * skill.multiplier;
                            this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + chargeAmount);
                            this.updateUnitBars(this.currentUnit);
                            this.updateNobleButton();
                            this.diceResultText.setText(`骰子: ${diceResult}×${skill.multiplier}`);
                            const chargeMsg = `${this.currentUnit.data.name} 宝具值 +${chargeAmount}`;
                            this.actionText.setText(chargeMsg + '，选择移动位置');
                            this.addLog(chargeMsg);
                            this.showMoveRange(this.currentUnit, this.currentUnit.data.moveRange);
                            this.setupMoveInputThenFinish();
                            break;
                    }
                }
            },
            loop: true
        });
    }

    clearSkillButtons() {
        if (this.skillButtons) {
            this.skillButtons.forEach(btn => btn.destroy());
            this.skillButtons = [];
        }
    }

    rollSkillRoulette() {
        // 再掷一次决定技能
        let rolls = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 3);
                this.diceResultText.setText(`技能轮盘: ${tempRoll}`);
                rolls++;
                if (rolls >= 8) {
                    rollAnim.remove();
                    const skillIndex = Phaser.Math.Between(0, 2);
                    const skill = this.currentUnit.data.skills[skillIndex];
                    this.actionText.setText(`轮盘结果: ${skill.name}!`);
                    this.time.delayedCall(500, () => this.executeSkill(skillIndex));
                }
            },
            loop: true
        });
    }

    executeSkill(index) {
        const skill = this.currentUnit.data.skills[index];
        if (!skill) {
            this.finishAction();
            return;
        }
        
        audioManager.playSkill();
        this.actionText.setText(`使用技能: ${skill.name} - ${skill.desc}`);
        
        switch(skill.effect) {
            case 'heal':
                this.currentUnit.data.hp = Math.min(this.currentUnit.data.maxHp, this.currentUnit.data.hp + skill.value);
                this.updateUnitBars(this.currentUnit);
                this.finishAction();
                break;
            case 'charge':
                this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + skill.value);
                this.updateUnitBars(this.currentUnit);
                this.updateNobleButton();
                this.finishAction();
                break;
            case 'atkBuff':
                this.currentUnit.data.atkBuff += skill.value;
                this.finishAction();
                break;
            case 'extraDice':
                this.currentUnit.data.extraDice = (this.currentUnit.data.extraDice || 0) + skill.value;
                this.actionText.setText(`${this.currentUnit.data.name} 下次攻击骰子+${skill.value}!`);
                this.finishAction();
                break;
            case 'burstMode':
                this.currentUnit.data.burstMode = skill.value;
                this.currentUnit.data.burstAtkBonus = skill.atkBonus;
                this.currentUnit.data.burstRangeBonus = skill.rangeBonus;
                this.actionText.setText(`${this.currentUnit.data.name} 魔力放出! 接下来${skill.value}次攻击强化!`);
                this.finishAction();
                break;
            case 'burstModeRoll':
                this.rollForSkill('burstMode', skill);
                break;
            case 'shield':
                this.currentUnit.data.shield += skill.value;
                this.updateUnitBars(this.currentUnit);
                this.actionText.setText(`${this.currentUnit.data.name} 获得${skill.value}点护盾!`);
                this.finishAction();
                break;
            case 'shieldRoll':
                this.rollForSkill('shield', skill);
                break;
            case 'chargeAndMove':
                this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + skill.value);
                this.updateUnitBars(this.currentUnit);
                this.updateNobleButton();
                this.actionText.setText(`${this.currentUnit.data.name} 宝具值+${skill.value}! 选择移动位置`);
                this.showMoveRange(this.currentUnit, this.currentUnit.data.moveRange);
                this.setupMoveInputThenFinish();
                break;
            case 'chargeRollAndMove':
                this.rollForSkill('chargeAndMove', skill);
                break;
            case 'healRoll':
                this.rollForHeal();
                break;
            case 'teamAtkBuff':
                this.units.filter(u => u.data.team === this.currentUnit.data.team).forEach(u => {
                    u.data.atkBuff += skill.value;
                });
                this.actionText.setText(`全体友军攻击+${skill.value}!`);
                this.finishAction();
                break;
            case 'directDamage':
                this.showAttackRange(this.currentUnit);
                if (this.highlightTiles.length > 0) {
                    this.setupSkillDamageInput(skill.value);
                } else {
                    this.actionText.setText('没有可攻击的目标');
                    this.finishAction();
                }
                break;
            case 'healAll':
                this.units.filter(u => u.data.team === this.currentUnit.data.team).forEach(u => {
                    u.data.hp = Math.min(u.data.maxHp, u.data.hp + skill.value);
                    this.updateUnitBars(u);
                });
                this.finishAction();
                break;
            case 'evade':
            case 'guts':
                this.currentUnit.data.guts = true;
                this.finishAction();
                break;
            case 'critBuff':
                this.currentUnit.data.doubleDamage = true;
                this.finishAction();
                break;
            // 卫宫技能
            case 'roAias':
                // 炽天覆七重圆环
                this.useRoAias();
                break;
            case 'projection':
                // 投影魔术
                this.useProjection();
                break;
            case 'tripleStrike':
                // 鹤翼三连：连续3次攻击并恢复NP
                this.showAttackRange(this.currentUnit);
                if (this.highlightTiles.filter(t => t.type === 'attack').length > 0) {
                    this.setupTripleStrikeInput();
                } else {
                    this.actionText.setText('没有可攻击的目标');
                    this.finishAction();
                }
                break;
            default:
                this.finishAction();
                break;
        }
    }

    useRoAias() {
        const d = this.currentUnit.data;
        if (!d.roAiasCount) d.roAiasCount = 0;
        if (!d.roAiasLastValue) d.roAiasLastValue = 0;
        
        if (d.roAiasCount >= 7) {
            this.actionText.setText('七重圆环已达上限!');
            this.addLog(`${d.name} 七重圆环已达7层上限`);
            this.finishAction();
            return;
        }
        
        // 掷两次骰子决定护盾值
        let rolls = 0;
        let dice1 = 0, dice2 = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                this.diceDisplay.setVisible(true);
                rolls++;
                
                if (rolls === 8) {
                    dice1 = Phaser.Math.Between(1, 6);
                    this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][dice1 - 1]);
                }
                
                if (rolls >= 16) {
                    rollAnim.remove();
                    dice2 = Phaser.Math.Between(1, 6);
                    this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][dice2 - 1]);
                    
                    // 护盾值 = 骰子1 + 骰子2 + 上次护盾值
                    const newShield = dice1 + dice2 + d.roAiasLastValue;
                    d.shield += newShield;
                    d.roAiasLastValue = newShield;
                    d.roAiasCount++;
                    
                    this.updateUnitBars(this.currentUnit);
                    audioManager.playShield();
                    this.diceResultText.setText(`第${d.roAiasCount}层: [${dice1}+${dice2}+${d.roAiasLastValue - dice1 - dice2}]=${newShield}`);
                    this.addLog(`${d.name} 七重圆环第${d.roAiasCount}层: +${newShield}护盾 (累计${d.shield})`);
                    this.finishAction();
                }
            },
            loop: true
        });
    }

    useProjection() {
        const d = this.currentUnit.data;
        
        if (d.projectedWeapon) {
            // 已有武器，显示选项
            this.clearSkillButtons();
            this.skillButtons = [];
            const uiY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize + 80;
            
            // 选项1：投掷武器（直线伤害+恢复NP）
            const btn1 = this.add.text(300, uiY, '[投掷武器]', { fontSize: '14px', fill: '#e74c3c' })
                .setInteractive()
                .on('pointerdown', () => {
                    this.clearSkillButtons();
                    this.projectThrowWeapon();
                })
                .on('pointerover', function() { this.setStyle({ fill: '#ec7063' }); })
                .on('pointerout', function() { this.setStyle({ fill: '#e74c3c' }); });
            this.skillButtons.push(btn1);
            
            // 选项2：投影新武器到地图上
            const btn2 = this.add.text(450, uiY, '[投影武器]', { fontSize: '14px', fill: '#f1c40f' })
                .setInteractive()
                .on('pointerdown', () => {
                    this.clearSkillButtons();
                    this.projectPlaceWeapon();
                })
                .on('pointerover', function() { this.setStyle({ fill: '#f4d03f' }); })
                .on('pointerout', function() { this.setStyle({ fill: '#f1c40f' }); });
            this.skillButtons.push(btn2);
            
            this.actionText.setText('已有投影武器：投掷造成伤害 / 投影放置新武器');
        } else {
            this.projectNewWeapon();
        }
    }

    projectNewWeapon() {
        const d = this.currentUnit.data;
        
        // 掷骰子决定破碎加成
        let rolls = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                this.diceDisplay.setVisible(true);
                rolls++;
                if (rolls >= 8) {
                    rollAnim.remove();
                    const diceResult = Phaser.Math.Between(1, 6);
                    // 破碎加成 = 骰子 × 2
                    const bonus = diceResult * 2;
                    d.projectedWeapon = true;
                    d.projectionBonus = bonus;
                    
                    this.diceResultText.setText(`投影完成: ${diceResult}×2=+${bonus}伤害`);
                    this.addLog(`${d.name} 投影武器完成! 下次攻击破碎+${bonus}伤害`);
                    this.finishAction();
                }
            },
            loop: true
        });
    }

    projectThrowWeapon() {
        const d = this.currentUnit.data;
        
        // 掷4次骰子决定伤害
        let rolls = 0;
        let diceResults = [];
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                this.diceDisplay.setVisible(true);
                rolls++;
                
                // 每8次记录一个骰子结果
                if (rolls === 8 || rolls === 16 || rolls === 24 || rolls === 32) {
                    diceResults.push(Phaser.Math.Between(1, 6));
                }
                
                if (rolls >= 32) {
                    rollAnim.remove();
                    
                    // 伤害 = 骰子1 + 骰子2 + 骰子3 + 骰子4
                    const totalDamage = diceResults.reduce((a, b) => a + b, 0);
                    d.projectedWeapon = false;
                    d.projectionBonus = 0;
                    
                    this.diceResultText.setText(`投掷: [${diceResults.join('+')}]=${totalDamage}`);
                    
                    // 显示直线攻击方向选择
                    this.showLineAttackDirections(this.currentUnit);
                    this.actionText.setText(`选择投掷方向 (直线${totalDamage}伤害，恢复等量NP)`);
                    this.setupProjectionThrowInput(totalDamage);
                }
            },
            loop: true
        });
    }

    // 投掷武器专用输入处理（带NP恢复）
    setupProjectionThrowInput(damage) {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const dirTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'direction');
            if (dirTile) {
                const enemies = this.getEnemiesInLine(this.currentUnit, dirTile.dir);
                this.clearHighlights();
                
                let totalDamageDealt = 0;
                if (enemies.length > 0) {
                    enemies.forEach(enemy => {
                        this.showDamageNumber(enemy, damage);
                        this.dealDamage(enemy, damage, 'skill');
                        totalDamageDealt += damage;
                    });
                    audioManager.playAttack();
                    
                    // 恢复等量NP
                    const npGain = totalDamageDealt;
                    this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + npGain);
                    this.updateUnitBars(this.currentUnit);
                    this.updateNobleButton();
                    
                    this.addLog(`投掷武器命中${enemies.length}人，每人${damage}伤害，NP+${npGain}`);
                } else {
                    this.addLog(`投掷武器：该方向无目标`);
                }
                this.finishAction();
            } else {
                this.setupProjectionThrowInput(damage);
            }
        });
    }

    // 投影新武器放置到地图上
    projectPlaceWeapon() {
        // 显示可放置的范围
        this.showWeaponPlaceRange(this.currentUnit);
        this.actionText.setText('选择投影武器的位置');
        this.setupWeaponPlaceInput();
    }

    showWeaponPlaceRange(unit) {
        this.clearHighlights();
        const range = unit.data.attackRange + 2; // 放置范围比攻击范围大一点
        
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - unit.data.x) + Math.abs(y - unit.data.y);
                // 空格子且在范围内
                if (dist <= range && dist > 0 && !this.getUnitAt(x, y) && !this.getSwordAt(x, y)) {
                    const highlight = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0xf1c40f, 0.4
                    );
                    this.highlightTiles.push({ x, y, highlight, type: 'place' });
                }
            }
        }
    }

    setupWeaponPlaceInput() {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const placeTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'place');
            if (placeTile) {
                this.clearHighlights();
                
                // 在该位置生成一把剑
                const posX = tileX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                const posY = tileY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                
                const sword = this.add.image(posX, posY, 'ubw_sword');
                sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
                sword.setOrigin(0.5);
                
                // 初始化ubwSwords数组（如果不存在）
                if (!this.ubwSwords) this.ubwSwords = [];
                this.ubwSwords.push({ 
                    x: tileX, 
                    y: tileY, 
                    sprite: sword, 
                    damage: Phaser.Math.Between(8, 15),
                    owner: this.currentUnit
                });
                
                this.addLog(`${this.currentUnit.data.name} 在 (${tileX},${tileY}) 投影了武器`);
                this.finishAction();
            } else {
                this.setupWeaponPlaceInput();
            }
        });
    }

    // 直线攻击输入处理
    setupLineAttackInput(damage, skillName) {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const dirTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'direction');
            if (dirTile) {
                const enemies = this.getEnemiesInLine(this.currentUnit, dirTile.dir);
                this.clearHighlights();
                
                if (enemies.length > 0) {
                    // 对直线上所有敌人造成伤害
                    enemies.forEach(enemy => {
                        this.showDamageNumber(enemy, damage);
                        this.dealDamage(enemy, damage, 'skill');
                    });
                    audioManager.playAttack();
                    this.addLog(`${skillName}命中${enemies.length}人，每人${damage}伤害`);
                } else {
                    this.addLog(`${skillName}：该方向无目标`);
                }
                this.finishAction();
            } else {
                this.setupLineAttackInput(damage, skillName);
            }
        });
    }

    setupTripleStrikeInput() {
        this.tripleStrikeCount = 3;
        this.tripleStrikeDamages = [];
        this.tripleStrikeNp = 0;
        this.actionText.setText(`鹤翼三连! 选择攻击方向 (剩余${this.tripleStrikeCount}次)`);
        this.showLineAttackDirections(this.currentUnit);
        this.doTripleStrike();
    }

    doTripleStrike() {
        if (this.tripleStrikeCount <= 0) {
            const totalDamage = this.tripleStrikeDamages.reduce((a, b) => a + b, 0);
            this.addLog(`鹤翼三连完成! 总伤害${totalDamage}, NP+${this.tripleStrikeNp}`);
            this.finishAction();
            return;
        }
        
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const dirTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'direction');
            if (dirTile) {
                const damage = Phaser.Math.Between(1, 6);
                this.tripleStrikeDamages.push(damage);
                this.tripleStrikeCount--;
                
                // 恢复等量NP
                this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + damage);
                this.tripleStrikeNp += damage;
                this.updateUnitBars(this.currentUnit);
                this.updateNobleButton();
                
                // 获取直线上的敌人
                const enemies = this.getEnemiesInLine(this.currentUnit, dirTile.dir);
                
                if (enemies.length > 0) {
                    enemies.forEach(enemy => {
                        this.showDamageNumber(enemy, damage);
                        this.dealDamage(enemy, damage, 'skill');
                    });
                    audioManager.playAttack();
                    this.addLog(`鹤翼第${3 - this.tripleStrikeCount}击: ${damage}伤害×${enemies.length}人, +${damage}NP`);
                } else {
                    this.addLog(`鹤翼第${3 - this.tripleStrikeCount}击: 无目标, +${damage}NP`);
                }
                
                if (this.tripleStrikeCount > 0) {
                    this.clearHighlights();
                    this.showLineAttackDirections(this.currentUnit);
                    this.actionText.setText(`鹤翼三连! 选择攻击方向 (剩余${this.tripleStrikeCount}次)`);
                    this.time.delayedCall(300, () => this.doTripleStrike());
                } else {
                    this.clearHighlights();
                    const totalDamage = this.tripleStrikeDamages.reduce((a, b) => a + b, 0);
                    this.addLog(`鹤翼三连完成! 总伤害${totalDamage}, NP+${this.tripleStrikeNp}`);
                    this.finishAction();
                }
            } else {
                this.doTripleStrike();
            }
        });
    }

    setupSkillDamageInput(damage) {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const attackTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'attack');
            if (attackTile) {
                const target = this.getUnitAt(tileX, tileY);
                if (target) {
                    this.dealDamage(target, damage, 'skill');
                    this.actionText.setText(`对 ${target.data.name} 造成 ${damage} 点伤害!`);
                }
                this.finishAction();
            } else {
                this.setupSkillDamageInput(damage);
            }
        });
    }

    useClassSkill() {
        const classSkill = CLASS_SKILLS[this.currentUnit.data.class];
        const msg = `${this.currentUnit.data.name} 发动职阶技能 ${classSkill.name}`;
        this.actionText.setText(msg);
        this.addLog(msg);
        
        switch(classSkill.effect) {
            case 'magicImmune':
                // 对魔力：免疫下一次技能伤害
                this.currentUnit.data.magicImmune = true;
                this.addLog(`获得对魔力效果`);
                this.finishAction();
                break;
            case 'extraActionNoSkill':
                // 单独行动：再行动一次但不能用技能
                this.currentUnit.data.extraActionNoSkill = true;
                this.addLog(`本回合可再行动一次（不能发动技能）`);
                this.finishAction();
                break;
            case 'guts':
                // 战斗续行：叠加次数
                this.currentUnit.data.gutsCount = (this.currentUnit.data.gutsCount || 0) + 1;
                this.addLog(`战斗续行层数: ${this.currentUnit.data.gutsCount}`);
                this.finishAction();
                break;
            case 'rideMove':
                // 骑乘：下次行动后额外移动
                this.currentUnit.data.rideMove = true;
                this.addLog(`下次行动后可额外移动`);
                this.finishAction();
                break;
            case 'fieldCreate':
                // 阵地作成：放置地形效果
                this.showFieldCreateRange();
                this.setupFieldCreateInput();
                break;
            case 'evade':
                // 气息遮断：免疫下次普攻
                this.currentUnit.data.evade = true;
                this.addLog(`获得闪避效果（免疫下次普攻）`);
                this.finishAction();
                break;
            case 'berserkAttack':
                // 狂化：下次行动额外增加普攻选项
                this.currentUnit.data.berserkAttack = true;
                this.addLog(`下次行动可额外进行普攻`);
                this.finishAction();
                break;
        }
    }

    showFieldCreateRange() {
        this.clearHighlights();
        const range = this.currentUnit.data.attackRange;
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - this.currentUnit.data.x) + Math.abs(y - this.currentUnit.data.y);
                if (dist <= range && dist > 0) {
                    const highlight = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0x9b59b6, 0.5
                    );
                    this.highlightTiles.push({ x, y, highlight, type: 'field' });
                }
            }
        }
        this.actionText.setText('选择放置地形效果的位置');
    }

    setupFieldCreateInput() {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const fieldTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'field');
            if (fieldTile) {
                this.createFieldEffect(tileX, tileY, this.currentUnit.data.team);
                this.finishAction();
            } else {
                this.setupFieldCreateInput();
            }
        });
    }

    createFieldEffect(x, y, team) {
        // 随机选择地形效果
        const effectType = Phaser.Math.Between(1, 4);
        let effectData = {};
        let color = 0x9b59b6;
        let effectName = '';
        
        switch(effectType) {
            case 1: // 伤害地形
                effectData = { effect: 'damage', value: Phaser.Math.Between(10, 20) };
                color = 0xe74c3c;
                effectName = `伤害陷阱（${effectData.value}伤害）`;
                break;
            case 2: // 治疗地形
                effectData = { effect: 'heal', value: Phaser.Math.Between(10, 20) };
                color = 0x2ecc71;
                effectName = `治疗领域（恢复${effectData.value}HP）`;
                break;
            case 3: // 充能地形
                effectData = { effect: 'charge', value: Phaser.Math.Between(15, 30) };
                color = 0xf1c40f;
                effectName = `魔力源（恢复${effectData.value}NP）`;
                break;
            case 4: // 障碍地形
                effectData = { effect: 'block' };
                color = 0x7f8c8d;
                effectName = `障碍物（不可通行）`;
                break;
        }
        
        // 创建地形效果标记
        const effectTile = this.add.rectangle(
            x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10,
            color, 0.4
        );
        effectTile.setStrokeStyle(2, color);
        
        // 存储地形效果
        if (!this.fieldEffects) this.fieldEffects = [];
        this.fieldEffects.push({
            x, y, team, tile: effectTile,
            ...effectData
        });
        
        // 如果是障碍，标记地图不可通行
        if (effectData.effect === 'block') {
            this.map[y][x].walkable = false;
        }
        
        this.addLog(`在 (${x},${y}) 放置了${effectName}`);
    }

    checkFieldEffects(unit) {
        if (!this.fieldEffects) return;
        
        const effect = this.fieldEffects.find(f => f.x === unit.data.x && f.y === unit.data.y);
        if (!effect) return;
        
        // 障碍物不会触发（因为不能进入）
        if (effect.effect === 'block') return;
        
        switch(effect.effect) {
            case 'damage':
                // 伤害对所有人生效
                this.dealDamage(unit, effect.value, 'skill');
                this.addLog(`${unit.data.name} 踩到陷阱，受到 ${effect.value} 伤害`);
                break;
            case 'heal':
                // 治疗对所有人生效
                unit.data.hp = Math.min(unit.data.maxHp, unit.data.hp + effect.value);
                this.updateUnitBars(unit);
                this.addLog(`${unit.data.name} 经过治疗领域，恢复 ${effect.value} HP`);
                audioManager.playHeal();
                break;
            case 'charge':
                // 充能对所有人生效
                unit.data.np = Math.min(100, unit.data.np + effect.value);
                this.updateUnitBars(unit);
                this.addLog(`${unit.data.name} 经过魔力源，恢复 ${effect.value} NP`);
                audioManager.playCharge();
                break;
        }
    }

    showMoveRange(unit, range) {
        this.clearHighlights();
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - unit.data.x) + Math.abs(y - unit.data.y);
                // 检查是否可通行（没有单位且不是障碍物）
                const isBlocked = this.fieldEffects && this.fieldEffects.some(f => f.x === x && f.y === y && f.effect === 'block');
                if (dist <= range && dist > 0 && !this.getUnitAt(x, y) && !isBlocked) {
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

    showAttackRange(unit) {
        this.clearHighlights();
        let range = unit.data.attackRange;
        
        // 魔力放出增加攻击范围
        if (unit.data.burstMode > 0) {
            range += unit.data.burstRangeBonus;
        }
        
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - unit.data.x) + Math.abs(y - unit.data.y);
                const target = this.getUnitAt(x, y);
                if (dist <= range && target && target.data.team !== unit.data.team) {
                    const highlight = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0xe74c3c, 0.5
                    );
                    this.highlightTiles.push({ x, y, highlight, type: 'attack' });
                }
            }
        }
    }

    // 显示四个方向的直线攻击范围
    showLineAttackDirections(unit) {
        this.clearHighlights();
        const directions = [
            { dx: 0, dy: -1, name: '上' },
            { dx: 0, dy: 1, name: '下' },
            { dx: -1, dy: 0, name: '左' },
            { dx: 1, dy: 0, name: '右' }
        ];
        
        directions.forEach(dir => {
            // 显示方向指示器（第一格）
            const x = unit.data.x + dir.dx;
            const y = unit.data.y + dir.dy;
            
            if (x >= 0 && x < GAME_CONFIG.mapWidth && y >= 0 && y < GAME_CONFIG.mapHeight) {
                const highlight = this.add.rectangle(
                    x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                    0xf39c12, 0.6
                );
                highlight.setStrokeStyle(2, 0xf1c40f);
                this.highlightTiles.push({ x, y, highlight, type: 'direction', dir });
                
                // 显示该方向上的所有格子（预览）
                let px = x + dir.dx;
                let py = y + dir.dy;
                while (px >= 0 && px < GAME_CONFIG.mapWidth && py >= 0 && py < GAME_CONFIG.mapHeight) {
                    const preview = this.add.rectangle(
                        px * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        py * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0xe74c3c, 0.25
                    );
                    this.highlightTiles.push({ x: px, y: py, highlight: preview, type: 'preview' });
                    px += dir.dx;
                    py += dir.dy;
                }
            }
        });
    }

    // 获取直线上的所有敌人
    getEnemiesInLine(unit, dir) {
        const enemies = [];
        let x = unit.data.x + dir.dx;
        let y = unit.data.y + dir.dy;
        
        while (x >= 0 && x < GAME_CONFIG.mapWidth && y >= 0 && y < GAME_CONFIG.mapHeight) {
            const target = this.getUnitAt(x, y);
            if (target && target.data.team !== unit.data.team) {
                enemies.push(target);
            }
            x += dir.dx;
            y += dir.dy;
        }
        
        return enemies;
    }

    setupMoveInput() {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const moveTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'move');
            if (moveTile) {
                this.moveUnit(this.currentUnit, tileX, tileY);
                this.finishAction();
            } else {
                this.setupMoveInput();
            }
        });
    }

    setupMoveInputThenFinish() {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const moveTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'move');
            if (moveTile) {
                this.moveUnit(this.currentUnit, tileX, tileY);
                this.clearHighlights();
                this.finishAction();
            } else {
                this.setupMoveInputThenFinish();
            }
        });
    }

    setupAttackInput() {
        if (this.highlightTiles.filter(t => t.type === 'attack').length === 0) {
            this.actionText.setText('没有可攻击的目标!');
            this.finishAction();
            return;
        }
        
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const attackTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'attack');
            if (attackTile) {
                const target = this.getUnitAt(tileX, tileY);
                // attack 函数会在动画完成后自动调用 finishAction
                this.attack(this.currentUnit, target);
            } else {
                this.setupAttackInput();
            }
        });
    }

    useNoble() {
        if (!this.currentUnit || this.currentUnit.data.np < 100) return;
        if (this.currentUnit.data.acted) return;
        if (this.onlineMode && !this.isMyTurn()) return;
        
        const noble = this.currentUnit.data.noble;
        this.currentUnit.data.np = 0;
        this.updateUnitBars(this.currentUnit);
        
        // 在线模式同步
        if (this.onlineMode) {
            networkManager.sendAction({
                type: 'noble',
                team: this.currentUnit.data.team,
                nobleName: noble.name
            });
        }
        
        // 检查是否在无限剑制中，且是敌方使用宝具
        if (this.ubwActive && this.ubwOwner && this.currentUnit.data.team !== this.ubwOwner.data.team) {
            this.onEnemyNobleInUBW();
        }
        
        // 播放全屏宝具动画
        this.playNobleAnimation(noble, () => {
            this.executeNobleEffect(noble);
        });
    }

    playNobleAnimation(noble, onComplete) {
        const centerX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2;
        const centerY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2;
        const screenWidth = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const screenHeight = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        
        // 创建动画容器
        const animContainer = this.add.container(0, 0).setDepth(2000);
        
        // 黑幕背景
        const blackOverlay = this.add.rectangle(centerX, centerY, screenWidth + 300, screenHeight + 200, 0x000000, 0);
        animContainer.add(blackOverlay);
        
        // 渐入黑幕
        this.tweens.add({
            targets: blackOverlay,
            fillAlpha: 0.85,
            duration: 300,
            ease: 'Power2'
        });
        
        // 角色立绘/头像放大显示
        const charId = this.currentUnit.data.charId;
        let portrait;
        if (this.textures.exists(charId)) {
            portrait = this.add.image(centerX - 200, centerY, charId);
            portrait.setDisplaySize(200, 200);
        } else {
            portrait = this.add.circle(centerX - 200, centerY, 80, 0xf1c40f);
        }
        portrait.setAlpha(0).setScale(0.5);
        animContainer.add(portrait);
        
        // 角色名
        const charName = this.add.text(centerX + 50, centerY - 80, this.currentUnit.data.name, {
            fontSize: '28px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add(charName);
        
        // 宝具名（大字）
        const nobleName = this.add.text(centerX + 50, centerY, noble.name, {
            fontSize: '42px',
            fill: '#f1c40f',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        animContainer.add(nobleName);
        
        // 宝具真名解放文字
        const releaseText = this.add.text(centerX + 50, centerY + 60, '真名解放', {
            fontSize: '18px',
            fill: '#e74c3c'
        }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add(releaseText);
        
        // 创建光效粒子
        const particles = [];
        for (let i = 0; i < 30; i++) {
            const particle = this.add.rectangle(
                Phaser.Math.Between(0, screenWidth),
                Phaser.Math.Between(0, screenHeight),
                Phaser.Math.Between(2, 6),
                Phaser.Math.Between(20, 60),
                0xf1c40f, 0
            );
            particle.setRotation(Phaser.Math.Between(-30, 30) * Math.PI / 180);
            animContainer.add(particle);
            particles.push(particle);
        }
        
        // 播放音效
        audioManager.playNoble();
        
        // 动画序列
        this.time.delayedCall(200, () => {
            // 角色立绘出现
            this.tweens.add({
                targets: portrait,
                alpha: 1,
                scale: 1,
                duration: 400,
                ease: 'Back.easeOut'
            });
            
            // 角色名出现
            this.tweens.add({
                targets: charName,
                alpha: 1,
                x: centerX + 50,
                duration: 300,
                ease: 'Power2'
            });
        });
        
        this.time.delayedCall(500, () => {
            // 宝具名出现
            this.tweens.add({
                targets: nobleName,
                alpha: 1,
                scale: 1,
                duration: 400,
                ease: 'Back.easeOut'
            });
            
            // 真名解放文字
            this.tweens.add({
                targets: releaseText,
                alpha: 1,
                duration: 300
            });
            
            // 光效粒子动画
            particles.forEach((p, i) => {
                this.tweens.add({
                    targets: p,
                    fillAlpha: 0.8,
                    y: p.y - 200,
                    duration: 800 + i * 30,
                    delay: i * 20,
                    ease: 'Power1',
                    onComplete: () => {
                        this.tweens.add({
                            targets: p,
                            fillAlpha: 0,
                            duration: 200
                        });
                    }
                });
            });
        });
        
        // 剑光/能量波效果
        this.time.delayedCall(1200, () => {
            // 创建横向光波
            const lightWave = this.add.rectangle(0, centerY, 0, 8, 0xffffff, 0.9);
            animContainer.add(lightWave);
            
            this.tweens.add({
                targets: lightWave,
                width: screenWidth + 300,
                x: centerX,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    // 闪白效果
                    const flash = this.add.rectangle(centerX, centerY, screenWidth + 300, screenHeight + 200, 0xffffff, 0);
                    animContainer.add(flash);
                    
                    this.tweens.add({
                        targets: flash,
                        fillAlpha: 0.8,
                        duration: 100,
                        yoyo: true,
                        onComplete: () => {
                            // 动画结束，淡出
                            this.tweens.add({
                                targets: animContainer.list,
                                alpha: 0,
                                duration: 300,
                                onComplete: () => {
                                    animContainer.destroy();
                                    onComplete();
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    executeNobleEffect(noble) {
        this.actionText.setText(`宝具发动: ${noble.name}!`);
        
        // 宝具效果
        const enemies = this.units.filter(u => u.data.team !== this.currentUnit.data.team);
        switch(noble.effect) {
            case 'excalibur':
                // 选择目标（单体）
                this.showAttackRangeForNoble(noble.range);
                this.setupNobleTargetInput(noble);
                return;
            case 'excaliburAoe':
                // 范围AOE，伤害用骰子
                this.rollForNobleAoe(noble, enemies);
                return;
            case 'unlimitedBladeWorks':
                // 无限剑制：对范围内所有敌人造成剑雨伤害
                this.rollForUnlimitedBladeWorks(noble, enemies);
                return;
            case 'lineAoe':
            case 'aoe':
                enemies.forEach(e => {
                    const dist = Math.abs(e.data.x - this.currentUnit.data.x) + Math.abs(e.data.y - this.currentUnit.data.y);
                    if (dist <= noble.range) {
                        this.dealDamage(e, noble.damage, 'noble');
                    }
                });
                break;
            case 'single':
            case 'pierce':
            case 'instakill':
            case 'dispel':
                if (enemies.length > 0) {
                    let nearest = enemies[0];
                    let minDist = Infinity;
                    enemies.forEach(e => {
                        const dist = Math.abs(e.data.x - this.currentUnit.data.x) + Math.abs(e.data.y - this.currentUnit.data.y);
                        if (dist < minDist) { minDist = dist; nearest = e; }
                    });
                    if (minDist <= noble.range) {
                        this.dealDamage(nearest, noble.damage, 'noble');
                    }
                }
                break;
        }
        
        this.finishAction();
    }

    rollForUnlimitedBladeWorks(noble, enemies) {
        // 无限剑制：展开固有结界
        const d = this.currentUnit.data;
        
        // 设置固有结界状态
        this.ubwActive = true;
        this.ubwOwner = this.currentUnit;
        this.ubwDuration = noble.duration || 5;
        
        // 记录地图上已有武器的位置（由同一玩家放置的）
        const existingPositions = [];
        if (this.ubwSwords && this.ubwSwords.length > 0) {
            this.ubwSwords.forEach(sword => {
                if (sword.owner && sword.owner.data && sword.owner.data.team === d.team) {
                    existingPositions.push({ x: sword.x, y: sword.y, damage: sword.damage });
                }
                // 删除武器sprite
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
        
        this.addLog(`${d.name} 展开无限剑制! 持续${this.ubwDuration}回合`);
        if (existingPositions.length > 0) {
            this.addLog(`投影武器融入结界，共${this.ubwSwords.length}把剑`);
        }
        this.addLog(`剑会自动追踪敌人，敌方使用宝具会生成新剑`);
        
        // 对范围内敌人造成初始伤害
        let rolls = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                this.diceDisplay.setVisible(true);
                rolls++;
                if (rolls >= 12) {
                    rollAnim.remove();
                    
                    const diceRolls = [];
                    let total = 0;
                    for (let i = 0; i < 4; i++) {
                        const roll = Phaser.Math.Between(1, 6);
                        diceRolls.push(roll);
                        total += roll;
                    }
                    const damage = total * 4;
                    
                    let hitCount = 0;
                    enemies.forEach(e => {
                        this.showDamageNumber(e, damage);
                        this.dealDamage(e, damage, 'noble');
                        hitCount++;
                    });
                    
                    this.diceResultText.setText(`[${diceRolls.join('+')}]×4=${damage}`);
                    this.addLog(`剑雨攻击! ${hitCount}人受到${damage}伤害`);
                    
                    // 武器立即开始追踪攻击
                    this.time.delayedCall(500, () => {
                        this.processUBWSwords();
                        this.finishAction();
                    });
                }
            },
            loop: true
        });
    }

    changeMapToUBW() {
        // 改变地图颜色为固有结界风格（荒野+�的轮）
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.map[y][x].tile.setFillStyle(0x8b4513, 0.8);
                this.map[y][x].tile.setStrokeStyle(1, 0xcd853f);
            }
        }
    }

    restoreMapFromUBW() {
        // 恢复地图原本颜色
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const isGrass = Math.random() > 0.15;
                const color = isGrass ? 0x4a7c59 : 0x8b7355;
                this.map[y][x].tile.setFillStyle(color);
                this.map[y][x].tile.setStrokeStyle(1, 0x2a2a2a);
            }
        }
    }

    spawnUBWSword() {
        // 在随机空位置生成一把剑
        let attempts = 0;
        while (attempts < 20) {
            const x = Phaser.Math.Between(0, GAME_CONFIG.mapWidth - 1);
            const y = Phaser.Math.Between(0, GAME_CONFIG.mapHeight - 1);
            
            // 检查位置是否为空（没有单位和其他剑）
            if (!this.getUnitAt(x, y) && !this.getSwordAt(x, y)) {
                const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                
                // 使用武器贴图
                const sword = this.add.image(posX, posY, 'ubw_sword');
                sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
                sword.setOrigin(0.5);
                
                if (!this.ubwSwords) this.ubwSwords = [];
                this.ubwSwords.push({ 
                    x, y, 
                    sprite: sword, 
                    damage: Phaser.Math.Between(8, 15),
                    owner: this.ubwOwner // 记录所有者
                });
                
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
        
        if (!this.ubwSwords) this.ubwSwords = [];
        this.ubwSwords.push({ 
            x, y, 
            sprite: sword, 
            damage: damage || Phaser.Math.Between(8, 15),
            owner: this.ubwOwner
        });
    }

    getSwordAt(x, y) {
        if (!this.ubwSwords) return null;
        return this.ubwSwords.find(s => s.x === x && s.y === y);
    }

    // 每回合开始时处理UBW效果
    processUBWTurn() {
        if (!this.ubwActive) return;
        
        // 减少持续时间
        this.ubwDuration--;
        this.addLog(`无限剑制剩余 ${this.ubwDuration} 回合`);
        
        // 生成新剑
        if (Phaser.Math.Between(1, 100) <= 60) { // 60%概率生成
            this.spawnUBWSword();
        }
        
        // 所有剑自动追踪攻击
        this.processUBWSwords();
        
        // 检查结界是否结束
        if (this.ubwDuration <= 0) {
            this.endUBW();
        }
    }

    processUBWSwords() {
        if (!this.ubwSwords || this.ubwSwords.length === 0) {
            this.addLog(`[调试] 没有武器可处理`);
            return;
        }
        
        this.addLog(`[调试] 处理 ${this.ubwSwords.length} 把武器`);
        
        this.ubwSwords.forEach((sword, index) => {
            if (!sword || !sword.sprite) {
                this.addLog(`[调试] 武器${index}无效`);
                return;
            }
            
            // 确定这把剑的所有者（优先使用剑自己的owner，否则使用ubwOwner）
            const swordOwner = sword.owner || this.ubwOwner;
            if (!swordOwner || !swordOwner.data) {
                this.addLog(`[调试] 武器${index}没有owner`);
                return;
            }
            
            // 找这把剑的敌人
            const enemies = this.units.filter(u => u.data && u.data.team !== swordOwner.data.team && u.data.hp > 0);
            if (enemies.length === 0) {
                this.addLog(`[调试] 没有敌人`);
                return;
            }
            
            // 找最近的敌人
            let nearest = null;
            let minDist = Infinity;
            enemies.forEach(e => {
                if (!e.data) return;
                const dist = Math.abs(e.data.x - sword.x) + Math.abs(e.data.y - sword.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = e;
                }
            });
            
            if (!nearest) return;
            
            this.addLog(`[调试] 武器${index}在(${sword.x},${sword.y})，目标在(${nearest.data.x},${nearest.data.y})，距离${minDist}`);
            
            // 如果在攻击范围内（1格），攻击
            if (minDist <= 1) {
                this.swordAttack(sword, nearest);
            } else {
                // 否则移动靠近（最多2格）
                this.moveSwordToward(sword, nearest);
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
                
                // 检查是否到达敌人旁边
                const dist = Math.abs(target.data.x - sword.x) + Math.abs(target.data.y - sword.y);
                if (dist <= 1) {
                    break;
                }
            } else {
                break;
            }
        }
        
        // 更新剑的位置
        const posX = sword.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = sword.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        this.tweens.add({
            targets: sword.sprite,
            x: posX,
            y: posY,
            duration: 200,
            ease: 'Power2'
        });
        
        // 移动后检查是否可以攻击
        const dist = Math.abs(target.data.x - sword.x) + Math.abs(target.data.y - sword.y);
        if (dist <= 1) {
            this.time.delayedCall(250, () => this.swordAttack(sword, target));
        }
    }

    swordAttack(sword, target) {
        if (!target || target.data.hp <= 0) return;
        if (!sword || !sword.sprite) return;
        
        const damage = sword.damage;
        
        // 计算目标的像素坐标
        const targetPosX = target.data.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const targetPosY = target.data.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        this.tweens.add({
            targets: sword.sprite,
            x: targetPosX,
            y: targetPosY,
            duration: 100,
            onComplete: () => {
                this.showDamageNumber(target, damage);
                this.dealDamage(target, damage, 'skill');
                audioManager.playAttack();
                
                // 武器破碎消失
                sword.sprite.destroy();
                this.ubwSwords = this.ubwSwords.filter(s => s !== sword);
                this.addLog(`剑破碎!`);
            }
        });
        
        this.addLog(`剑攻击 ${target.data.name}，造成 ${damage} 伤害`);
    }

    // 敌方使用宝具时触发
    onEnemyNobleInUBW() {
        if (!this.ubwActive) return;
        
        this.addLog(`敌方在结界中使用宝具! 生成新剑!`);
        this.spawnUBWSword();
    }

    endUBW() {
        this.addLog(`无限剑制结束!`);
        
        // 剩余剑数量转换为NP
        if (this.ubwSwords && this.ubwSwords.length > 0 && this.ubwOwner) {
            const npGain = this.ubwSwords.length * 10;
            this.ubwOwner.data.np = Math.min(100, this.ubwOwner.data.np + npGain);
            this.updateUnitBars(this.ubwOwner);
            this.addLog(`剩余${this.ubwSwords.length}把剑，恢复${npGain}NP`);
            
            // 销毁所有剑
            this.ubwSwords.forEach(s => s.sprite.destroy());
        }
        
        this.ubwSwords = [];
        this.ubwActive = false;
        this.ubwOwner = null;
        
        // 恢复地图
        this.restoreMapFromUBW();
    }

    showAttackRangeForNoble(range) {
        this.clearHighlights();
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - this.currentUnit.data.x) + Math.abs(y - this.currentUnit.data.y);
                const target = this.getUnitAt(x, y);
                if (dist <= range && target && target.data.team !== this.currentUnit.data.team) {
                    const highlight = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0xf1c40f, 0.6
                    );
                    this.highlightTiles.push({ x, y, highlight, type: 'noble' });
                }
            }
        }
    }

    setupNobleTargetInput(noble) {
        if (this.highlightTiles.filter(t => t.type === 'noble').length === 0) {
            this.actionText.setText('没有可攻击的目标!');
            this.finishAction();
            return;
        }
        
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const nobleTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'noble');
            if (nobleTile) {
                const target = this.getUnitAt(tileX, tileY);
                if (target) {
                    this.dealDamage(target, noble.damage, 'noble');
                    // 沉默效果
                    if (noble.silence) {
                        target.data.silenced = noble.silence;
                        this.actionText.setText(`${target.data.name} 被沉默${noble.silence}回合!`);
                    }
                }
                this.finishAction();
            } else {
                this.setupNobleTargetInput(noble);
            }
        });
    }

    rollForNobleAoe(noble, enemies) {
        let rolls = 0;
        const rollAnim = this.time.addEvent({
            delay: 80,
            callback: () => {
                const tempRoll = Phaser.Math.Between(1, 6);
                this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][tempRoll - 1]);
                rolls++;
                if (rolls >= 12) {
                    rollAnim.remove();
                    
                    // 掷多个骰子
                    const diceCount = noble.diceCount || 3;
                    const diceRolls = [];
                    let total = 0;
                    for (let i = 0; i < diceCount; i++) {
                        const roll = Phaser.Math.Between(1, 6);
                        diceRolls.push(roll);
                        total += roll;
                    }
                    const damage = total * (noble.multiplier || 5);
                    
                    let hitCount = 0;
                    const attacker = this.currentUnit;
                    
                    enemies.forEach(e => {
                        const dist = Math.abs(e.data.x - attacker.data.x) + Math.abs(e.data.y - attacker.data.y);
                        if (dist <= noble.range) {
                            // 破甲：无视护盾
                            if (noble.pierceShield) {
                                const originalShield = e.data.shield;
                                e.data.shield = 0;
                                this.dealDamage(e, damage, 'noble');
                                e.data.shield = originalShield;
                            } else {
                                this.dealDamage(e, damage, 'noble');
                            }
                            
                            // 击退效果
                            if (noble.knockback && e.data.hp > 0) {
                                this.knockbackUnit(e, attacker, noble.knockback);
                            }
                            
                            hitCount++;
                        }
                    });
                    
                    this.diceResultText.setText(`[${diceRolls.join('+')}]×${noble.multiplier}`);
                    let effectText = '';
                    if (noble.pierceShield) effectText += ' 无视护盾';
                    if (noble.knockback) effectText += ` 击退${noble.knockback}格`;
                    const nobleMsg = `${this.currentUnit.data.name} 发动宝具 ${noble.name}，${hitCount}人受到${damage}伤害${effectText}`;
                    this.actionText.setText(nobleMsg);
                    this.addLog(nobleMsg);
                    this.finishAction();
                }
            },
            loop: true
        });
    }

    knockbackUnit(target, attacker, distance) {
        // 计算击退方向（从攻击者指向目标）
        const dx = Math.sign(target.data.x - attacker.data.x);
        const dy = Math.sign(target.data.y - attacker.data.y);
        
        // 如果在同一位置，随机方向
        const finalDx = dx === 0 && dy === 0 ? (Math.random() > 0.5 ? 1 : -1) : dx;
        const finalDy = dx === 0 && dy === 0 ? 0 : dy;
        
        // 尝试击退
        for (let i = distance; i > 0; i--) {
            let newX = target.data.x + finalDx * i;
            let newY = target.data.y + finalDy * i;
            
            // 边界检查
            newX = Math.max(0, Math.min(GAME_CONFIG.mapWidth - 1, newX));
            newY = Math.max(0, Math.min(GAME_CONFIG.mapHeight - 1, newY));
            
            // 检查目标位置是否有其他单位
            if (!this.getUnitAt(newX, newY) || (newX === target.data.x && newY === target.data.y)) {
                if (newX !== target.data.x || newY !== target.data.y) {
                    this.moveUnit(target, newX, newY);
                }
                break;
            }
        }
    }

    moveUnit(unit, x, y) {
        const oldX = unit.data.x;
        const oldY = unit.data.y;
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
            ease: 'Power2',
            onComplete: () => {
                // 检查地形效果
                this.checkFieldEffects(unit);
            }
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

    attack(attacker, defender) {
        // 掷攻击骰子
        let diceCount = attacker.data.diceCount + (attacker.data.extraDice || 0);
        let totalDamage = attacker.data.atkBuff;
        
        // 魔力放出增加伤害
        if (attacker.data.burstMode > 0) {
            totalDamage += attacker.data.burstAtkBonus;
            attacker.data.burstMode--;
            if (attacker.data.burstMode === 0) {
                attacker.data.burstAtkBonus = 0;
                attacker.data.burstRangeBonus = 0;
            }
        }
        
        const rolls = [];
        for (let i = 0; i < diceCount; i++) {
            const roll = Phaser.Math.Between(1, 6);
            rolls.push(roll);
            totalDamage += roll;
        }
        
        // 投影武器破碎加成
        if (attacker.data.projectedWeapon && attacker.data.projectionBonus) {
            totalDamage += attacker.data.projectionBonus;
            this.addLog(`投影武器破碎! +${attacker.data.projectionBonus}伤害`);
            attacker.data.projectedWeapon = false;
            attacker.data.projectionBonus = 0;
        }
        
        // 气息遮断效果：伤害翻倍
        if (attacker.data.doubleDamage) {
            totalDamage *= 2;
            attacker.data.doubleDamage = false;
        }
        
        // 攻击动画：冲向敌人再返回
        const originalX = attacker.x;
        const originalY = attacker.y;
        const targetX = defender.x;
        const targetY = defender.y;
        
        // 计算冲刺位置（敌人前方）
        const dx = targetX - originalX;
        const dy = targetY - originalY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const rushX = originalX + (dx / dist) * (dist - 40);
        const rushY = originalY + (dy / dist) * (dist - 40);
        
        // 冲刺动画
        this.tweens.add({
            targets: [attacker, attacker.data.border],
            x: rushX,
            y: rushY,
            duration: 150,
            ease: 'Power2',
            yoyo: true,
            onYoyo: () => {
                // 在冲刺到达时造成伤害
                audioManager.playAttack();
                this.showDamageNumber(defender, totalDamage);
                this.dealDamage(defender, totalDamage);
                
                // 敌人受击闪烁
                this.tweens.add({
                    targets: defender,
                    alpha: 0.3,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
            },
            onComplete: () => {
                // 动画完成后结束行动
                this.finishAction();
            }
        });
        
        // 更新UI位置动画
        this.tweens.add({
            targets: [attacker.data.hpBar, attacker.data.hpBarBg],
            x: rushX,
            y: rushY - 35,
            duration: 150,
            ease: 'Power2',
            yoyo: true
        });
        
        const msg = `${attacker.data.name} 攻击 ${defender.data.name}，造成 ${totalDamage} 伤害`;
        this.actionText.setText(msg);
        this.addLog(msg);
        
        // 清除buff
        attacker.data.atkBuff = 0;
        attacker.data.extraDice = 0;
    }

    showDamageNumber(target, damage) {
        const damageText = this.add.text(target.x, target.y - 50, `-${damage}`, {
            fontSize: '28px',
            fill: '#e74c3c',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 伤害数字上浮消失动画
        this.tweens.add({
            targets: damageText,
            y: target.y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }

    showHealNumber(target, amount) {
        const healText = this.add.text(target.x, target.y - 50, `+${amount}`, {
            fontSize: '24px',
            fill: '#2ecc71',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: healText,
            y: target.y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => healText.destroy()
        });
    }

    // damageType: 'attack'=普攻, 'skill'=技能, 'noble'=宝具
    dealDamage(unit, damage, damageType = 'attack') {
        // 对魔力：免疫技能伤害
        if (unit.data.magicImmune && damageType === 'skill') {
            unit.data.magicImmune = false;
            this.addLog(`${unit.data.name} 对魔力发动，免疫技能伤害!`);
            return;
        }
        
        // 气息遮断（闪避）：免疫普攻伤害
        if (unit.data.evade && damageType === 'attack') {
            unit.data.evade = false;
            this.addLog(`${unit.data.name} 气息遮断发动，闪避普攻!`);
            return;
        }
        
        // 护盾吸收伤害
        if (unit.data.shield > 0) {
            if (unit.data.shield >= damage) {
                unit.data.shield -= damage;
                this.addLog(`${unit.data.name} 护盾吸收 ${damage} 伤害`);
                this.updateUnitBars(unit);
                return;
            } else {
                damage -= unit.data.shield;
                this.addLog(`${unit.data.name} 护盾破碎`);
                unit.data.shield = 0;
            }
        }
        
        unit.data.hp -= damage;
        this.updateUnitBars(unit);
        
        // 战斗续行检查（可叠加次数）
        if (unit.data.hp <= 0 && unit.data.gutsCount > 0) {
            unit.data.hp = 1;
            unit.data.gutsCount--;
            this.updateUnitBars(unit);
            this.addLog(`${unit.data.name} 战斗续行发动，保留1HP（剩余${unit.data.gutsCount}层）`);
            return;
        }
        
        if (unit.data.hp <= 0) {
            this.addLog(`${unit.data.name} 被击败!`);
            audioManager.playDeath();
            this.destroyUnit(unit);
        }
    }

    updateUnitBars(unit) {
        const hpPercent = Math.max(0, unit.data.hp / unit.data.maxHp);
        unit.data.hpBar.width = 50 * hpPercent;
        unit.data.hpBar.fillColor = hpPercent > 0.5 ? 0x2ecc71 : (hpPercent > 0.25 ? 0xf39c12 : 0xe74c3c);
        
        const npPercent = unit.data.np / unit.data.maxNp;
        unit.data.npBar.width = 50 * npPercent;
        
        // 护盾条
        const shieldPercent = Math.min(1, unit.data.shield / 50);
        unit.data.shieldBar.width = 50 * shieldPercent;
    }

    destroyUnit(unit) {
        // 如果被销毁的是UBW拥有者，结束UBW
        if (this.ubwActive && this.ubwOwner === unit) {
            this.endUBW();
        }
        
        this.units = this.units.filter(u => u !== unit);
        unit.data.hpBar.destroy();
        unit.data.hpBarBg.destroy();
        unit.data.npBar.destroy();
        unit.data.npBarBg.destroy();
        unit.data.shieldBar.destroy();
        unit.data.border.destroy();
        unit.destroy();
        
        if (this.checkGameOver()) {
            // 游戏结束，不再继续
            this.gameOver = true;
            return;
        }
    }

    finishAction() {
        if (this.gameOver) return;
        
        this.clearHighlights();
        this.clearSkillButtons();
        
        // 检查骑乘效果（行动后额外移动）
        if (this.currentUnit && this.currentUnit.data.rideMove) {
            this.currentUnit.data.rideMove = false;
            this.actionText.setText(`${this.currentUnit.data.name} 骑乘发动，可额外移动!`);
            this.addLog(`骑乘发动，额外移动`);
            this.showMoveRange(this.currentUnit, this.currentUnit.data.moveRange);
            this.setupRideMoveInput();
            return;
        }
        
        // 检查额外行动（阿尔托利亚三技能）
        if (this.currentUnit && this.currentUnit.data.extraAction) {
            this.currentUnit.data.extraAction = false;
            this.actionText.setText(`${this.currentUnit.data.name} 获得额外行动!`);
            this.diceResult = null;
            this.waitingForAction = false;
            this.diceDisplay.setVisible(false);
            this.diceResultText.setText('');
            this.updateBerserkButton();
            return;
        }
        
        // 检查单独行动（不能用技能的额外行动）
        if (this.currentUnit && this.currentUnit.data.extraActionNoSkill) {
            this.currentUnit.data.extraActionNoSkill = false;
            this.currentUnit.data.noSkillThisTurn = true; // 标记不能用技能
            this.actionText.setText(`${this.currentUnit.data.name} 单独行动，再行动一次（不能发动技能）!`);
            this.diceResult = null;
            this.waitingForAction = false;
            this.diceDisplay.setVisible(false);
            this.diceResultText.setText('');
            this.updateBerserkButton();
            return;
        }
        
        if (this.currentUnit) {
            // 停止选中动画
            if (this.currentUnit.data.selectTween) {
                this.currentUnit.data.selectTween.stop();
                this.currentUnit.data.border.setScale(1);
            }
            
            // 清除单回合限制
            this.currentUnit.data.noSkillThisTurn = false;
            
            this.currentUnit.data.acted = true;
            this.currentUnit.setAlpha(0.5);
            const borderColor = this.currentUnit.data.team === 'player' ? 0x3498db : 0xe74c3c;
            this.currentUnit.data.border.setStrokeStyle(3, borderColor);
        }
        this.waitingForAction = false;
        this.diceResult = null;
        
        this.time.delayedCall(800, () => this.selectNextUnit());
    }

    setupRideMoveInput() {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const moveTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'move');
            if (moveTile) {
                this.addLog(`${this.currentUnit.data.name} 骑乘移动到 (${tileX},${tileY})`);
                this.moveUnit(this.currentUnit, tileX, tileY);
                this.clearHighlights();
                // 继续结束行动流程
                this.finishActionFinal();
            } else {
                this.setupRideMoveInput();
            }
        });
    }

    finishActionFinal() {
        if (this.gameOver) return;
        
        this.clearHighlights();
        
        if (this.currentUnit) {
            if (this.currentUnit.data.selectTween) {
                this.currentUnit.data.selectTween.stop();
                this.currentUnit.data.border.setScale(1);
            }
            
            this.currentUnit.data.noSkillThisTurn = false;
            this.currentUnit.data.acted = true;
            this.currentUnit.setAlpha(0.5);
            const borderColor = this.currentUnit.data.team === 'player' ? 0x3498db : 0xe74c3c;
            this.currentUnit.data.border.setStrokeStyle(3, borderColor);
        }
        this.waitingForAction = false;
        this.diceResult = null;
        
        this.time.delayedCall(800, () => this.selectNextUnit());
    }

    clearHighlights() {
        this.highlightTiles.forEach(t => t.highlight.destroy());
        this.highlightTiles = [];
    }

    getUnitAt(x, y) {
        return this.units.find(u => u.data.x === x && u.data.y === y);
    }

    endTurn() {
        if (this.onlineMode) {
            // 在线模式：只有轮到自己才能结束回合
            if (!this.isMyTurn()) return;
            
            // 通知服务器回合结束
            networkManager.endTurn();
            return;
        }
        
        // 本地模式
        if (this.currentTurn !== 'player') return;
        
        this.units.filter(u => u.data.team === 'player').forEach(u => {
            u.data.acted = true;
            u.setAlpha(0.5);
        });
        
        this.startEnemyTurn();
    }

    startEnemyTurn() {
        this.currentTurn = 'enemy';
        this.showTurnBanner('玩家2 回合');
        this.turnText.setText('当前回合: 玩家2');
        this.addLog('--- 玩家2 回合 ---');
        
        // 处理无限剑制效果（如果是敌方的UBW）
        if (this.ubwActive && this.ubwOwner && this.ubwOwner.data.team === 'enemy') {
            this.processUBWTurn();
        }
        
        const enemyUnits = this.units.filter(u => u.data.team === 'enemy');
        enemyUnits.forEach(u => {
            u.data.acted = false;
            u.setAlpha(1);
            // 沉默回合递减
            if (u.data.silenced > 0) u.data.silenced--;
        });
        
        this.time.delayedCall(1000, () => this.selectNextUnit());
    }

    enemyAction() {
        if (!this.currentUnit || this.currentUnit.data.team !== 'enemy') return;
        
        // 简单AI：掷骰子
        this.diceResult = Phaser.Math.Between(1, 6);
        const effect = DICE_EFFECTS[this.diceResult];
        this.diceDisplay.setVisible(true);
        this.diceDisplay.setText(['⚀','⚁','⚂','⚃','⚄','⚅'][this.diceResult - 1]);
        this.diceResultText.setText(`敌人掷出 ${this.diceResult}: ${effect.name}`);
        
        this.time.delayedCall(500, () => {
            switch(effect.type) {
                case 'move':
                    this.enemyMove(this.currentUnit.data.moveRange + 2);
                    break;
                case 'attack':
                    this.enemyAttack();
                    break;
                case 'skill1':
                case 'skill2':
                case 'skill3':
                    const skillIndex = parseInt(effect.type.slice(-1)) - 1;
                    this.useSkillEnemy(skillIndex);
                    break;
                case 'charge':
                    this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + 30);
                    this.updateUnitBars(this.currentUnit);
                    this.finishAction();
                    break;
            }
        });
    }

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
    }

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
            // attack 函数会在动画完成后自动调用 finishAction
            this.attack(this.currentUnit, target);
        } else {
            this.actionText.setText('敌人没有可攻击的目标');
            this.finishAction();
        }
    }

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

    checkGameOver() {
        const players = this.units.filter(u => u.data.team === 'player');
        const enemies = this.units.filter(u => u.data.team === 'enemy');
        
        if (players.length === 0) {
            this.addLog('=== 玩家2 胜利! ===');
            audioManager.playVictory();
            this.showGameOver('玩家2 胜利!', 0xe74c3c);
            return true;
        } else if (enemies.length === 0) {
            this.addLog('=== 玩家1 胜利! ===');
            audioManager.playVictory();
            this.showGameOver('玩家1 胜利!', 0x2ecc71);
            return true;
        }
        return false;
    }

    showGameOver(text, color) {
        const overlay = this.add.rectangle(
            GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2,
            GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2,
            GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize,
            GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize,
            0x000000, 0.7
        );
        
        this.add.text(
            GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2,
            GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2,
            text,
            { fontSize: '72px', fill: '#' + color.toString(16), fontStyle: 'bold' }
        ).setOrigin(0.5);
        
        this.input.removeAllListeners();
    }
}
