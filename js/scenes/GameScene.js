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
        this.ubwBackground = null;
        this.ubwBackgroundIndex = null;
        this.initialState = null;
        this.fieldEffects = [];
        this.ambushTraps = [];
        // 在线模式
        this.onlineMode = false;
        this.myTeam = null;
        this.testMode = false;
        // 水月无影 - 时间停止
        this.timeStopTurns = 0;
        this.timeStopCaster = null;
        // 水月无影 - 千年城
        this.millenniumCastleActive = false;
        this.millenniumCastleTurns = 0;
        this.millenniumCastleCaster = null;
        this.millenniumCastleBg = null;
        this.millenniumCastleBurnMin = 10;
        this.millenniumCastleBurnMax = 20;
        this.millenniumCastleNpMin = 5;
        this.millenniumCastleNpMax = 15;
    }

    init(data) {
        // 完全重置所有状态
        this.selectedUnit = null;
        this.units = [];
        this.currentTurn = 'player';
        this.highlightTiles = [];
        this.diceResult = null;
        this.waitingForAction = false;
        this.turnIndex = 0;
        this.currentUnit = null;
        this.gameOver = false;
        this.confirmDialog = null;
        this.skillButtons = [];

        // UBW相关
        this.ubwActive = false;
        this.ubwOwner = null;
        this.ubwDuration = 0;
        this.ubwSwords = [];
        this.ubwBackground = null;
        this.ubwBackgroundIndex = null;
        this.initialState = null;
        this.fieldEffects = [];
        this.ambushTraps = [];

        // 在线模式
        this.onlineMode = false;
        this.myTeam = null;
        this.testMode = false;

        // 水月无影 - 时间停止
        this.timeStopTurns = 0;
        this.timeStopCaster = null;
        // 水月无影 - 千年城
        this.millenniumCastleActive = false;
        this.millenniumCastleTurns = 0;
        this.millenniumCastleCaster = null;
        this.millenniumCastleBg = null;
        this.millenniumCastleBurnMin = 10;
        this.millenniumCastleBurnMax = 20;
        this.millenniumCastleNpMin = 5;
        this.millenniumCastleNpMax = 15;
        
        if (data) {
            this.onlineMode = data.mode === 'online';
            this.testMode = data.mode === 'test';

            if (this.onlineMode && data.players) {
                const p1 = data.players.find(p => p.team === 'player');
                const p2 = data.players.find(p => p.team === 'enemy');
                this.player1Char = p1 ? p1.character : 'saber_artoria';
                this.player2Char = p2 ? p2.character : 'archer_emiya';
                this.myTeam = networkManager.myTeam;
                this.currentTurn = data.currentTurn || 'player';
                this.initialState = data.initialState || null;
            } else if (this.testMode) {
                this.player1Char = data.player1 || 'saber_artoria';
                this.player2Char = null;
            } else {
                this.player1Char = data.player1 || 'saber_artoria';
                this.player2Char = data.player2 || 'archer_emiya';
            }
        }
    }

    // 场景关闭前清理，防止Phaser销毁data时报错
    shutdown() {
        // 清理输入监听
        if (this.input) {
            this.input.removeAllListeners();
        }
        // 清理单位数据
        if (this.units) {
            this.units.forEach(u => { 
                if (u && u.data) u.data = null; 
            });
            this.units = [];
        }
        // 清理高亮
        if (this.highlightTiles) {
            this.highlightTiles.forEach(t => {
                if (t && t.highlight) t.highlight.destroy();
            });
            this.highlightTiles = [];
        }
        // 清理技能按钮
        if (this.skillButtons) {
            this.skillButtons.forEach(b => {
                if (b) b.destroy();
            });
            this.skillButtons = [];
        }
        // 清理UBW
        if (this.ubwSwords) {
            this.ubwSwords.forEach(s => {
                if (s && s.sprite) s.sprite.destroy();
            });
            this.ubwSwords = [];
        }
        if (this.fieldEffects) {
            this.fieldEffects.forEach(effect => {
                if (effect && effect.tile) effect.tile.destroy();
            });
            this.fieldEffects = [];
        }
        if (this.ambushTraps) {
            this.ambushTraps.forEach(trap => {
                if (trap && trap.sprite) trap.sprite.destroy();
            });
            this.ambushTraps = [];
        }
        if (this.ubwBackground) {
            this.ubwBackground.destroy();
            this.ubwBackground = null;
        }
        // 清理确认对话框
        if (this.confirmDialog) {
            this.confirmDialog.destroy();
            this.confirmDialog = null;
        }
        // 清理千年城背景
        if (this.millenniumCastleBg) {
            this.millenniumCastleBg.destroy();
            this.millenniumCastleBg = null;
        }
        // 清理测试模式按钮
        if (this._testBtns) {
            this._testBtns.forEach(b => { if (b.bg) b.bg.destroy(); if (b.text) b.text.destroy(); if (b.hit) b.hit.destroy(); });
            this._testBtns = null;
        }
        // 清理时间停止/千年城状态
        this.timeStopTurns = 0;
        this.timeStopCaster = null;
        this.millenniumCastleActive = false;
        this.millenniumCastleTurns = 0;
        this.millenniumCastleCaster = null;
    }

    preload() {
        // 加载所有角色头像
        for (const charId in CHARACTERS) {
            const char = CHARACTERS[charId];
            if (char.avatar) {
                this.load.image(charId, char.avatar);
            }
        }
        // 加载武器贴图（多种武器）
        this.load.image('weapon_0', 'assets/weapons/wuqi.png');
        this.load.image('weapon_1', 'assets/weapons/wuqi1.png');
        this.load.image('weapon_2', 'assets/weapons/wuqi2.png');
        this.load.image('weapon_3', 'assets/weapons/wuqi3.png');
        // 加载抠好图的武器（用于无限剑制动画）
        this.load.image('weapon_nobg_1', 'assets/characters/wuqi1-removebg-preview.png');
        this.load.image('weapon_nobg_2', 'assets/characters/wuqi2-removebg-preview.png');
        this.load.image('weapon_nobg_3', 'assets/characters/wuqi3-removebg-preview.png');
        // 加载瓷器贴图
        this.load.image('ciqi', 'assets/weapons/ciqi.png');
        // 加载抠好图的瓷器（从characters目录）
        this.load.image('ciqi_nobg', 'assets/characters/ciqi-removebg-preview.png');
        // 加载无限剑制背景
        this.load.image('ubw_bg_0', 'assets/ubw/OIP.png');
        this.load.image('ubw_bg_1', 'assets/ubw/OIP1.png');
        this.load.image('ubw_bg_2', 'assets/ubw/20170323124330_ikxMc.png');

        // 加载千年城背景
        this.load.image('millennium_castle_bg', 'assets/characters/millennium_castle_bg.png');
        // 加载水月无影技能视频
        this.load.video('skill_millennium_castle', ['assets/skills/mooncell_castle.mp4']);
        
        // 加载宝具视频（如果存在）
        const nobleChars = ['saber_artoria', 'archer_emiya', 'berserker_lancelot', 'caster_helewei', 'lancer_hanxin'];
        nobleChars.forEach(cid => {
            const path = 'assets/nobles/' + cid + '.mp4';
            this.load.video('noble_' + cid, [path, path.replace('.mp4', '.webm')]);
        });

        // 加载圆桌骑士图片
        this.load.image('knight_arthur', 'assets/characters/knight_arthur.png');
        this.load.image('knight_kay', 'assets/characters/knight_kay.png');
        this.load.image('knight_bedivere', 'assets/characters/knight_bedivere.png');
        this.load.image('knight_palamedes', 'assets/characters/knight_palamedes.png');
        this.load.image('knight_gaheris', 'assets/characters/knight_gaheris.png');
        this.load.image('knight_agravain', 'assets/characters/knight_agravain.png');
        this.load.image('knight_lancelot', 'assets/characters/knight_lancelot.png');
        this.load.image('knight_mordred', 'assets/characters/knight_mordred.png');
        this.load.image('knight_galahad', 'assets/characters/knight_galahad.png');
        this.load.image('knight_gawain', 'assets/characters/knight_gawain.png');
        this.load.image('knight_tristan', 'assets/characters/knight_tristan.png');
        this.load.image('knight_gareth', 'assets/characters/knight_gareth.png');
    }

    create() {
        console.log('GameScene create 开始');
        console.log('player1Char:', this.player1Char, 'player2Char:', this.player2Char);
        
        // 初始化音效
        audioManager.init();
        
        this.createMap();
        console.log('createMap 完成');
        
        this.createUnits();
        console.log('createUnits 完成, units:', this.units.length);
        
        this.createUI();
        console.log('createUI 完成');

        this.createDiceUI();
        console.log('createDiceUI 完成');

        this.createLogPanel();
        console.log('createLogPanel 完成');
        
        this.createTooltip();
        console.log('createTooltip 完成');

        this.createFxSystem();
        console.log('createFxSystem 完成');
        
        // 初始化回合
        if (this.onlineMode) {
            this.initOnlineBattleState();
            console.log('initOnlineBattleState 完成');
        } else {
            this.initFirstTurn();
            console.log('initFirstTurn 完成');
        }
        
        // 点击时启用音效（浏览器要求用户交互后才能播放音频）
        this.input.on('pointerdown', () => {
            audioManager.resume();
        });
        
        // 在线模式设置
        if (this.onlineMode) {
            console.log('在线模式启动, myTeam:', this.myTeam, 'currentTurn:', this.currentTurn);
            this.addLog(`你是: ${this.myTeam === 'player' ? '玩家1' : '玩家2'}`);
            this.setupOnlineCallbacks();
            this.updateOnlineTurnDisplay();
        }
        
        console.log('GameScene create 完成');
    }

    // --- Online sync methods: see gameSync.js ---
    // --- Visual FX methods: see gameFx.js ---
    // --- Enemy AI methods: see gameAI.js ---

    createMap() {
        this.map = [];
        const mapPixelW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const mapPixelH = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        const base = this.add.graphics().setDepth(-6);
        base.fillStyle(0x07101a, 1);
        base.fillRect(0, 0, mapPixelW, mapPixelH);
        base.lineStyle(2, C.gold, 0.16);
        base.strokeRect(1, 1, mapPixelW - 2, mapPixelH - 2);

        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const initialCell = this.initialState && this.initialState.mapTiles && this.initialState.mapTiles[y]
                    ? this.initialState.mapTiles[y][x]
                    : null;
                const seed = (x * 37 + y * 19 + x * y * 7) % 11;
                const isStone = seed === 0 || seed === 7;
                const grassPalette = [0x2f694f, 0x376f56, 0x2d5d49, 0x3f7659];
                const stonePalette = [0x5a5546, 0x69604c, 0x514c43];
                const color = initialCell ? initialCell.baseColor : (isStone ? stonePalette[seed % stonePalette.length] : grassPalette[seed % grassPalette.length]);
                const tile = this.add.rectangle(
                    x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    GAME_CONFIG.tileSize - 2,
                    GAME_CONFIG.tileSize - 2,
                    color
                );
                tile.setStrokeStyle(1, 0x101722, 0.82);
                tile.setDepth(-1);
                if (!initialCell && seed % 3 === 0) {
                    const mark = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2 + 8,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2 - 9,
                        18,
                        1,
                        0xffffff,
                        0.08
                    );
                    mark.rotation = (seed - 5) * 0.12;
                    mark.setDepth(0);
                }
                this.map[y][x] = {
                    tile,
                    x,
                    y,
                    baseColor: color,
                    walkable: initialCell ? initialCell.walkable !== false : true
                };
            }
        }
    }

    createUnits() {
        const mapWidth = GAME_CONFIG.mapWidth;
        const mapHeight = GAME_CONFIG.mapHeight;

        const initialUnits = this.initialState && this.initialState.units ? this.initialState.units : null;

        // 玩家1（左半边随机位置）
        const p1X = initialUnits && initialUnits.player ? initialUnits.player.x : Phaser.Math.Between(0, Math.floor(mapWidth / 2) - 1);
        const p1Y = initialUnits && initialUnits.player ? initialUnits.player.y : Phaser.Math.Between(0, mapHeight - 1);
        this.createUnit(p1X, p1Y, 'player', this.player1Char);

        // 玩家2（右半边随机位置，避开玩家1）
        let p2X, p2Y;
        if (initialUnits && initialUnits.enemy) {
            p2X = initialUnits.enemy.x;
            p2Y = initialUnits.enemy.y;
        } else {
            do {
                p2X = Phaser.Math.Between(Math.floor(mapWidth / 2), mapWidth - 1);
                p2Y = Phaser.Math.Between(0, mapHeight - 1);
            } while (p2X === p1X && p2Y === p1Y);
        }
        this.createUnit(p2X, p2Y, 'enemy', this.player2Char);
    }

    createUnit(x, y, team, charId) {
        const charData = CHARACTERS[charId];
        const classData = CLASS_CONFIG[charData.class];
        
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        let unit;
        let portraitH = 0; // 立绘实际显示高度
        // 如果有头像就用头像，否则用圆形
        if (charData.avatar && this.textures.exists(charId)) {
            const tex = this.textures.get(charId);
            const texW = tex.getSourceImage().width;
            const texH = tex.getSourceImage().height;
            const aspectRatio = texW / texH;
            // 竖版立绘（高>宽）：保持比例，加高显示，origin上调露出头部
            const displayW = GAME_CONFIG.tileSize - 6;
            const displayH = Math.min(displayW / (texW / texH), GAME_CONFIG.tileSize - 6);
            portraitH = displayH;
            unit = this.add.image(posX, posY, charId);
            unit.setDisplaySize(displayW, displayH);
        } else {
            unit = this.add.circle(posX, posY, GAME_CONFIG.tileSize / 3, classData.color);
        }
        unit.setDepth(8);

        // 边框（根据立绘高度调整）
        const borderH = portraitH > 0 ? portraitH + 12 : GAME_CONFIG.tileSize - 6;
        const borderY = posY;
        const border = this.add.rectangle(posX, borderY, GAME_CONFIG.tileSize - 6, borderH);
        border.setStrokeStyle(3, team === 'player' ? C.blue : C.red, 0.9);
        border.setFillStyle(0x000000, 0.08);
        border.setDepth(7);
        
        // HP条
        const hpBarBg = this.add.rectangle(posX, posY - 35, 52, 8, 0x101722, 0.95).setDepth(10);
        hpBarBg.setStrokeStyle(1, 0x000000, 0.55);
        const hpBar = this.add.rectangle(posX, posY - 35, 50, 6, C.green).setDepth(11);
        
        // 宝具条
        const npBarBg = this.add.rectangle(posX, posY - 26, 52, 6, 0x101722, 0.95).setDepth(10);
        npBarBg.setStrokeStyle(1, 0x000000, 0.45);
        const npBar = this.add.rectangle(posX - 25, posY - 26, 0, 4, C.gold2).setDepth(11);
        npBar.setOrigin(0, 0.5);
        
        // 护盾条
        const shieldBar = this.add.rectangle(posX - 25, posY - 42, 0, 4, C.blue).setDepth(11);
        shieldBar.setOrigin(0, 0.5);
        
        // 检查是否有多多益善被动（韩信）
        const hasUnlimitedPassive = charData.passive === 'duoduoyishan';
        
        unit.data = {
            x, y, team, charId,
            name: charData.name,
            className: classData.name,
            class: charData.class,
            hp: 100,
            maxHp: hasUnlimitedPassive ? Infinity : 100,
            np: 0,
            maxNp: hasUnlimitedPassive ? Infinity : 100,
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
            hasUnlimitedPassive,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border
        };

        // 待机浮动动画（竖版立绘不浮动，保持稳定）
        if (portraitH < GAME_CONFIG.tileSize * 1.5) {
            unit.data.idleTween = this.tweens.add({
                targets: [unit, border, hpBar, hpBarBg, npBar, npBarBg, shieldBar],
                y: '-=3',
                duration: 1800 + Math.random() * 600,
                yoyo: true, repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Math.random() * 800
            });
        }

        this.units.push(unit);
        return unit;
    }

    createUI() {
        const mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const sideX = mapW;
        const sideW = Math.max(176, W - mapW);
        this.sidePanelX = sideX + 8;
        this.sidePanelW = Math.max(160, sideW - 16);
        this.hpBarWidth = this.sidePanelW - 18;

        // 顶部栏
        const tg = this.add.graphics();
        tg.fillStyle(C.bg, 0.92); tg.fillRect(0, 0, mapW, 31);
        tg.fillStyle(C.gold, 0.12); tg.fillRect(0, 30, mapW, 1);
        tg.fillStyle(C.blue, 0.05); tg.fillRect(0, 0, mapW, 30);

        this.backBtn = this.add.text(10, 5, '← 返回', {
            fontSize: '11px', fill: colorHex(C.fg2), fontFamily: UI_FONT, fontStyle: 'bold'
        }).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.confirmBack())
            .on('pointerover', function() { this.setStyle({ fill: '#c8aa50' }); })
            .on('pointerout', function() { this.setStyle({ fill: colorHex(C.fg2) }); });

        this.turnIndicator = this.add.text(mapW / 2, 6, 'P L A Y E R   1   回 合', {
            fontSize: '12px', fill: colorHex(C.gold2), fontFamily: UI_FONT, fontStyle: 'bold', letterSpacing: 3
        }).setOrigin(0.5, 0);

        this.unitInfoText = this.add.text(mapW / 2, 19, '', {
            fontSize: '8px', fill: colorHex(C.fg3), fontFamily: UI_FONT
        }).setOrigin(0.5, 0);

        if (this.onlineMode && networkManager.roomCode) {
            this.roomCodeDisplay = this.add.text(mapW - 10, 5, '房间:' + networkManager.roomCode,
                { fontSize: '10px', fill: colorHex(C.green), fontFamily: UI_FONT }).setOrigin(1, 0);
        }

        // 右侧面板
        const rail = this.add.graphics();
        rail.fillStyle(0x070a12, 0.96);
        rail.fillRect(sideX, 0, sideW, H);
        rail.fillStyle(C.gold, 0.12);
        rail.fillRect(sideX, 0, 1, H);

        const rx = this.sidePanelX;
        const pg = this.add.graphics();
        drawPanel(pg, rx - 2, 38, this.sidePanelW + 4, 122, {
            fill: C.panel,
            alpha: 0.88,
            strokeAlpha: 0.18,
            accentAlpha: 0.08,
            radius: 6
        });

        addSectionLabel(this, rx + 2, 52, 'ACTIVE UNIT', C.gold2);
        this._unitNameText = this.add.text(rx + 2, 62, '', {
            fontSize: '12px', fill: colorHex(C.fg), fontFamily: UI_FONT, fontStyle: 'bold',
            wordWrap: { width: this.sidePanelW - 12 }
        });
        this.hpBarBg = this.add.rectangle(rx + 2, 86, this.hpBarWidth, 8, C.barBg).setOrigin(0, 0.5).setVisible(false);
        this.hpBarFill = this.add.rectangle(rx + 2, 86, this.hpBarWidth, 8, C.red).setOrigin(0, 0.5).setVisible(false);
        this.hpText = this.add.text(rx + 5, 86, '', { fontSize: '8px', fill: '#fff', fontFamily: UI_FONT, fontStyle: 'bold' }).setOrigin(0, 0.5);
        this.npBarBg = this.add.rectangle(rx + 2, 102, this.hpBarWidth, 6, C.barBg).setOrigin(0, 0.5).setVisible(false);
        this.npBarFill = this.add.rectangle(rx + 2, 102, this.hpBarWidth, 6, C.blue).setOrigin(0, 0.5).setVisible(false);
        this.npText = this.add.text(rx + 5, 102, '', { fontSize: '8px', fill: '#fff', fontFamily: UI_FONT, fontStyle: 'bold' }).setOrigin(0, 0.5);
        this.nobleNameText = this.add.text(rx + 2, 118, '', {
            fontSize: '9px', fill: colorHex(C.purple), fontFamily: UI_FONT,
            wordWrap: { width: this.sidePanelW - 12 }
        });
        this.actionText = this.add.text(rx + 2, 136, '', {
            fontSize: '10px', fill: colorHex(C.gold2), fontFamily: UI_FONT,
            wordWrap: { width: this.sidePanelW - 12 }
        });
        this.turnText = this.add.text(0, 0, '', { fontSize: '1px', fill: '#000' });
    }

    // 更新右侧 HP/NP 进度条
    updateUnitBars(unit) {
        if (!unit || !unit.data) {
            this.hpBarBg.setVisible(false);
            this.hpBarFill.setVisible(false);
            this.npBarBg.setVisible(false);
            this.npBarFill.setVisible(false);
            this.hpText.setText('');
            this.npText.setText('');
            this.nobleNameText.setText('');
            if (this._unitNameText) this._unitNameText.setText('');
            return;
        }

        const d = unit.data;
        const hp = d.hp || 0;
        const maxHp = isFinite(d.maxHp) ? d.maxHp : 999;
        const np = d.np || 0;
        const maxNp = isFinite(d.maxNp) ? d.maxNp : 999;
        const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
        const npRatio = Math.max(0, Math.min(1, np / maxNp));

        this.hpBarBg.setVisible(true);
        this.hpBarFill.setVisible(true);
        this.npBarBg.setVisible(true);
        this.npBarFill.setVisible(true);

        // 单位名
        if (this._unitNameText) {
            this._unitNameText.setText(d.name + ' [' + d.className + ']');
        }

        // HP 颜色: 绿>60% 橙>30% 红<30%
        let hpColor = 0xe74c3c;
        if (hpRatio > 0.6) hpColor = 0x2ecc71;
        else if (hpRatio > 0.3) hpColor = 0xe89829;

        this.hpBarFill.setFillStyle(hpColor);
        this.hpBarFill.setScale(hpRatio, 1);
        this.hpText.setText(`${hp}${!isFinite(d.maxHp) ? '' : '/' + maxHp}`);

        this.npBarFill.setFillStyle(npRatio >= 0.99 ? 0xf0c040 : 0x4a90d9);
        this.npBarFill.setScale(npRatio, 1);
        this.npText.setText(`${np}${!isFinite(d.maxNp) ? '' : '/' + maxNp}`);

        if (this.hpBarWidth) {
            this.hpBarBg.width = this.hpBarWidth;
            this.npBarBg.width = this.hpBarWidth;
            this.hpBarFill.width = this.hpBarWidth;
            this.npBarFill.width = this.hpBarWidth;
        }

        if (d.noble && d.noble.name) {
            this.nobleNameText.setText('宝具: ' + d.noble.name);
        }
    }

    // 华丽按钮 — 保留 .label API
    createStyledButton(x, y, text, bgColor, textColor, callback, width, height) {
        width = width || 90; height = height || 34;
        const hw = width / 2, hh = height / 2;

        const glow = this.add.rectangle(x, y, width + 4, height + 4, C.gold, 0.03);
        glow.setStrokeStyle(1, C.gold, 0.05);

        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(C.bg2, 0.9); bgGfx.fillRoundedRect(x - hw, y - hh, width, height, 6);
        bgGfx.fillStyle(C.gold, 0.08); bgGfx.fillRoundedRect(x - hw + 1, y - hh + 1, width - 2, 14, 6);

        const border = this.add.graphics();
        border.lineStyle(1, C.gold, 0.16); border.strokeRoundedRect(x - hw, y - hh, width, height, 6);

        const bar = this.add.rectangle(x - hw + 2, y, 2, height - 14, bgColor, 0.3);
        const label = this.add.text(x, y, text, {
            fontSize: '12px', fill: textColor || colorHex(C.fg), fontStyle: 'bold', fontFamily: UI_FONT
        }).setOrigin(0, 0.5);
        label.x = x - label.width / 2;

        const hit = this.add.rectangle(x, y, width, height, 0xffffff, 0).setInteractive({ useHandCursor: true });

        hit.on('pointerover', () => {
            bgGfx.clear(); bgGfx.fillStyle(C.panel2, 0.96); bgGfx.fillRoundedRect(x - hw, y - hh, width, height, 6);
            bgGfx.fillStyle(bgColor, 0.24); bgGfx.fillRoundedRect(x - hw + 1, y - hh + 1, width - 2, 14, 6);
            border.clear(); border.lineStyle(1.5, C.gold, 0.35); border.strokeRoundedRect(x - hw, y - hh, width, height, 6);
            bar.setFillStyle(bgColor, 0.8); glow.setFillStyle(C.gold, 0.08);
            label.setStyle({ fill: '#e0d5b0' });
        });
        hit.on('pointerout', () => {
            bgGfx.clear(); bgGfx.fillStyle(C.bg2, 0.9); bgGfx.fillRoundedRect(x - hw, y - hh, width, height, 6);
            bgGfx.fillStyle(C.gold, 0.08); bgGfx.fillRoundedRect(x - hw + 1, y - hh + 1, width - 2, 14, 6);
            border.clear(); border.lineStyle(1, C.gold, 0.16); border.strokeRoundedRect(x - hw, y - hh, width, height, 6);
            bar.setFillStyle(bgColor, 0.3); glow.setFillStyle(C.gold, 0.03);
            label.setStyle({ fill: textColor || colorHex(C.fg) });
        });
        hit.on('pointerdown', () => { bgGfx.clear(); bgGfx.fillStyle(bgColor, 0.16); bgGfx.fillRoundedRect(x - hw, y - hh, width, height, 6); this.time.delayedCall(80, callback); });

        return {
            label, bgGfx, border, bar, glow, hit,
            setVisible(v) { bgGfx.setVisible(v); border.setVisible(v); bar.setVisible(v); label.setVisible(v); glow.setVisible(v); hit.setVisible(v); },
            setDepth(d) { bgGfx.setDepth(d); border.setDepth(d); bar.setDepth(d); label.setDepth(d); glow.setDepth(d); hit.setDepth(d); },
            destroy() { bgGfx.destroy(); border.destroy(); bar.destroy(); label.destroy(); glow.destroy(); hit.destroy(); }
        };
    }

    createDiceUI() {
        const H = this.cameras.main.height, mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const barH = 48, barY = H - barH;

        const bg = this.add.graphics();
        bg.fillStyle(C.bg, 0.92); bg.fillRect(0, barY, mapW, barH);
        bg.fillStyle(C.gold, 0.06); bg.fillRect(0, barY, mapW, 1);

        const btnW = 84, btnH = 30, gap = 10, cy = barY + barH / 2;
        const n = 5, totalW = n * btnW + (n - 1) * gap, sx = (mapW - totalW) / 2 + btnW / 2;

        this.moveBtn = this.createStyledButton(sx, cy, '移动', C.green, '#' + C.fg.toString(16).padStart(6, '0'), () => this.startMoveAction(), btnW, btnH);
        this.rollBtn = this.createStyledButton(sx + (btnW + gap), cy, '随机', C.blue, '#' + C.fg.toString(16).padStart(6, '0'), () => this.rollDice(), btnW, btnH);
        this.nobleBtn = this.createStyledButton(sx + (btnW + gap) * 2, cy, '宝具', C.purple, '#' + C.fg.toString(16).padStart(6, '0'), () => this.useNoble(), btnW, btnH);
        this.berserkBtn = this.createStyledButton(sx + (btnW + gap) * 3, cy, '狂化', C.red, '#' + C.fg.toString(16).padStart(6, '0'), () => this.useBerserkAttack(), btnW, btnH);
        this.berserkBtn.setVisible(false);
        this.endTurnBtn = this.createStyledButton(sx + (btnW + gap) * 4, cy, '结束', C.fg3, '#' + C.fg2.toString(16).padStart(6, '0'), () => this.endTurn(), btnW, btnH);

        this.diceDisplay = this.add.text(0, 0, '', { fontSize: '1px', fill: '#000' });
        this.diceResultText = this.add.text(0, 0, '', { fontSize: '1px', fill: '#000' });
    }
    
    confirmBack() {
        // 显示游戏内确认对话框
        if (this.confirmDialog) return; // 防止重复打开
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const scene = this; // 保存场景引用
        
        this.confirmDialog = this.add.container(0, 0);
        this.confirmDialog.setDepth(300);
        
        // 半透明背景
        const overlay = this.add.rectangle(centerX, centerY, 
            this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7);
        this.confirmDialog.add(overlay);
        
        // 对话框背景
        const dialogBg = this.add.rectangle(centerX, centerY, 280, 120, 0x2a2a3e)
            .setStrokeStyle(2, 0xf1c40f);
        this.confirmDialog.add(dialogBg);
        
        // 提示文字
        const text = this.add.text(centerX, centerY - 25, '确定要返回大厅吗？\n当前游戏进度将丢失', 
            { fontSize: '14px', fill: '#fff', align: 'center' }).setOrigin(0.5);
        this.confirmDialog.add(text);
        
        // 确认按钮
        const yesBtn = this.add.text(centerX - 50, centerY + 30, '[ 确定 ]', 
            { fontSize: '16px', fill: '#2ecc71' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                // 清理并切换场景
                scene.confirmDialog.destroy();
                scene.confirmDialog = null;
                scene.gameOver = true;
                scene.input.removeAllListeners();
                // 清理单位数据
                if (scene.units) {
                    scene.units.forEach(u => { if (u && u.data) u.data = null; });
                }
                if (scene.onlineMode) {
                    networkManager.disconnect();
                }
                scene.scene.start('LobbyScene');
            })
            .on('pointerover', () => yesBtn.setStyle({ fill: '#58d68d' }))
            .on('pointerout', () => yesBtn.setStyle({ fill: '#2ecc71' }));
        this.confirmDialog.add(yesBtn);
        
        // 取消按钮
        const noBtn = this.add.text(centerX + 50, centerY + 30, '[ 取消 ]', 
            { fontSize: '16px', fill: '#e74c3c' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                scene.confirmDialog.destroy();
                scene.confirmDialog = null;
            })
            .on('pointerover', () => noBtn.setStyle({ fill: '#ec7063' }))
            .on('pointerout', () => noBtn.setStyle({ fill: '#e74c3c' }));
        this.confirmDialog.add(noBtn);
    }

    updateBerserkButton() {
        if (!this.berserkBtn) return;
        if (this.currentUnit && this.currentUnit.data.berserkAttack) {
            this.berserkBtn.setVisible(true);
            this.berserkBtn.label.setStyle({ fill: '#e74c3c' });
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
        
        // 检查定身状态
        if (this.currentUnit.data.rooted && this.currentUnit.data.rooted > 0) {
            this.actionText.setText('被定身，无法移动!');
            this.addLog(`${this.currentUnit.data.name} 被定身，无法移动!`);
            return;
        }
        
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
                this.finishAction();
            } else {
                this.setupMoveInputAndFinish();
            }
        });
    }

    createLogPanel() {
        const mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const logX = mapW + 8;
        const logY = 170;
        const logWidth = Math.max(166, W - mapW - 16);
        const logHeight = H - logY - 14;
        this.logPanelMetrics = { logX, logY, logWidth, logHeight };
        this.logTextWidth = logWidth - 28;
        
        // 日志背景
        this.logBg = createPanel(this, logX, logY, logWidth, logHeight, {
            fill: C.panel,
            alpha: 0.86,
            strokeAlpha: 0.16,
            accentAlpha: 0.06,
            radius: 6
        });
        
        // 标题
        this.add.text(logX + 10, logY + 12, '战斗日志', {
            fontSize: '13px',
            fill: colorHex(C.gold2),
            fontFamily: UI_FONT,
            fontStyle: 'bold'
        });
        this.add.text(logX + logWidth - 12, logY + 13, 'SCROLL', {
            fontSize: '8px',
            fill: colorHex(C.fg3),
            fontFamily: TITLE_FONT,
            letterSpacing: 2
        }).setOrigin(1, 0);
        
        // 日志数据
        this.logMessages = [];
        this.logScrollOffset = 0;
        this.maxVisibleLogs = Math.max(5, Math.floor((logHeight - 52) / 38));
        this.logLineHeight = 38;
        
        // 创建遮罩区域
        const maskGraphics = this.make.graphics();
        maskGraphics.fillRect(logX + 8, logY + 38, logWidth - 22, logHeight - 48);
        const mask = maskGraphics.createGeometryMask();
        
        // 日志容器
        this.logContainer = this.add.container(logX + 10, logY + 42);
        this.logContainer.setMask(mask);
        
        // 预创建日志文本对象
        this.logTexts = [];
        for (let i = 0; i < 50; i++) {
            const text = this.add.text(0, i * this.logLineHeight, '', { 
                fontSize: '11px', 
                fill: colorHex(C.fg2),
                fontFamily: UI_FONT,
                wordWrap: { width: this.logTextWidth },
                lineSpacing: 2
            });
            this.logContainer.add(text);
            this.logTexts.push(text);
        }
        
        // 滚动条背景
        this.scrollBarBg = this.add.rectangle(logX + logWidth - 9, logY + logHeight / 2 + 12, 5, logHeight - 58, 0x0a0f1a, 0.9);
        
        // 滚动条
        this.scrollBar = this.add.rectangle(logX + logWidth - 9, logY + 48, 4, 48, C.gold, 0.5);
        
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
        const metrics = this.logPanelMetrics || {
            logX: GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + 8,
            logY: 170,
            logWidth: 176,
            logHeight: 350
        };
        const logY = metrics.logY;
        const logHeight = metrics.logHeight;
        
        const totalLogs = this.logMessages.length;
        const maxScroll = Math.max(1, totalLogs - this.maxVisibleLogs);
        const scrollPercent = this.logScrollOffset / maxScroll;
        
        const trackHeight = logHeight - 62;
        const barHeight = Math.max(30, trackHeight * (this.maxVisibleLogs / Math.max(totalLogs, this.maxVisibleLogs)));
        
        this.scrollBar.setSize(4, barHeight);
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
                    this.logTexts[i].setStyle({ fill: colorHex(C.gold2), fontSize: '11px', fontFamily: UI_FONT, wordWrap: { width: this.logTextWidth } });
                } else if (msg.includes('胜利')) {
                    this.logTexts[i].setStyle({ fill: colorHex(C.green), fontSize: '11px', fontFamily: UI_FONT, wordWrap: { width: this.logTextWidth } });
                } else if (msg.includes('死亡') || msg.includes('击败')) {
                    this.logTexts[i].setStyle({ fill: colorHex(C.red), fontSize: '11px', fontFamily: UI_FONT, wordWrap: { width: this.logTextWidth } });
                } else if (msg.includes('伤害')) {
                    this.logTexts[i].setStyle({ fill: colorHex(C.orange), fontSize: '11px', fontFamily: UI_FONT, wordWrap: { width: this.logTextWidth } });
                } else if (msg.includes('恢复') || msg.includes('护盾')) {
                    this.logTexts[i].setStyle({ fill: colorHex(C.blue), fontSize: '11px', fontFamily: UI_FONT, wordWrap: { width: this.logTextWidth } });
                } else if (msg.includes('随机决定')) {
                    this.logTexts[i].setStyle({ fill: colorHex(C.purple), fontSize: '11px', fontFamily: UI_FONT, wordWrap: { width: this.logTextWidth } });
                } else {
                    this.logTexts[i].setStyle({ fill: colorHex(C.fg2), fontSize: '11px', fontFamily: UI_FONT, wordWrap: { width: this.logTextWidth } });
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
        
        // 监听鼠标移动（PC端）
        this.input.on('pointermove', (pointer) => {
            this.handleTooltip(pointer);
        });
        
        // 长按显示tooltip（移动端）
        this.tooltipTimer = null;
        this.input.on('pointerdown', (pointer) => {
            // 清除之前的计时器
            if (this.tooltipTimer) {
                clearTimeout(this.tooltipTimer);
            }
            // 300ms后显示tooltip
            this.tooltipTimer = setTimeout(() => {
                this.handleTooltip(pointer);
            }, 300);
        });
        
        this.input.on('pointerup', () => {
            // 松开时隐藏tooltip
            if (this.tooltipTimer) {
                clearTimeout(this.tooltipTimer);
                this.tooltipTimer = null;
            }
            this.tooltip.setVisible(false);
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
        text += `━━━━━━━━━━━━━━━━\n`;
        text += `职阶: ${d.className}  移动: ${d.moveRange}  射程: ${d.attackRange}\n`;
        text += `HP: ${d.hp}/${d.maxHp}`;
        if (d.shield > 0) text += `  护盾: ${d.shield}`;
        text += `\n`;
        text += `NP: ${d.np}/${d.maxNp}  随机: ${d.diceCount}~${d.diceCount * 6}\n`;
        
        // 技能详情
        text += `\n【技能】\n`;
        d.skills.forEach((skill, i) => {
            text += `${i+1}. ${skill.name}\n`;
            text += `   ${skill.desc}\n`;
        });
        
        // 宝具
        text += `\n【宝具】${d.noble.name}\n`;
        text += `   ${d.noble.desc}\n`;
        
        // 职阶技能
        text += `\n【职阶技能】${classSkill.name}\n`;
        text += `   ${classSkill.desc}\n`;
        
        // 增益状态
        let buffs = [];
        if (d.roAiasCount > 0) buffs.push(`七重圆环 ${d.roAiasCount}/7层 (护盾累计)`);
        if (d.nobleImmune) buffs.push(`宝具免疫 (免疫一次宝具伤害)`);
        if (d.projectedWeapon) buffs.push(`投影武器 (+${d.projectionBonus || 0}伤害)`);
        if (d.burstMode > 0) buffs.push(`魔力放出 ${d.burstMode}次 (范围+${d.burstRangeBonus || 0}, 伤害+${d.burstAtkBonus || 0})`);
        if (d.avalonCounter && d.avalonCounter > 0) buffs.push(`阿瓦隆 ${d.avalonCounter}次 (受伤回复HP和NP)`);
        if (d.critNext || d.doubleDamage) buffs.push(`暴击准备 (下次攻击伤害×1.5)`);
        if (d.gutsCount > 0) buffs.push(`战斗续行 ${d.gutsCount}次 (致命伤害保留1HP)`);
        else if (d.guts) buffs.push(`战斗续行 1次 (致命伤害保留1HP)`);
        if (d.lastStandBonus > 0) buffs.push(`背水一战 攻击+${d.lastStandBonus}`);
        if (d.evade) buffs.push(`闪避 (免疫下次攻击)`);
        if (d.magicImmune) buffs.push(`对魔力 (免疫下次技能伤害)`);
        if (d.dogLightActions > 0) buffs.push(`额外行动 ${d.dogLightActions}次`);
        if (d.extraAction) buffs.push(`单独行动 (再行动一次)`);
        if (d.forAllOne > 0) buffs.push(`骑士不留名 ${d.forAllOne}回合 (免疫技能伤害+暴击+再移动)`);
        if (d.arondightActive) buffs.push(`阿隆戴特 (反弹30%+3~18NP, 攻击+10)`);
        if (d.stolenNoble) buffs.push(`夺取宝具: ${d.stolenNoble.noble.name} (${d.stolenNoble.turnsLeft}回合)`);
        if (d.roundTableOaths && d.roundTableOaths.length > 0) {
            const knights = d.roundTableOaths.map(o => o.knight).join('、');
            buffs.push(`圆桌誓约: ${knights}`);
        }
        if (buffs.length > 0) {
            text += `\n【增益状态】\n`;
            buffs.forEach(b => text += `✦ ${b}\n`);
        }
        
        // 减益状态
        let debuffs = [];
        if (d.porcelainEntity) debuffs.push(`瓷器 ${d.porcelainEntity.damage}/100 (吸收伤害)`);
        if (d.heleweiBurst && d.heleweiBurst.forcedAttacks > 0) debuffs.push(`强制攻击 ${d.heleweiBurst.forcedAttacks}次 (只能普攻+中毒+减速)`);
        if (d.roseMark) debuffs.push(`玫瑰标记 ${d.roseMark.turns || '?'}回合 (玫瑰剑士伤害+50%)`);
        if (d.poison) debuffs.push(`中毒 ${d.poison.turns}回合 (每回合${d.poison.damage}伤害)`);
        if (d.burn) debuffs.push(`灼烧 ${d.burn.turns}回合 (每回合${d.burn.damage}伤害)`);
        if (d.slow) debuffs.push(`减速 ${d.slow.turns || '?'}回合 (移动-${d.slow.amount})`);
        if (d.silenced > 0) debuffs.push(`沉默 ${d.silenced}回合 (无法使用技能)`);
        if (d.nobleSeal > 0) debuffs.push(`宝具封印 ${d.nobleSeal}回合 (无法使用宝具)`);
        if (d.sealedSkills) {
            const sealed = Object.entries(d.sealedSkills).filter(([k, v]) => v > 0);
            sealed.forEach(([k, v]) => debuffs.push(`技能${parseInt(k)+1}封锁 ${v}回合`));
        }
        
        if (debuffs.length > 0) {
            text += `\n【减益状态】\n`;
            debuffs.forEach(b => text += `✧ ${b}\n`);
        }
        
        this.tooltipText.setText(text);
        
        // 调整背景大小
        const bounds = this.tooltipText.getBounds();
        this.tooltipBg.setSize(Math.max(280, bounds.width + 20), bounds.height + 20);
        
        // 调整位置，避免挡住角色
        const gameWidth = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + 250;
        const gameHeight = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize + 150;
        const tooltipWidth = bounds.width + 30;
        const tooltipHeight = bounds.height + 30;
        
        // 优先显示在右侧，如果右侧空间不够则显示在左侧
        let tooltipX, tooltipY;
        
        if (x + 30 + tooltipWidth < gameWidth) {
            // 右侧有空间，显示在右侧
            tooltipX = x + 30;
        } else {
            // 右侧空间不够，显示在左侧
            tooltipX = x - tooltipWidth - 10;
        }
        
        // 垂直方向：优先显示在下方，如果下方空间不够则显示在上方
        if (y + tooltipHeight < gameHeight) {
            tooltipY = y;
        } else {
            tooltipY = gameHeight - tooltipHeight - 10;
        }
        
        // 确保不超出屏幕边界
        tooltipX = Math.max(5, Math.min(tooltipX, gameWidth - tooltipWidth - 5));
        tooltipY = Math.max(5, Math.min(tooltipY, gameHeight - tooltipHeight - 5));
        
        this.tooltip.setPosition(tooltipX, tooltipY);
        this.tooltip.setVisible(true);
    }

    // 游戏开始时的初始化
    // ================================================================
    // 测试模式初始化
    // ================================================================
    initTestMode() {
        this.testUnit = this.units.find(u => u.data.team === 'player');
        this.dummyTarget = this.units.find(u => u.data.team === 'enemy');

        // 隐藏回合 UI
        this.turnText.setText('技能测试模式');
        this.turnIndicator.setText('🧪 TEST');

        this.addLog('=== 技能测试模式 ===');
        this.addLog(`测试角色: ${this.testUnit.data.name}`);
        this.addLog('直接点击右侧技能按钮测试');

        // 创建直接技能按钮
        this.createTestSkillButtons();

        // 选中测试单位
        this.selectUnit(this.testUnit);
        this.actionText.setText('选择技能进行测试');
    }

    createTestSkillButtons() {
        if (!this.testUnit) return;
        const d = this.testUnit.data;
        const mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const H = this.cameras.main.height;
        const barH = 48, barY = H - barH;

        // 底部栏背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1e, 0.95); bg.fillRect(0, barY, mapW, barH);
        bg.fillStyle(C.gold, 0.1); bg.fillRect(0, barY, mapW, 1);

        // 简易文字按钮
        const skillNames = d.skills.map((s, i) => `${i + 1}.${s.name.length > 4 ? s.name.slice(0, 4) + '…' : s.name}`);
        const labels = [...skillNames, '移动', '攻击', '宝具', '结束', '重置'];
        const colors = [0xe74c3c, 0xf39c12, 0x9b59b6, 0x2ecc71, 0xff6b6b, 0xf0c040, 0x3498db, 0x607d8b];
        const n = labels.length;
        const gap = 6;
        const btnW = Math.floor((mapW - (n + 1) * gap) / n);
        const totalW = n * btnW + (n - 1) * gap;
        const startX = (mapW - totalW) / 2;

        this._testBtns = [];

        for (let i = 0; i < n; i++) {
            const bx = startX + i * (btnW + gap);
            const by = barY + 8;
            // 按钮背景
            const btnBg = this.add.rectangle(bx + btnW / 2, barY + 24, btnW, 30, colors[i] || 0x555555, 0.75);
            btnBg.setStrokeStyle(1, 0xffffff, 0.2);
            // 按钮文字
            const btnText = this.add.text(bx + btnW / 2, barY + 24, labels[i], {
                fontSize: '11px', fill: '#fff', fontFamily: UI_FONT, fontStyle: 'bold'
            }).setOrigin(0.5);
            // 透明点击区域
            const hit = this.add.rectangle(bx + btnW / 2, barY + 24, btnW, 30, 0xffffff, 0.001);
            hit.setInteractive({ useHandCursor: true });

            // 用 IIFE 绑定回调
            const cb = this._makeTestCallback(i, d);
            hit.on('pointerover', () => { btnBg.setFillStyle(0xffffff, 0.3); });
            hit.on('pointerout', () => { btnBg.setFillStyle(colors[i] || 0x555555, 0.75); });
            hit.on('pointerdown', () => { btnBg.setFillStyle(0xffffff, 0.45); cb(); });

            this._testBtns.push({ bg: btnBg, text: btnText, hit });
        }

        this.diceDisplay = this.add.text(0, 0, '', { fontSize: '1px' });
        this.diceResultText = this.add.text(0, 0, '', { fontSize: '1px' });

        this.testStatusText = this.add.text(8, barY + 28, '', {
            fontSize: '9px', fill: colorHex(C.gold2), fontFamily: UI_FONT
        });
        this.updateTestStatus();
    }

    _makeTestCallback(index, d) {
        const scene = this;
        const skillCount = d.skills.length;
        if (index < skillCount) {
            return () => { scene.selectUnit(scene.testUnit); scene.executeSkill(index); };
        }
        const actionIndex = index - skillCount;
        switch (actionIndex) {
            case 0: return () => { scene.selectUnit(scene.testUnit); scene.startMoveAction(); };
            case 1: return () => { scene.selectUnit(scene.testUnit); scene.showAttackRange(scene.testUnit); scene.setupAttackInput(); };
            case 2: return () => { scene.selectUnit(scene.testUnit); scene.useNoble(); };
            case 3: return () => { scene.testEndTurn(); };
            case 4: return () => { scene.resetTestUnit(); };
            default: return () => {};
        }
    }

    updateTestStatus() {
        if (!this.testUnit || !this.testUnit.data || !this.testStatusText) return;
        const d = this.testUnit.data;
        const turnName = this.currentTurn === 'player' ? '你的回合' : '敌方回合';
        this.testStatusText.setText(`${turnName}  HP:${d.hp}  NP:${d.np}  攻击+${d.atkBuff || 0}  护盾:${d.shield || 0}`);
    }

    testEndTurn() {
        if (this.currentTurn !== 'player') return;

        // 标记所有玩家单位已行动
        this.units.filter(u => u.data.team === 'player').forEach(u => {
            u.data.acted = true;
            u.setAlpha(0.5);
        });

        this.addLog('--- 你的回合结束 ---');

        // 处理千年城
        this.processMillenniumCastle('player');
        // 处理宝具分身退场
        this.processNobleClones();
        // 时间停止递减
        if (this.timeStopTurns > 0) {
            this.timeStopTurns--;
            if (this.timeStopTurns <= 0) {
                this.addLog('时间重新开始流动');
                this.timeStopCaster = null;
            }
        }

        // 切换到敌方回合
        this.currentTurn = 'enemy';
        this.updateTestStatus();
        this.showTurnBanner('敌方回合');
        this.addLog('--- 敌方回合 ---');

        // 处理灼烧等效果
        this.processBurnDamage('enemy');

        // 重置敌方单位
        const enemyUnits = this.units.filter(u => u.data.team === 'enemy');
        enemyUnits.forEach(u => {
            u.data.acted = false;
            u.setAlpha(1);
            if (u.data.silenced > 0) u.data.silenced--;
            if (u.data.nobleSeal > 0) {
                u.data.nobleSeal--;
                if (u.data.nobleSeal <= 0) this.addLog(`${u.data.name} 宝具封印解除`);
            }
            if (u.data.rooted > 0) {
                u.data.rooted--;
                if (u.data.rooted <= 0) this.addLog(`${u.data.name} 定身效果解除`);
            }
        });

        // 假人简单行动后自动结束
        const scene = this;
        this.time.delayedCall(1200, () => {
            if (scene.gameOver) return;
            // 假人尝试攻击玩家
            const dummy = scene.dummyTarget;
            const player = scene.testUnit;
            if (dummy && player && dummy.data && player.data && dummy.data.hp > 0 && player.data.hp > 0) {
                const dist = Math.abs(dummy.data.x - player.data.x) + Math.abs(dummy.data.y - player.data.y);
                if (dist <= dummy.data.attackRange) {
                    // 普攻
                    const dmg = BattleCore.rollFate(dummy.data.diceCount);
                    scene.addLog(`${dummy.data.name} 攻击造成 ${dmg} 伤害`);
                    scene.dealDamage(player, dmg, 'attack');
                    scene.showDamageNumber(player, dmg);
                    scene.createRadialBurstAt(player.x, player.y, 0xff6b6b, 30, 6, 600);
                } else {
                    // 尝试靠近玩家
                    const dx = Math.sign(player.data.x - dummy.data.x);
                    const dy = Math.sign(player.data.y - dummy.data.y);
                    const newX = dummy.data.x + dx;
                    const newY = dummy.data.y + dy;
                    if (newX >= 0 && newX < GAME_CONFIG.mapWidth && newY >= 0 && newY < GAME_CONFIG.mapHeight &&
                        !scene.getUnitAt(newX, newY) && scene.map[newY][newX].walkable) {
                        scene.moveUnit(dummy, newX, newY);
                        scene.addLog(`${dummy.data.name} 向你靠近`);
                    } else {
                        scene.addLog(`${dummy.data.name} 原地待机`);
                    }
                }
            }

            // 敌方回合结束
            scene.time.delayedCall(800, () => {
                enemyUnits.forEach(u => { u.data.acted = true; u.setAlpha(0.5); });
                scene.currentTurn = 'player';
                scene.addLog('--- 你的回合 ---');
                scene.showTurnBanner('你的回合');

                // 重置玩家单位
                const playerUnits = scene.units.filter(u => u.data.team === 'player');
                playerUnits.forEach(u => {
                    u.data.acted = false;
                    u.setAlpha(1);
                    if (u.data.silenced > 0) u.data.silenced--;
                    if (u.data.nobleSeal > 0) {
                        u.data.nobleSeal--;
                        if (u.data.nobleSeal <= 0) scene.addLog(`${u.data.name} 宝具封印解除`);
                    }
                    if (u.data.rooted > 0) {
                        u.data.rooted--;
                        if (u.data.rooted <= 0) scene.addLog(`${u.data.name} 定身效果解除`);
                    }
                    if (u.data.forAllOne > 0) {
                        u.data.forAllOne--;
                        if (u.data.forAllOne <= 0) scene.addLog(`${u.data.name} 隐身效果结束`);
                    }
                });

                // 处理玩家侧的 burn 和千年城
                scene.processBurnDamage('player');
                scene.processMillenniumCastle('player');
                scene.processNobleClones();
                if (scene.timeStopTurns > 0) {
                    scene.timeStopTurns--;
                    if (scene.timeStopTurns <= 0) {
                        scene.addLog('时间重新开始流动');
                        scene.timeStopCaster = null;
                    }
                }

                scene.updateTestStatus();
                scene.selectUnit(scene.testUnit);
            });
        });
    }

    resetTestUnit() {
        if (!this.testUnit || !this.testUnit.data) return;
        const d = this.testUnit.data;
        d.hp = d.maxHp === Infinity ? 999 : (d.maxHp || 100);
        d.np = 100;
        d.shield = 0;
        d.atkBuff = 0;
        d.extraDice = 0;
        d.buffs = [];
        d.burstMode = 0;
        d.burstAtkBonus = 0;
        d.burstRangeBonus = 0;
        d.silenced = 0;
        d.doubleDamage = false;
        d.guts = false;
        d.acted = false;
        d.isClone = false;
        d.nobleSeal = 0;
        d.rooted = 0;
        d.burn = null;
        this.updateUnitBars(this.testUnit);
        this.updateTestStatus();
        this.addLog('=== 状态已重置 ===');
        this.actionText.setText('状态已重置，NP已充满');
    }

    initFirstTurn() {
        this.currentTurn = 'player';
        this.turnText.setText('当前回合: 玩家1');
        this.turnIndicator.setText('⚡ 玩家1 回合');
        this.addLog('--- 玩家1 回合 ---');
        
        // 显示横幅
        this.showTurnBanner('玩家1 回合');
        
        // 重置玩家1单位状态
        const playerUnits = this.units.filter(u => u.data.team === 'player');
        playerUnits.forEach(u => {
            u.data.acted = false;
            u.setAlpha(1);
        });
        
        // 设置玩家2单位为已行动
        const enemyUnits = this.units.filter(u => u.data.team === 'enemy');
        enemyUnits.forEach(u => {
            u.data.acted = true;
            u.setAlpha(0.5);
        });
        
        this.turnIndex = 0;
        
        // 直接选择第一个单位，不使用延迟
        const scene = this;
        setTimeout(() => {
            scene.selectNextUnit();
        }, 1200);
    }

    startPlayerTurn() {
        console.log('startPlayerTurn 被调用, onlineMode:', this.onlineMode);
        if (this.onlineMode) {
            if (!this.isMyTurn()) {
                this.updateOnlineTurnDisplay();
                this.updateTrapVisibility();
                this.clearSelectionState();
                this.actionText.setText('等待对手行动...');
                return;
            }

            // 在线模式：根据当前回合显示
            const turnName = this.currentTurn === 'player' ? '玩家1' : '玩家2';
            this.showTurnBanner(`${turnName} 回合`);
            this.updateOnlineTurnDisplay();
            this.updateTrapVisibility();
            
            // 处理灼烧伤害
            this.processBurnDamage(this.currentTurn);
            
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
                // 骑士不留名回合递减
                if (u.data.forAllOne > 0) {
                    u.data.forAllOne--;
                    if (u.data.forAllOne <= 0) {
                        u.setAlpha(1);
                        u.data.critNext = false;
                        this.addLog(`${u.data.name} 骑士不留名效果结束`);
                    }
                }
                // 宝具封印回合递减
                if (u.data.nobleSeal > 0) {
                    u.data.nobleSeal--;
                    if (u.data.nobleSeal <= 0) {
                        this.addLog(`${u.data.name} 宝具封印解除`);
                    }
                }
                // 偷来的宝具回合递减
                if (u.data.stolenNoble && u.data.stolenNoble.turnsLeft > 0) {
                    u.data.stolenNoble.turnsLeft--;
                    if (u.data.stolenNoble.turnsLeft <= 0) {
                        this.addLog(`${u.data.name} 偷来的宝具 ${u.data.stolenNoble.noble.name} 消失了`);
                        u.data.stolenNoble = null;
                    }
                }
                // 定身回合递减
                if (u.data.rooted > 0) {
                    u.data.rooted--;
                    if (u.data.rooted <= 0) {
                        this.addLog(`${u.data.name} 定身效果解除`);
                    }
                }
            });
            
            // 设置对方单位为已行动状态
            const otherUnits = this.units.filter(u => u.data.team !== this.currentTurn);
            otherUnits.forEach(u => {
                u.data.acted = true;
                u.setAlpha(0.5);
            });
            
            this.turnIndex = 0;
            const scene = this;
            setTimeout(() => {
                scene.broadcastStateSync('turnStart');
                if (!scene.gameOver) {
                    scene.selectNextUnit();
                }
            }, 1000);
            return;
        }
        
        // 本地模式
        this.currentTurn = 'player';
        this.showTurnBanner('玩家1 回合');
        this.turnText.setText('当前回合: 玩家1');
        this.turnIndicator.setText('⚡ 玩家1 回合');
        this.addLog('--- 玩家1 回合 ---');
        
        // 更新陷阱可见性
        this.updateTrapVisibility();
        
        // 处理灼烧伤害
        this.processBurnDamage('player');

        // 处理千年城效果
        this.processMillenniumCastle('player');

        // 处理宝具分身退场
        this.processNobleClones();

        // 处理时间停止
        if (this.timeStopTurns > 0) {
            this.timeStopTurns--;
            this.addLog(`固有时域制: 时间停止剩余${this.timeStopTurns}回合`);
            if (this.timeStopTurns <= 0) {
                this.addLog('时间重新开始流动');
                this.timeStopCaster = null;
            }
        }
        
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
            // 骑士不留名回合递减
            if (u.data.forAllOne > 0) {
                u.data.forAllOne--;
                if (u.data.forAllOne <= 0) {
                    u.setAlpha(1);
                    u.data.critNext = false;
                    this.addLog(`${u.data.name} 骑士不留名效果结束`);
                }
            }
            // 宝具封印回合递减
            if (u.data.nobleSeal > 0) {
                u.data.nobleSeal--;
                if (u.data.nobleSeal <= 0) {
                    this.addLog(`${u.data.name} 宝具封印解除`);
                }
            }
            // 偷来的宝具回合递减
            if (u.data.stolenNoble && u.data.stolenNoble.turnsLeft > 0) {
                u.data.stolenNoble.turnsLeft--;
                if (u.data.stolenNoble.turnsLeft <= 0) {
                    this.addLog(`${u.data.name} 偷来的宝具 ${u.data.stolenNoble.noble.name} 消失了`);
                    u.data.stolenNoble = null;
                }
            }
            // 定身回合递减
            if (u.data.rooted > 0) {
                u.data.rooted--;
                if (u.data.rooted <= 0) {
                    this.addLog(`${u.data.name} 定身效果解除`);
                }
            }
        });
        
        // 设置玩家2单位为已行动
        const enemyUnits = this.units.filter(u => u.data.team === 'enemy');
        enemyUnits.forEach(u => {
            u.data.acted = true;
            u.setAlpha(0.5);
        });
        
        this.turnIndex = 0;
        console.log('startPlayerTurn 即将调用 selectNextUnit (1秒后)');
        const scene = this;
        setTimeout(() => {
            console.log('setTimeout 回调执行');
            scene.selectNextUnit();
        }, 1000);
    }

    // 处理灼烧伤害
    processBurnDamage(team) {
        const units = this.units.filter(u => u.data.team === team && u.data.burn);
        units.forEach(unit => {
            if (unit.data.burn && unit.data.burn.turns > 0) {
                const burnDmg = unit.data.burn.damage;
                unit.data.hp -= burnDmg;
                unit.data.burn.turns--;
                this.updateUnitBars(unit);
                this.showDamageNumber(unit, burnDmg);
                this.addLog(`${unit.data.name} 灼烧伤害 ${burnDmg} (剩余${unit.data.burn.turns}回合)`);
                
                if (unit.data.burn.turns <= 0) {
                    unit.data.burn = null;
                    this.addLog(`${unit.data.name} 灼烧效果结束`);
                }
                
                if (unit.data.hp <= 0) {
                    this.addLog(`${unit.data.name} 被灼烧击败!`);
                    audioManager.playDeath();
                    this.destroyUnit(unit);
                }
            }
        });
    }


    selectNextUnit() {
        console.log('selectNextUnit 被调用, gameOver:', this.gameOver, 'currentTurn:', this.currentTurn);
        if (this.gameOver) return;

        // 测试模式：始终保持选中测试单位，不切换
        if (this.testMode) {
            if (this.testUnit && this.testUnit.data) {
                this.selectUnit(this.testUnit);
                this.actionText.setText('选择技能进行测试');
            }
            return;
        }

        if (this.onlineMode && !this.isMyTurn()) {
            this.clearSelectionState();
            this.actionText.setText('等待对手行动...');
            return;
        }
        
        let teamUnits = this.units.filter(u => u.data && u.data.team === this.currentTurn && !u.data.acted);
        // 月影分身：分身在本体之后行动
        teamUnits.sort((a, b) => {
            if (a.data.isClone && !b.data.isClone) return 1;
            if (!a.data.isClone && b.data.isClone) return -1;
            return 0;
        });
        console.log('teamUnits:', teamUnits.length, '个未行动单位');
        
        if (teamUnits.length === 0) {
            if (this.onlineMode) {
                this.clearSelectionState();
                this.actionText.setText('等待回合同步...');
                return;
            }

            // 当前玩家所有单位都行动完了，切换回合
            console.log('所有单位已行动，切换回合');
            const scene = this;
            setTimeout(() => {
                if (scene.currentTurn === 'player') {
                    scene.startEnemyTurn();
                } else {
                    scene.startPlayerTurn();
                }
            }, 500);
            return;
        }
        
        this.currentUnit = teamUnits[0];
        console.log('选中单位:', this.currentUnit.data.name);
        this.selectUnit(this.currentUnit);
        this.diceResult = null;
        this.waitingForAction = false;
        this.diceDisplay.setVisible(false);
        this.diceResultText.setText('');
        
        this.updateNobleButton();
        this.updateBerserkButton();
        
        if (this.currentUnit.data.berserkAttack) {
            this.actionText.setText('选择行动：移动 / 随机决定 / 宝具 / 普攻(狂化)');
        } else {
            this.actionText.setText('选择行动：移动 / 随机决定 / 宝具');
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
            `${d.name} [${d.className}] HP:${d.hp}/${d.maxHp} NP:${d.np}/${d.maxNp} 随机:${d.diceCount}~${d.diceCount * 6} 移动:${d.moveRange} 射程:${d.attackRange}${statusText}`
        );
        this.updateUnitBars(unit);
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
        if (!this.nobleBtn) return;
        if (this.currentUnit && this.currentUnit.data.np >= 100) {
            // 检查宝具是否被封印
            if (this.currentUnit.data.nobleSeal > 0) {
                this.nobleBtn.label.setStyle({ fill: '#888' });
                this.nobleBtn.label.setText(`宝具(封印${this.currentUnit.data.nobleSeal})`);
            } else if (this.currentUnit.data.stolenNoble) {
                // 有偷来的宝具
                this.nobleBtn.label.setStyle({ fill: '#9b59b6' });
                this.nobleBtn.label.setText(`宝具(${this.currentUnit.data.stolenNoble.noble.name})`);
            } else {
                this.nobleBtn.label.setStyle({ fill: '#f1c40f' });
                this.nobleBtn.label.setText('宝具');
            }
        } else {
            this.nobleBtn.label.setStyle({ fill: '#555' });
            this.nobleBtn.label.setText('宝具');
        }
    }

    rollDice() {
        if (!this.currentUnit || this.currentUnit.data.acted) return;
        if (this.waitingForAction) return;
        if (this.onlineMode && !this.isMyTurn()) return;
        
        audioManager.playDiceRoll();
        
        // 随机数动画
        this.diceDisplay.setVisible(true);
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 10) {
                clearInterval(rollAnim);
                audioManager.playDiceResult();
                scene.finishRoll();
            }
        }, 80);
    }

    finishRoll() {
        this.diceResult = Phaser.Math.Between(1, 6);
        this.diceDisplay.setText(String(this.diceResult));
        
        const effect = RANDOM_EFFECTS[this.diceResult];
        this.diceResultText.setText(`${this.diceResult}: ${effect.name}`);
        this.actionText.setText(`随机结果 ${this.diceResult}: ${effect.desc}`);
        this.addLog(`${this.currentUnit.data.name} 随机决定: ${this.diceResult} (${effect.name})`);
        
        this.waitingForAction = true;
        this.applyDiceEffect();
    }

    applyDiceEffect() {
        const effect = RANDOM_EFFECTS[this.diceResult];
        
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
        this.clearSkillButtons();
        
        const skills = this.currentUnit.data.skills;
        const centerX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2;
        const centerY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2;
        
        // 技能按钮颜色
        const colors = [0xe74c3c, 0xf39c12, 0x9b59b6];
        
        this.skillButtons = [];
        const scene = this;
        
        skills.forEach((skill, index) => {
            const btnX = centerX + (index - 1) * 130;
            const btn = this.createStyledButton(btnX, centerY, skill.name, colors[index], '#fff', () => {
                if (costHp) {
                    scene.currentUnit.data.hp -= 15;
                    scene.addLog(`${scene.currentUnit.data.name} 血祭消耗 15 HP`);
                    scene.updateUnitBars(scene.currentUnit);
                    if (scene.currentUnit.data.hp <= 0) {
                        scene.addLog(`${scene.currentUnit.data.name} 因血祭死亡!`);
                        audioManager.playDeath();
                        const deadUnit = scene.currentUnit;
                        scene.currentUnit = null;
                        scene.clearSkillButtons();
                        scene.destroyUnit(deadUnit);
                        if (!scene.gameOver) {
                            setTimeout(() => scene.selectNextUnit(), 500);
                        }
                        return;
                    }
                }
                scene.executeSkill(index);
                scene.clearSkillButtons();
            }, 120, 40);
            btn.setDepth(200);
            this.skillButtons.push(btn);
        });
        
        this.actionText.setText(costHp ? '选择技能（消耗15HP）' : '选择技能');
    }

    rollForHeal() {
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 8) {
                clearInterval(rollAnim);
                // 随机恢复量
                const randomValue = rollFate(2);
                const healAmount = randomValue * 3;
                const maxHp = scene.currentUnit.data.maxHp || 100;
                if (maxHp === Infinity) {
                    scene.currentUnit.data.hp += healAmount;
                } else {
                    scene.currentUnit.data.hp = Math.min(maxHp, scene.currentUnit.data.hp + healAmount);
                }
                scene.updateUnitBars(scene.currentUnit);
                audioManager.playHeal();
                scene.showHealNumber(scene.currentUnit, healAmount);
                scene.playScreenPulse(0x2ecc71, 0.08, 140);
                scene.diceResultText.setText(`治疗: ${randomValue}×3`);
                const msg = `${scene.currentUnit.data.name} 恢复 ${healAmount} HP`;
                scene.actionText.setText(msg);
                scene.addLog(msg);
                scene.finishAction();
            }
        }, 80);
    }

    rollForCharge() {
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 8) {
                clearInterval(rollAnim);
                // 随机充能量
                const randomValue = rollFate(2);
                const chargeAmount = randomValue * 4;
                const maxNp = scene.currentUnit.data.maxNp || 100;
                if (maxNp === Infinity) {
                    scene.currentUnit.data.np += chargeAmount;
                } else {
                    scene.currentUnit.data.np = Math.min(maxNp, scene.currentUnit.data.np + chargeAmount);
                }
                scene.updateUnitBars(scene.currentUnit);
                scene.updateNobleButton();
                audioManager.playCharge();
                scene.createRadialBurstAt(scene.currentUnit.x, scene.currentUnit.y, 0xf1c40f, 62, 8, 1245);
                scene.showCombatText(scene.currentUnit, `NP+${chargeAmount}`, '#f1c40f', '16px');
                scene.playScreenPulse(0xf1c40f, 0.08, 140);
                scene.diceResultText.setText(`充能: ${randomValue}×4`);
                const msg = `${scene.currentUnit.data.name} 宝具值 +${chargeAmount}`;
                scene.actionText.setText(msg);
                scene.addLog(msg);
                scene.finishAction();
            }
        }, 80);
    }

    rollForSkill(type, skill) {
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 8) {
                clearInterval(rollAnim);
                const diceResult = Phaser.Math.Between(1, 6);
                scene.diceDisplay.setText(String(diceResult));
                
                switch(type) {
                    case 'burstMode':
                        const atkBonus = diceResult * (skill.multiplier || 2);
                        scene.currentUnit.data.burstMode = skill.turns;
                        scene.currentUnit.data.burstAtkBonus = atkBonus;
                        scene.currentUnit.data.burstRangeBonus = skill.rangeBonus;
                        scene.diceResultText.setText(`随机: ${diceResult}`);
                        const burstMsg = `${scene.currentUnit.data.name} 发动魔力放出，${skill.turns}次攻击+${atkBonus}伤害`;
                        scene.actionText.setText(burstMsg);
                        scene.addLog(burstMsg);
                        scene.finishAction();
                        break;
                    case 'shield':
                        const shieldAmount = diceResult * skill.multiplier;
                        scene.currentUnit.data.shield += shieldAmount;
                        scene.updateUnitBars(scene.currentUnit);
                        audioManager.playShield();
                        scene.diceResultText.setText(`随机: ${diceResult}×${skill.multiplier}`);
                        const shieldMsg = `${scene.currentUnit.data.name} 获得 ${shieldAmount} 护盾`;
                        scene.actionText.setText(shieldMsg);
                        scene.addLog(shieldMsg);
                        scene.finishAction();
                        break;
                    case 'chargeAndMove':
                        const chargeAmount = diceResult * skill.multiplier;
                        scene.currentUnit.data.np = Math.min(100, scene.currentUnit.data.np + chargeAmount);
                        scene.updateUnitBars(scene.currentUnit);
                        scene.updateNobleButton();
                        scene.diceResultText.setText(`随机: ${diceResult}×${skill.multiplier}`);
                        const chargeMsg = `${scene.currentUnit.data.name} 宝具值 +${chargeAmount}`;
                        scene.actionText.setText(chargeMsg + '，选择移动位置');
                        scene.addLog(chargeMsg);
                        scene.showMoveRange(scene.currentUnit, scene.currentUnit.data.moveRange);
                        scene.setupMoveInputThenFinish();
                        break;
                }
            }
        }, 80);
    }

    // 阿瓦隆：护盾+治疗
    rollForAvalon(skill) {
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 8) {
                clearInterval(rollAnim);
                const diceResult = Phaser.Math.Between(1, 6);
                scene.diceDisplay.setText(String(diceResult));
                
                const shieldAmount = diceResult * skill.shieldMult;
                const healAmount = diceResult * skill.healMult;
                
                scene.currentUnit.data.shield += shieldAmount;
                scene.currentUnit.data.hp = Math.min(scene.currentUnit.data.maxHp, scene.currentUnit.data.hp + healAmount);
                scene.updateUnitBars(scene.currentUnit);
                audioManager.playShield();
                
                scene.diceResultText.setText(`随机: ${diceResult}`);
                const msg = `阿瓦隆! +${shieldAmount}护盾, +${healAmount}HP`;
                scene.actionText.setText(msg);
                scene.addLog(`${scene.currentUnit.data.name} ${msg}`);
                scene.finishAction();
            }
        }, 80);
    }

    // 阿瓦隆反馈：受伤时回复
    rollForAvalonCounter(skill) {
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 8) {
                clearInterval(rollAnim);
                const diceResult = Phaser.Math.Between(1, 6);
                scene.diceDisplay.setText(String(diceResult));
                
                scene.currentUnit.data.avalonCounter = diceResult;
                audioManager.playShield();
                
                scene.diceResultText.setText(`随机: ${diceResult}`);
                const msg = `阿瓦隆展开! 接下来${diceResult}次受伤回复伤害一半的HP和NP`;
                scene.actionText.setText(msg);
                scene.addLog(`${scene.currentUnit.data.name} ${msg}`);
                scene.finishAction();
            }
        }, 80);
    }

    // 圆桌誓约：召唤圆桌骑士的加护
    useRoundTableOath() {
        const d = this.currentUnit.data;
        const scene = this;
        
        // 圆桌骑士誓约列表（新版数值+图片）
        const ROUND_TABLE_OATHS = [
            { knight: '亚瑟', image: 'knight_arthur', oath: '此战为拯救世界之战', condition: 'saveWorld', effect: '对HP<50%敌人伤害+20~50%', bonus: { lowHpDamage: () => 1 + Phaser.Math.Between(20, 50) * 0.01 } },
            { knight: '凯', image: 'knight_kay', oath: '此战须为生存而战', condition: 'survival', effect: '自身HP<70%时攻击+20~40', bonus: { survivalAtk: () => Phaser.Math.Between(20, 40) } },
            { knight: '贝德维尔', image: 'knight_bedivere', oath: '此战须与强于己身之人为战', condition: 'stronger', effect: '获得护盾20~40', bonus: { shield: () => Phaser.Math.Between(20, 40) } },
            { knight: '巴乐米底', image: 'knight_palamedes', oath: '此战须是一对一之战', condition: 'duel', effect: '场上敌人≤2时伤害+20~40%', bonus: { duelDamage: () => 1 + Phaser.Math.Between(20, 40) * 0.01 } },
            { knight: '加赫里斯', image: 'knight_gaheris', oath: '此战不为与人道背驰之战', condition: 'humanity', effect: '攻击后NP+20~40', bonus: { humanityNp: () => Phaser.Math.Between(20, 40) } },
            { knight: '阿格规文', image: 'knight_agravain', oath: '此战必须为追求真实而战', condition: 'truth', effect: '25~40%暴击率', bonus: { critBonus: () => Phaser.Math.Between(25, 40) * 0.01 } },
            { knight: '兰斯洛特', image: 'knight_lancelot', oath: '此战不为与精灵为敌之战', condition: 'fairy', effect: '攻击后NP+15~30', bonus: { fairyNp: () => Phaser.Math.Between(15, 30) } },
            { knight: '莫德雷德', image: 'knight_mordred', oath: '此战须前与邪恶作战', condition: 'evil', effect: '伤害+15~30%', bonus: { evilDamage: () => 1 + Phaser.Math.Between(15, 30) * 0.01 } },
            { knight: '加拉哈德', image: 'knight_galahad', oath: '此战不得为私欲而战', condition: 'selfless', effect: '攻击后回复15~30HP', bonus: { selflessHeal: () => Phaser.Math.Between(15, 30) } },
            { knight: '高文', image: 'knight_gawain', oath: '此战须为荣誉之战', condition: 'honor', effect: '正面攻击伤害+20~35%', bonus: { honorDamage: () => 1 + Phaser.Math.Between(20, 35) * 0.01 } },
            { knight: '崔斯坦', image: 'knight_tristan', oath: '此战须为勇者共斗之战', condition: 'brave', effect: '攻击范围+2~3', bonus: { rangeBonus: () => Phaser.Math.Between(2, 3) } },
            { knight: '加雷斯', image: 'knight_gareth', oath: '此战不为与善人为敌之战', condition: 'good', effect: '减少受到伤害20~35', bonus: { damageReduce: () => Phaser.Math.Between(20, 35) } }
        ];
        
        // 直接计算结果（不用动画）
        const diceResult = Phaser.Math.Between(1, 6);
        scene.diceDisplay.setText(String(diceResult));
        const npGain = diceResult * 10;
        
        d.np = Math.min(100, d.np + npGain);
        scene.updateUnitBars(scene.currentUnit);
        scene.updateNobleButton();
        
        // 随机选择1~3位骑士
        const knightCount = Phaser.Math.Between(1, 3);
        const shuffled = Phaser.Utils.Array.Shuffle([...ROUND_TABLE_OATHS]);
        const selectedOaths = shuffled.slice(0, knightCount);
        
        // 初始化誓约数组
        if (!d.roundTableOaths) d.roundTableOaths = [];
        
        // 添加选中的誓约
        selectedOaths.forEach(oath => {
            const resolvedBonus = {};
            Object.keys(oath.bonus).forEach(key => {
                resolvedBonus[key] = typeof oath.bonus[key] === 'function' ? oath.bonus[key]() : oath.bonus[key];
            });

            d.roundTableOaths.push({
                ...oath,
                bonus: resolvedBonus
            });
        });
        
        // 显示结果
        const knightNames = selectedOaths.map(o => o.knight).join('、');
        scene.addLog(`${d.name} 召唤圆桌骑士的加护! NP+${npGain}`);
        scene.addLog(`响应者: ${knightNames}`);
        
        // 应用效果
        selectedOaths.forEach(oath => {
            scene.addLog(`【${oath.knight}】${oath.oath}`);
            scene.addLog(`  效果: ${oath.effect}`);
            
            // 贝德维尔立即给护盾
            if (oath.condition === 'stronger') {
                const shieldAmount = oath.bonus.shield();
                d.shield = (d.shield || 0) + shieldAmount;
                scene.updateUnitBars(scene.currentUnit);
                scene.addLog(`贝德维尔誓约: 获得${shieldAmount}护盾`);
            }
            // 崔斯坦立即加攻击范围
            if (oath.condition === 'brave') {
                const rangeBonus = oath.bonus.rangeBonus();
                d.attackRange = (d.attackRange || 1) + rangeBonus;
                d.roundTableRangeBonus = rangeBonus;
                scene.addLog(`崔斯坦誓约: 攻击范围+${rangeBonus}`);
            }
            // 加雷斯立即加减伤
            if (oath.condition === 'good') {
                const reduce = oath.bonus.damageReduce();
                d.roundTableDamageReduce = (d.roundTableDamageReduce || 0) + reduce;
                scene.addLog(`加雷斯誓约: 减少受到伤害${reduce}`);
            }
        });
        
        audioManager.playSkill();
        scene.diceResultText.setText(`随机: ${diceResult}×10`);
        scene.actionText.setText(`圆桌誓约! NP+${npGain}, ${knightNames} 响应`);
        scene.finishAction();
    }
    
    // 骑士召唤动画（暂时不用）
    playKnightSummonAnimation(oaths, callback) {
        // 直接调用回调
        if (callback) callback();
    }

    // 应用圆桌誓约效果
    applyRoundTableOaths(attacker, defender, baseDamage) {
        const oaths = attacker.data.roundTableOaths;
        if (!oaths || oaths.length === 0) {
            return { damage: baseDamage, effects: [] };
        }
        
        let damage = baseDamage;
        const effects = [];
        const enemies = this.units.filter(u => u.data.team !== attacker.data.team);
        
        oaths.forEach(oath => {
            // 获取随机值（bonus现在是函数）
            const getBonus = (key) => typeof oath.bonus[key] === 'function' ? oath.bonus[key]() : oath.bonus[key];
            
            switch(oath.condition) {
                case 'saveWorld': // 亚瑟：对HP<50%敌人伤害+20~50%
                    if (defender.data.hp < defender.data.maxHp * 0.5) {
                        const mult = getBonus('lowHpDamage');
                        damage = Math.floor(damage * mult);
                        effects.push(`亚瑟誓约: 伤害+${Math.round((mult-1)*100)}%`);
                    }
                    break;
                case 'survival': // 凯：HP<70%时攻击+20~40
                    if (attacker.data.hp < attacker.data.maxHp * 0.7) {
                        const bonus = getBonus('survivalAtk');
                        damage += bonus;
                        effects.push(`凯誓约: +${bonus}伤害`);
                    }
                    break;
                case 'stronger': // 贝德维尔：护盾已在使用技能时给予
                    break;
                case 'duel': // 巴乐米底：场上敌人≤2时伤害+20~40%
                    if (enemies.length <= 2) {
                        const mult = getBonus('duelDamage');
                        damage = Math.floor(damage * mult);
                        effects.push(`巴乐米底誓约: 伤害+${Math.round((mult-1)*100)}%`);
                    }
                    break;
                case 'humanity': // 加赫里斯：攻击后NP+20~40
                    {
                        const npGain = getBonus('humanityNp');
                        attacker.data.np = Math.min(100, attacker.data.np + npGain);
                        this.updateUnitBars(attacker);
                        effects.push(`加赫里斯誓约: NP+${npGain}`);
                    }
                    break;
                case 'truth': // 阿格规文：25~40%暴击率
                    {
                        const critChance = getBonus('critBonus');
                        if (Math.random() < critChance) {
                            damage = Math.floor(damage * 1.5);
                            effects.push(`阿格规文誓约: 暴击!`);
                        }
                    }
                    break;
                case 'fairy': // 兰斯洛特：攻击后NP+15~30
                    {
                        const npGain = getBonus('fairyNp');
                        attacker.data.np = Math.min(100, attacker.data.np + npGain);
                        this.updateUnitBars(attacker);
                        effects.push(`兰斯洛特誓约: NP+${npGain}`);
                    }
                    break;
                case 'evil': // 莫德雷德：伤害+15~30%
                    {
                        const mult = getBonus('evilDamage');
                        damage = Math.floor(damage * mult);
                        effects.push(`莫德雷德誓约: 伤害+${Math.round((mult-1)*100)}%`);
                    }
                    break;
                case 'selfless': // 加拉哈德：攻击后回复15~30HP
                    {
                        const heal = getBonus('selflessHeal');
                        attacker.data.hp = Math.min(attacker.data.maxHp, attacker.data.hp + heal);
                        this.updateUnitBars(attacker);
                        effects.push(`加拉哈德誓约: 回复${heal}HP`);
                    }
                    break;
                case 'honor': // 高文：正面攻击伤害+20~35%
                    if (attacker.data.x === defender.data.x || attacker.data.y === defender.data.y) {
                        const mult = getBonus('honorDamage');
                        damage = Math.floor(damage * mult);
                        effects.push(`高文誓约: 伤害+${Math.round((mult-1)*100)}%`);
                    }
                    break;
                case 'brave': // 崔斯坦：攻击范围已在使用技能时增加
                    break;
                case 'good': // 加雷斯：减伤已在使用技能时设置
                    break;
            }
        });
        
        // 显示触发的效果
        effects.forEach(e => this.addLog(e));
        
        return { damage, effects };
    }

    // 魔力放出：风王铁锤 + 强化攻击
    startBurstWithHammer(skill) {
        this.pendingBurstSkill = skill;
        this.actionText.setText('风王铁锤! 选择攻击方向');
        this.showLineAttackDirections(this.currentUnit, skill.hammerRange);
        this.setupHammerInput(skill);
    }

    setupHammerInput(skill) {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const dirTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'direction');
            if (dirTile) {
                this.clearHighlights();
                this.executeHammer(skill, dirTile.dir);
            } else {
                this.setupHammerInput(skill);
            }
        });
    }

    executeHammer(skill, direction) {
        // 随机决定
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 8) {
                clearInterval(rollAnim);
                const diceResult = Phaser.Math.Between(1, 6);
                scene.diceDisplay.setText(String(diceResult));
                scene.diceResultText.setText(`随机: ${diceResult}`);
                
                // 获取直线上的敌人
                const enemies = scene.getEnemiesInLine(scene.currentUnit, direction, skill.hammerRange);
                
                if (enemies.length > 0) {
                    enemies.forEach(enemy => {
                        const dist = Math.abs(enemy.data.x - scene.currentUnit.data.x) + Math.abs(enemy.data.y - scene.currentUnit.data.y);
                        const damage = (6 - dist) * diceResult;
                        if (damage > 0) {
                            scene.showDamageNumber(enemy, damage);
                            scene.dealDamage(enemy, damage, 'skill');
                            scene.addLog(`风王铁锤击中 ${enemy.data.name}! (6-${dist})×${diceResult}=${damage}伤害`);
                        }
                    });
                    audioManager.playAttack();
                } else {
                    scene.addLog('风王铁锤: 无目标');
                }
                
                // 设置后续强化攻击
                scene.currentUnit.data.burstMode = skill.turns;
                scene.currentUnit.data.burstAtkBonus = diceResult * skill.multiplier;
                scene.currentUnit.data.burstRangeBonus = skill.rangeBonus;
                
                const msg = `风王铁锤完成! 接下来${skill.turns}次攻击范围+${skill.rangeBonus}，伤害+${diceResult * skill.multiplier}`;
                scene.actionText.setText(msg);
                scene.addLog(msg);
                scene.finishAction();
            }
        }, 80);
    }

    // 直觉：充能+暴击buff
    rollForIntuition(skill) {
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 8) {
                clearInterval(rollAnim);
                const diceResult = Phaser.Math.Between(1, 6);
                scene.diceDisplay.setText(String(diceResult));
                
                const chargeAmount = diceResult * skill.multiplier;
                scene.currentUnit.data.np = Math.min(100, scene.currentUnit.data.np + chargeAmount);
                scene.currentUnit.data.critNext = true; // 下次攻击暴击
                scene.updateUnitBars(scene.currentUnit);
                scene.updateNobleButton();
                
                scene.diceResultText.setText(`随机: ${diceResult}×${skill.multiplier}`);
                const msg = `直觉发动! NP+${chargeAmount}, 下次攻击暴击!`;
                scene.actionText.setText(msg);
                scene.addLog(`${scene.currentUnit.data.name} ${msg}`);
                scene.finishAction();
            }
        }, 80);
    }

    clearSkillButtons() {
        // 测试模式下保留按钮
        if (this.testMode) return;
        if (this.skillButtons) {
            this.skillButtons.forEach(btn => btn.destroy());
            this.skillButtons = [];
        }
        if (this._testBtns) {
            this._testBtns.forEach(b => { if (b.bg) b.bg.destroy(); if (b.text) b.text.destroy(); if (b.hit) b.hit.destroy(); });
            this._testBtns = [];
        }
    }

    rollSkillRoulette() {
        // 再掷一次决定技能
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 3);
            scene.diceResultText.setText(`技能轮盘: ${tempRoll}`);
            rolls++;
            if (rolls >= 8) {
                clearInterval(rollAnim);
                const skillIndex = Phaser.Math.Between(0, 2);
                const skill = scene.currentUnit.data.skills[skillIndex];
                scene.actionText.setText(`轮盘结果: ${skill.name}!`);
                setTimeout(() => scene.executeSkill(skillIndex), 500);
            }
        }, 80);
    }

    executeSkill(index) {
        SharedSkills.executeSkill(this, this.currentUnit, index);
    }

    // 共享模块未处理的遗留技能，由此方法处理
    _onSkill(skill, index) {
        const scene = this;
        switch(skill.effect) {
            case 'burstModeRoll': this.rollForSkill('burstMode', skill); break;
            case 'shieldRoll': this.rollForSkill('shield', skill); break;
            case 'avalonFull': this.rollForAvalon(skill); break;
            case 'avalonCounter': this.rollForAvalonCounter(skill); break;
            case 'roundTableOath': this.useRoundTableOath(); break;
            case 'burstWithHammer': this.startBurstWithHammer(skill); break;
            case 'intuition': this.rollForIntuition(skill); break;
            case 'chargeAndMove':
                this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + skill.value);
                this.updateUnitBars(this.currentUnit); this.updateNobleButton();
                this.showMoveRange(this.currentUnit, this.currentUnit.data.moveRange);
                this.setupMoveInputThenFinish(); break;
            case 'chargeRollAndMove': this.rollForSkill('chargeAndMove', skill); break;
            case 'healRoll': this.rollForHeal(); break;
            case 'roAias': this.useRoAias(); break;
            case 'projection': this.useProjection(); break;
            case 'tripleStrike':
                this.showAttackRange(this.currentUnit);
                if (this.highlightTiles.filter(t => t.type === 'attack').length > 0) {
                    this.setupTripleStrikeInput();
                } else { this.actionText.setText('没有可攻击的目标'); this.finishAction(); }
                break;
            case 'porcelainAttack': this.usePorcelainAttack(); break;
            case 'roseSwordsman': this.useRoseSwordsman(); break;
            case 'dogLight': this.useDogLight(); break;
            case 'forAllOne': this.useForAllOne(); break;
            case 'arondight': this.useArondight(); break;
            case 'knightOfOwner': this.useKnightOfOwner(); break;
            case 'secretPath': this.useSecretPath(); break;
            case 'lastStand': this.useLastStand(); break;
            case 'ambush': this.useAmbush(); break;
            default: this.finishAction(); break;
        }
    }

    // 共享模块未处理的遗留宝具
    _onNoble(noble) {
        const enemies = this.units.filter(u => u.data.team !== this.currentUnit.data.team);
        switch(noble.effect) {
            case 'excaliburLine':
                this.showLineAttackDirections(this.currentUnit);
                this.setupExcaliburLineInput(noble); break;
            case 'unlimitedBladeWorks':
                this.rollForUnlimitedBladeWorks(noble, enemies); break;
            case 'heleweiBurst':
                this.useHeleweiBurst(noble); break;
            case 'arondightOverload':
                this.useArondightOverload(noble, enemies); break;
            case 'unrivaledGeneral':
                this.useUnrivaledGeneral(noble, enemies); break;
            case 'excalibur':
                this.showAttackRangeForNoble(noble.range);
                this.setupNobleTargetInput(noble); break;
            case 'excaliburAoe':
                this.rollForNobleAoe(noble, enemies); break;
            default: this.finishAction(); break;
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
        
        // 简化版：直接计算护盾，不需要动画
        const baseShield = Phaser.Math.Between(5, 10);
        const newShield = baseShield + d.roAiasLastValue;
        d.shield += newShield;
        d.roAiasLastValue = newShield;
        d.roAiasCount++;
        
        this.updateUnitBars(this.currentUnit);
        audioManager.playShield();
        
        let msg = `${d.name} 七重圆环第${d.roAiasCount}层: +${newShield}护盾 (累计${d.shield})`;
        
        // 满7层时获得宝具免疫
        if (d.roAiasCount >= 7) {
            d.nobleImmune = true;
            msg += ' [满层! 免疫一次宝具伤害]';
        }
        
        this.addLog(msg);
        this.actionText.setText(`+${newShield}护盾`);
        this.time.delayedCall(260, () => this.finishAction());
    }

    useProjection() {
        const d = this.currentUnit.data;
        
        if (d.projectedWeapon) {
            // 已有武器，显示选项按钮
            this.clearSkillButtons();
            this.skillButtons = [];
            
            // 在地图中央显示选项按钮
            const centerX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2;
            const centerY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2;
            
            // 使用美化按钮 - 高depth确保显示在最上层
            const btn1 = this.createStyledButton(centerX - 70, centerY, '投掷武器', 0xc0392b, '#fff', () => {
                this.clearSkillButtons();
                this.projectThrowWeapon();
            }, 110, 40);
            btn1.setDepth(200);
            this.skillButtons.push(btn1);
            
            const btn2 = this.createStyledButton(centerX + 70, centerY, '放置武器', 0xf39c12, '#fff', () => {
                this.clearSkillButtons();
                this.projectPlaceWeapon();
            }, 110, 40);
            btn2.setDepth(200);
            this.skillButtons.push(btn2);
            
            this.actionText.setText('选择操作: 投掷或放置武器');
        } else {
            // 简化版：直接获得投影加成
            const bonus = Phaser.Math.Between(2, 12);
            d.projectedWeapon = true;
            d.projectionBonus = bonus;
            
            this.addLog(`${d.name} 投影完成! +${bonus}伤害`);
            this.actionText.setText(`投影完成! +${bonus}伤害`);
            this.finishAction();
        }
    }

    projectThrowWeapon() {
        const d = this.currentUnit.data;
        // 简化版：6~36伤害+等量NP
        const damage = rollFate(6);
        
        // 找到敌方单位
        const enemy = this.units.find(u => u.data && u.data.team !== d.team && u.data.hp > 0);
        
        if (enemy) {
            this.dealDamage(enemy, damage, 'skill');
            this.showDamageNumber(enemy, damage);
            audioManager.playAttack();
            
            // 恢复等量NP
            d.np = Math.min(d.maxNp || 100, d.np + damage);
            this.updateUnitBars(this.currentUnit);
            this.updateNobleButton();
            
            this.addLog(`${d.name} 投掷武器! ${damage}伤害, NP+${damage}`);
        } else {
            this.addLog(`${d.name} 投掷武器: 无目标`);
        }
        
        d.projectedWeapon = false;
        d.projectionBonus = 0;
        this.time.delayedCall(260, () => this.finishAction());
    }

    projectPlaceWeapon() {
        const d = this.currentUnit.data;
        // 简化版：3~18伤害并随机放置武器
        const damage = rollFate(3);
        
        // 找到敌方单位
        const enemy = this.units.find(u => u.data && u.data.team !== d.team && u.data.hp > 0);
        
        if (enemy) {
            this.dealDamage(enemy, damage, 'skill');
            this.showDamageNumber(enemy, damage);
            audioManager.playAttack();
            this.addLog(`${d.name} 投影新武器! ${damage}伤害`);
        }
        
        // 随机放置武器
        let x, y, attempts = 0;
        do {
            x = Phaser.Math.Between(0, GAME_CONFIG.mapWidth - 1);
            y = Phaser.Math.Between(0, GAME_CONFIG.mapHeight - 1);
            attempts++;
        } while ((this.getUnitAt(x, y) || this.getSwordAt(x, y)) && attempts < 20);
        
        if (attempts < 20) {
            const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
            const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
            
            const sword = this.add.image(posX, posY, `weapon_${Phaser.Math.Between(0, 3)}`);
            sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
            sword.setOrigin(0.5);
            
            const swordDamage = rollFate(3);
            if (!this.ubwSwords) this.ubwSwords = [];
            this.ubwSwords.push({ 
                x, y, 
                sprite: sword, 
                damage: swordDamage,
                owner: this.currentUnit
            });
            
            this.addLog(`武器放置于(${x},${y})`);
        }
        
        d.projectedWeapon = false;
        d.projectionBonus = 0;
        this.finishAction();
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
                // 连续随机伤害
                let damage = rollFate(3);
                
                // 最后一击双倍伤害
                const isLastHit = this.tripleStrikeCount === 1;
                if (isLastHit) {
                    damage *= 2;
                }
                
                this.tripleStrikeDamages.push(damage);
                this.tripleStrikeCount--;
                
                // 恢复等量NP（基于原始伤害）
                const npGain = isLastHit ? damage / 2 : damage;
                this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + npGain);
                this.tripleStrikeNp += npGain;
                this.updateUnitBars(this.currentUnit);
                this.updateNobleButton();
                
                // 获取直线上的敌人
                const enemies = this.getEnemiesInLine(this.currentUnit, dirTile.dir);
                
                const hitNum = 3 - this.tripleStrikeCount;
                const randomText = `${isLastHit ? `${damage / 2}×2` : damage}`;
                
                if (enemies.length > 0) {
                    enemies.forEach(enemy => {
                        this.showDamageNumber(enemy, damage);
                        this.dealDamage(enemy, damage, 'skill');
                    });
                    audioManager.playAttack();
                    this.addLog(`鹤翼第${hitNum}击: ${randomText}=${damage}伤害×${enemies.length}人, +${npGain}NP${isLastHit ? ' [终结]' : ''}`);
                } else {
                    this.addLog(`鹤翼第${hitNum}击: 无目标, +${npGain}NP`);
                }
                
                if (this.tripleStrikeCount > 0) {
                    this.clearHighlights();
                    this.showLineAttackDirections(this.currentUnit);
                    this.actionText.setText(`鹤翼三连! 选择攻击方向 (剩余${this.tripleStrikeCount}次)`);
                    const scene = this;
                    setTimeout(() => scene.doTripleStrike(), 300);
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
            case 'teleport':
                // 月之转移：全图传送
                this.actionText.setText('选择传送位置（全图任意空格）');
                this.showFullMapTeleport();
                this.setupTeleportInput();
                break;
        }
    }

    showFullMapTeleport() {
        this.clearHighlights();
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                if (!this.getUnitAt(x, y) && this.map[y] && this.map[y][x] && this.map[y][x].walkable) {
                    const h = this.createPulseHighlight(x, y, 0xb8a9d4, 0.3, 0xd4b8f0, 10);
                    this.highlightTiles.push({ x, y, highlight: h, type: 'teleport' });
                }
            }
        }
    }

    setupTeleportInput() {
        const scene = this;
        this.input.once('pointerdown', (pointer) => {
            const tx = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const ty = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            const tile = scene.highlightTiles.find(t => t.x === tx && t.y === ty && t.type === 'teleport');
            if (tile) {
                scene.addLog(`${scene.currentUnit.data.name} 传送到 (${tx},${ty})`);
                scene.moveUnit(scene.currentUnit, tx, ty);
                scene.createRadialBurstAt(tx * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    ty * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2, 0xb8a9d4, 60, 12, 1000);
                scene.finishAction();
            } else {
                scene.setupTeleportInput(); // 重新监听
            }
        });
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
                this.showHealNumber(unit, effect.value);
                break;
            case 'charge':
                // 充能对所有人生效
                unit.data.np = Math.min(100, unit.data.np + effect.value);
                this.updateUnitBars(unit);
                this.addLog(`${unit.data.name} 经过魔力源，恢复 ${effect.value} NP`);
                audioManager.playCharge();
                this.createRadialBurstAt(unit.x, unit.y, 0xf1c40f, 54, 8, 1245);
                this.showCombatText(unit, `NP+${effect.value}`, '#f1c40f', '16px');
                break;
        }
    }

    showMoveRange(unit, range) {
        this.clearHighlights();
        const targets = BattleCore.getMoveTargets(
            unit.data,
            this.units.map(u => u.data),
            this.fieldEffects || [],
            GAME_CONFIG,
            range
        );

        targets.forEach(({ x, y }) => {
            const highlight = this.createPulseHighlight(x, y, 0x3498db, 0.28, 0x8fd3ff, 11);
            this.highlightTiles.push({ x, y, highlight, type: 'move' });
        });
    }

    showAttackRange(unit) {
        this.clearHighlights();
        let range = unit.data.attackRange;
        
        // 魔力放出增加攻击范围
        if (unit.data.burstMode > 0) {
            range += unit.data.burstRangeBonus;
        }
        
        const targets = BattleCore.getAttackTargets(
            unit.data,
            this.units.map(u => u.data),
            range,
            GAME_CONFIG
        );

        targets.forEach(({ x, y }) => {
            const highlight = this.createPulseHighlight(x, y, 0xe74c3c, 0.34, 0xffd0d0, 13);
            this.highlightTiles.push({ x, y, highlight, type: 'attack' });
        });
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
                const highlight = this.createPulseHighlight(x, y, 0xf39c12, 0.42, 0xffef9c, 14);
                this.highlightTiles.push({ x, y, highlight, type: 'direction', dir });
                
                // 显示该方向上的所有格子（预览）
                let px = x + dir.dx;
                let py = y + dir.dy;
                while (px >= 0 && px < GAME_CONFIG.mapWidth && py >= 0 && py < GAME_CONFIG.mapHeight) {
                    const preview = this.createPulseHighlight(px, py, 0xe74c3c, 0.16, null, 10);
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
        
        // 检查宝具是否被封印
        if (this.currentUnit.data.nobleSeal > 0) {
            this.actionText.setText(`宝具被封印中! 剩余${this.currentUnit.data.nobleSeal}回合`);
            return;
        }
        
        const noble = this.currentUnit.data.noble;
        this.currentUnit.data.np = 0;
        this.updateUnitBars(this.currentUnit);
        
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
        const nobleColor = this.getDamageFxColor('noble');
        this.createRadialBurstAt(this.currentUnit.x, this.currentUnit.y, nobleColor, 96, 12, 1300);
        this.playScreenPulse(nobleColor, 0.16, 180);
        this.shakeCamera(130, 0.0026);
        this.playNobleScreenFx();
        NobleCinematics.play(this, this.currentUnit, onComplete);
    }

    executeNobleEffect(noble) {
        this.actionText.setText(`宝具发动: ${noble.name}!`);
        
        // 宝具效果 → 统一走共享模块
        SharedSkills.executeNobleEffect(this, this.currentUnit, noble);
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
                if (sword.ownerTeam === d.team) {
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
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            scene.diceDisplay.setVisible(true);
            rolls++;
            if (rolls >= 12) {
                clearInterval(rollAnim);
                
                const total = rollFate(4);
                const damage = total * 4;
                
                let hitCount = 0;
                enemies.forEach(e => {
                    scene.showDamageNumber(e, damage);
                    scene.dealDamage(e, damage, 'noble');
                    hitCount++;
                });
                
                scene.diceResultText.setText(`${total}×4=${damage}`);
                scene.addLog(`剑雨攻击! ${hitCount}人受到${damage}伤害`);
                
                // 武器立即开始追踪攻击
                setTimeout(() => {
                    scene.processUBWSwords();
                    scene.finishAction();
                }, 500);
            }
        }, 80);
    }

    // 兰斯洛特宝具：缚锁全开·过载
    useArondightOverload(noble, enemies) {
        const d = this.currentUnit.data;
        
        // 检查是否有偷来的宝具
        if (d.stolenNoble && d.stolenNoble.turnsLeft > 0) {
            // 使用偷来的宝具
            const stolenNoble = d.stolenNoble.noble;
            this.addLog(`${d.name} 使用偷来的宝具: ${stolenNoble.name}!`);
            
            // 清除偷来的宝具
            d.stolenNoble = null;
            
            // 播放偷来宝具的动画，然后执行效果
            this.playNobleAnimation(stolenNoble, () => {
                this.executeNobleEffect(stolenNoble);
            });
            return;
        }
        
        // 原本的宝具效果：选择目标（限制在攻击范围内）
        this.clearHighlights();
        
        // 过滤出攻击范围内的敌人
        const attackRange = d.attackRange || 1;
        const inRangeEnemies = enemies.filter(enemy => {
            const dist = Math.abs(enemy.data.x - d.x) + Math.abs(enemy.data.y - d.y);
            return dist <= attackRange;
        });
        
        if (inRangeEnemies.length === 0) {
            this.actionText.setText('攻击范围内没有目标');
            this.finishAction();
            return;
        }
        
        // 高亮攻击范围内的敌人
        inRangeEnemies.forEach(enemy => {
            const highlight = this.add.rectangle(
                enemy.data.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                enemy.data.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                GAME_CONFIG.tileSize - 4,
                GAME_CONFIG.tileSize - 4,
                0xe74c3c, 0.5
            );
            highlight.type = 'attack';
            this.highlightTiles.push(highlight);
        });
        
        this.actionText.setText('缚锁全开·过载! 选择目标');
        
        // 设置点击监听
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            const target = this.getUnitAt(tileX, tileY);
            
            this.clearHighlights();
            
            // 检查目标是否在范围内
            if (target && target.data.team !== d.team) {
                const dist = Math.abs(target.data.x - d.x) + Math.abs(target.data.y - d.y);
                if (dist <= attackRange) {
                    this.executeArondightOverload(target, noble);
                } else {
                    this.addLog('目标超出攻击范围');
                    this.finishAction();
                }
            } else {
                this.addLog('取消攻击');
                this.finishAction();
            }
        });
    }

    // 执行阿隆戴特过载伤害
    executeArondightOverload(target, noble) {
        const d = this.currentUnit.data;
        
        // 随机伤害 6~36 × 4
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            scene.diceDisplay.setVisible(true);
            rolls++;
            
            if (rolls >= 16) {
                clearInterval(rollAnim);
                
                const randomStrength = noble.diceCount || 6;
                const multiplier = noble.multiplier || 4;
                const baseDamage = rollFate(randomStrength);
                const totalDamage = baseDamage * multiplier;
                
                scene.diceResultText.setText(`${baseDamage}×${multiplier}=${totalDamage}`);
                
                // 无视闪避
                const hadEvade = target.data.evade;
                if (noble.ignoreEvade) {
                    target.data.evade = false;
                }
                
                // 造成伤害（不无视护盾和战斗续行）
                scene.showDamageNumber(target, totalDamage);
                scene.dealDamage(target, totalDamage, 'noble');
                
                // 恢复闪避状态（如果被无视了）
                if (hadEvade && noble.ignoreEvade) {
                    scene.addLog('无视闪避!');
                }
                
                scene.addLog(`${d.name} 缚锁全开·过载: 对 ${target.data.name} 造成 ${totalDamage} 伤害!`);
                
                // 视觉效果
                scene.showOverloadEffect(target);
                
                setTimeout(() => scene.finishAction(), 500);
            }
        }, 80);
    }

    // 韩信宝具：国士无双
    useUnrivaledGeneral(noble, enemies) {
        const d = this.currentUnit.data;
        const attackRange = d.attackRange || 2;
        
        // 筛选攻击范围内的敌人
        const targetsInRange = enemies.filter(e => {
            const dist = Math.abs(e.data.x - d.x) + Math.abs(e.data.y - d.y);
            return dist <= attackRange;
        });
        
        if (targetsInRange.length === 0) {
            this.addLog('攻击范围内没有敌人!');
            this.actionText.setText('攻击范围内没有敌人!');
            this.finishAction();
            return;
        }
        
        // 计算超出NP的加成（多多益善被动让NP可以超过100）
        const excessNp = Math.max(0, d.np - 100);
        const npMultiplier = 1 + Math.floor(excessNp / 50) * 0.5; // 每50点+50%
        
        this.addLog(`${d.name} 国士无双! NP:${d.np}, 倍率:×${npMultiplier.toFixed(1)}`);
        
        // 随机基础伤害
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            scene.diceDisplay.setVisible(true);
            rolls++;
            
            if (rolls >= 12) {
                clearInterval(rollAnim);
                
                const baseDamage = rollFate(10); // 10~60基础伤害
                const totalDamage = Math.floor(baseDamage * npMultiplier);
                
                scene.diceResultText.setText(`${baseDamage}×${npMultiplier.toFixed(1)}=${totalDamage}`);
                
                // 对范围内敌人造成伤害
                targetsInRange.forEach(enemy => {
                    scene.showDamageNumber(enemy, totalDamage);
                    scene.dealDamage(enemy, totalDamage, 'noble');
                });
                
                scene.addLog(`国士无双! 对${targetsInRange.length}名敌人造成${totalDamage}伤害!`);
                
                // 显示特效
                scene.showUnrivaledEffect(targetsInRange);
                
                setTimeout(() => scene.finishAction(), 800);
            }
        }, 80);
    }
    
    // 国士无双特效
    showUnrivaledEffect(targets = []) {
        const commander = this.currentUnit;
        const mapWidth = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const mapHeight = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        const commanderX = commander ? commander.x : mapWidth / 2;
        const commanderY = commander ? commander.y : mapHeight / 2;
        const primaryColor = 0x63e6be;
        const accentColor = 0xf6d365;

        this.playScreenPulse(primaryColor, 0.14, 220);
        this.shakeCamera(180, 0.0052);
        this.createRadialBurstAt(commanderX, commanderY, accentColor, 92, 14, 1248);
        this.createFormationSigilAt(commanderX, commanderY, primaryColor, accentColor, 42, 1249, 420);

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const line = this.add.rectangle(commanderX, commanderY, mapWidth * 0.42, 4, accentColor, 0.76);
            line.setRotation(angle);
            line.setDepth(1238);

            this.tweens.add({
                targets: line,
                scaleX: 1.5,
                alpha: 0,
                duration: 420,
                delay: i * 30,
                ease: 'Cubic.easeOut',
                onComplete: () => line.destroy()
            });
        }

        for (let i = 0; i < 5; i++) {
            const laneY = commanderY - 96 + i * 48;
            const wave = this.add.rectangle(-80, laneY, 130, 14, primaryColor, 0.24);
            wave.setStrokeStyle(2, accentColor, 0.85);
            wave.setDepth(1239);

            this.tweens.add({
                targets: wave,
                x: mapWidth + 80,
                scaleX: 2.5,
                alpha: 0,
                duration: 430,
                delay: i * 55,
                ease: 'Cubic.easeOut',
                onComplete: () => wave.destroy()
            });
        }

        targets.forEach((target, index) => {
            this.time.delayedCall(index * 65, () => {
                this.createFormationSigilAt(target.x, target.y, primaryColor, accentColor, 34, 1244, 360);
                this.createImpactEffect(target, accentColor, { radius: 68, sparkCount: 10, pulseAlpha: 0.08 });
                if (target.data && target.data.border) {
                    this.tweens.add({
                        targets: target.data.border,
                        scaleX: 1.18,
                        scaleY: 1.18,
                        duration: 120,
                        yoyo: true,
                        ease: 'Quad.easeOut'
                    });
                }
            });
        });

        return;
        const centerX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2;
        const centerY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2;
        
        // 金色光芒扩散
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const line = this.add.rectangle(centerX, centerY, 400, 4, 0xffd700, 0.8);
            line.setRotation(angle);
            line.setDepth(100);
            
            this.tweens.add({
                targets: line,
                scaleX: 2,
                alpha: 0,
                duration: 600,
                delay: i * 50,
                onComplete: () => line.destroy()
            });
        }
    }

    // 过载视觉效果
    showOverloadEffect(target) {
        const x = target.x;
        const y = target.y;
        
        // 红色爆炸效果
        for (let i = 0; i < 5; i++) {
            const ring = this.add.circle(x, y, 20 + i * 15, 0xe74c3c, 0.6 - i * 0.1);
            this.tweens.add({
                targets: ring,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 300 + i * 100,
                onComplete: () => ring.destroy()
            });
        }
    }

    changeMapToUBW() {
        // 添加无限剑制背景图片
        const bgIndex = Phaser.Math.Between(0, 2);
        const mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const mapH = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        this.ubwBackgroundIndex = bgIndex;
        
        this.ubwBackground = this.add.image(mapW / 2, mapH / 2, `ubw_bg_${bgIndex}`);
        this.ubwBackground.setDisplaySize(mapW, mapH);
        this.ubwBackground.setDepth(-1);
        this.ubwBackground.setAlpha(0);
        
        // 淡入背景
        this.tweens.add({
            targets: this.ubwBackground,
            alpha: 0.9,
            duration: 1000
        });
        
        // 改变地图颜色为半透明，显示背景
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.map[y][x].tile.setFillStyle(0x000000, 0.2);
                this.map[y][x].tile.setStrokeStyle(1, 0xcd853f, 0.5);
            }
        }
    }

    restoreMapFromUBW() {
        // 移除背景
        if (this.ubwBackground) {
            this.tweens.add({
                targets: this.ubwBackground,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    this.ubwBackground.destroy();
                    this.ubwBackground = null;
                }
            });
        }
        
        // 恢复地图原本颜色
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.map[y][x].tile.setFillStyle(this.map[y][x].baseColor);
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
                
                // 随机选择武器贴图
                const weaponIndex = Phaser.Math.Between(0, 3);
                const sword = this.add.image(posX, posY, `weapon_${weaponIndex}`);
                sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
                sword.setOrigin(0.5);
                
                if (!this.ubwSwords) this.ubwSwords = [];
                this.ubwSwords.push({ 
                    x, y, 
                    sprite: sword, 
                    damage: Phaser.Math.Between(8, 15),
                    ownerTeam: this.ubwOwner && this.ubwOwner.data ? this.ubwOwner.data.team : null,
                    weaponIndex
                });
                
                this.addLog(`剑生成于 (${x},${y})`);
                return;
            }
            attempts++;
        }
    }

    // 在指定位置生成武器
    spawnUBWSwordAt(x, y, damage, ownerTeam = null, weaponIndex = null) {
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const resolvedWeaponIndex = weaponIndex ?? Phaser.Math.Between(0, 3);
        
        const sword = this.add.image(posX, posY, `weapon_${resolvedWeaponIndex}`);
        sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
        sword.setOrigin(0.5);
        
        if (!this.ubwSwords) this.ubwSwords = [];
        this.ubwSwords.push({ 
            x, y, 
            sprite: sword, 
            damage: damage || Phaser.Math.Between(8, 15),
            ownerTeam: ownerTeam || (this.ubwOwner && this.ubwOwner.data ? this.ubwOwner.data.team : null),
            weaponIndex: resolvedWeaponIndex
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
            const swordOwnerTeam = sword.ownerTeam || (this.ubwOwner && this.ubwOwner.data ? this.ubwOwner.data.team : null);
            if (!swordOwnerTeam) {
                this.addLog(`[调试] 武器${index}没有owner`);
                return;
            }
            
            // 找这把剑的敌人
            const enemies = this.units.filter(u => u.data && u.data.team !== swordOwnerTeam && u.data.hp > 0);
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
            const scene = this;
            setTimeout(() => scene.swordAttack(sword, target), 250);
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
        this.ubwBackgroundIndex = null;
        
        // 恢复地图
        this.restoreMapFromUBW();
    }

    // ========== 何乐为技能 ==========
    usePorcelainAttack() {
        const d = this.currentUnit.data;
        
        if (!d.porcelainEntity) {
            // 放置瓷器
            const positions = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                { dx: 1, dy: 1 }, { dx: -1, dy: -1 },
                { dx: 1, dy: -1 }, { dx: -1, dy: 1 },
            ];
            
            let placed = false;
            for (const pos of positions) {
                const px = d.x + pos.dx;
                const py = d.y + pos.dy;
                
                if (px < 0 || px >= GAME_CONFIG.mapWidth || py < 0 || py >= GAME_CONFIG.mapHeight) continue;
                
                const hasUnit = this.getUnitAt(px, py);
                const hasSword = this.ubwSwords && this.ubwSwords.find(s => s.x === px && s.y === py);
                
                if (!hasUnit && !hasSword) {
                    this.spawnPorcelain(this.currentUnit, px, py);
                    placed = true;
                    this.addLog(`${d.name} 放置瓷器在 (${px}, ${py})`);
                    break;
                }
            }
            
            if (!placed) {
                this.actionText.setText('没有空位放置瓷器！');
            } else {
                this.actionText.setText('瓷器已放置，将吸收伤害');
            }
        } else {
            // 引爆瓷器
            const damage = d.porcelainEntity.damage || 0;
            if (damage > 0) {
                // 对范围内敌人造成伤害
                const px = d.porcelainEntity.x;
                const py = d.porcelainEntity.y;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const target = this.getUnitAt(px + dx, py + dy);
                        if (target && target.data.team !== d.team) {
                            this.dealDamage(target, damage);
                            this.showDamageNumber(target, damage);
                            this.addLog(`瓷器爆炸对${target.data.name}造成${damage}伤害`);
                        }
                    }
                }
                audioManager.playAttack();
            } else {
                this.addLog('瓷器没有积累伤害');
            }
            
            this.destroyPorcelain(this.currentUnit);
        }
        this.finishAction();
    }

    spawnPorcelain(owner, x, y) {
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const tileSize = GAME_CONFIG.tileSize;
        
        let porcelain;
        let targetScale = 1;
        
        if (this.textures.exists('ciqi')) {
            porcelain = this.add.image(posX, posY, 'ciqi');
            const targetSize = tileSize - 10;
            targetScale = Math.min(targetSize / porcelain.width, targetSize / porcelain.height);
        } else {
            porcelain = this.add.circle(posX, posY, tileSize / 3, 0xffffff);
            porcelain.setStrokeStyle(3, 0x9b59b6);
        }
        
        const hpBarBg = this.add.rectangle(posX, posY - 30, 52, 8, 0x333333);
        const hpBar = this.add.rectangle(posX, posY - 30, 0, 6, 0x9b59b6);
        const dmgText = this.add.text(posX, posY + 25, '0', {
            fontSize: '12px', fill: '#9b59b6', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        owner.data.porcelainEntity = {
            sprite: porcelain,
            x: x, y: y,
            damage: 0, maxDamage: 100,
            hpBar, hpBarBg, dmgText,
            owner: owner
        };
        
        // 先设置为不可见和缩放为0
        porcelain.setAlpha(0).setScale(0);
        
        // 动画到目标缩放
        this.tweens.add({
            targets: porcelain,
            alpha: 1,
            scale: targetScale,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    destroyPorcelain(owner) {
        const d = owner.data;
        if (d.porcelainEntity) {
            if (d.porcelainEntity.sprite) d.porcelainEntity.sprite.destroy();
            if (d.porcelainEntity.hpBar) d.porcelainEntity.hpBar.destroy();
            if (d.porcelainEntity.hpBarBg) d.porcelainEntity.hpBarBg.destroy();
            if (d.porcelainEntity.dmgText) d.porcelainEntity.dmgText.destroy();
            d.porcelainEntity = null;
        }
    }

    addDamageToPorcelain(owner, damage) {
        const d = owner.data;
        if (d.porcelainEntity) {
            const absorbed = Math.min(damage, d.porcelainEntity.maxDamage - d.porcelainEntity.damage);
            d.porcelainEntity.damage += absorbed;
            
            const percent = d.porcelainEntity.damage / d.porcelainEntity.maxDamage;
            d.porcelainEntity.hpBar.width = 50 * percent;
            d.porcelainEntity.dmgText.setText(d.porcelainEntity.damage.toString());
            
            return absorbed;
        }
        return 0;
    }

    useRoseSwordsman() {
        this.actionText.setText('选择玫瑰剑士目标');
        this.showRoseTargets();
        this.isSelectingRoseTarget = true;
        
        this.roseClickHandler = (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const roseTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'rose');
            if (roseTile) {
                this.input.off('pointerdown', this.roseClickHandler);
                this.clearHighlights();
                this.isSelectingRoseTarget = false;
                this.executeRoseSwordsman(tileX, tileY);
            }
        };
        
        this.input.on('pointerdown', this.roseClickHandler);
    }

    showRoseTargets() {
        this.clearHighlights();
        const d = this.currentUnit.data;
        
        // 高亮所有敌方单位
        this.units.forEach(unit => {
            if (unit.data && unit.data.team !== d.team) {
                const x = unit.data.x;
                const y = unit.data.y;
                const highlight = this.add.rectangle(
                    x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                    0xe91e63, 0.5
                );
                this.highlightTiles.push({ x, y, type: 'rose', highlight: highlight });
            }
        });
        
        // 如果有瓷器也可以选择
        if (d.porcelainEntity) {
            const px = d.porcelainEntity.x;
            const py = d.porcelainEntity.y;
            const highlight = this.add.rectangle(
                px * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                py * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                0x9b59b6, 0.5
            );
            this.highlightTiles.push({ x: px, y: py, type: 'rose', highlight: highlight });
        }
    }

    executeRoseSwordsman(targetX, targetY) {
        const d = this.currentUnit.data;
        
        // 计算基础伤害 3~18
        const baseDamage = rollFate(3);
        
        this.addLog(`${d.name} 玫瑰剑士: ${baseDamage}基础伤害`);
        
        // 显示五角星效果
        this.showStarEffect(targetX, targetY, () => {
            // 对5x5范围内所有敌人造成伤害
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const checkX = targetX + dx;
                    const checkY = targetY + dy;
                    
                    if (checkX < 0 || checkX >= GAME_CONFIG.mapWidth || 
                        checkY < 0 || checkY >= GAME_CONFIG.mapHeight) continue;
                    
                    const unit = this.getUnitAt(checkX, checkY);
                    if (unit && unit.data.team !== d.team) {
                        let damage = baseDamage;
                        
                        if (unit.data.roseMark) {
                            damage = Math.floor(damage * 1.5);
                            this.addLog(`${unit.data.name}有标记，伤害+50%`);
                        }
                        
                        this.dealDamage(unit, damage);
                        this.showDamageNumber(unit, damage);
                        unit.data.roseMark = { turns: 10 };
                        this.addLog(`${unit.data.name}受到${damage}伤害，施加标记`);
                    }
                    
                    // 瓷器吸收
                    if (d.porcelainEntity && d.porcelainEntity.x === checkX && d.porcelainEntity.y === checkY) {
                        const absorbed = this.addDamageToPorcelain(this.currentUnit, baseDamage);
                        this.addLog(`瓷器吸收${absorbed}伤害`);
                    }
                }
            }
            
            audioManager.playAttack();
            this.finishAction();
        });
    }
    
    // 五角星效果
    showStarEffect(centerX, centerY, callback) {
        const posX = centerX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = centerY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        // 创建五角星图形
        const star = this.add.graphics();
        star.lineStyle(3, 0xe91e63, 1);
        
        const radius = GAME_CONFIG.tileSize * 2.5;
        const points = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i * 144 - 90) * Math.PI / 180;
            points.push({
                x: posX + Math.cos(angle) * radius,
                y: posY + Math.sin(angle) * radius
            });
        }
        
        // 画五角星
        star.beginPath();
        star.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < 5; i++) {
            star.lineTo(points[i].x, points[i].y);
        }
        star.lineTo(points[0].x, points[0].y);
        star.strokePath();
        
        star.setAlpha(0);
        
        // 动画
        this.tweens.add({
            targets: star,
            alpha: 1,
            duration: 200,
            yoyo: true,
            hold: 300,
            onComplete: () => {
                star.destroy();
                if (callback) callback();
            }
        });
    }

    useDogLight() {
        const d = this.currentUnit.data;
        
        // 恢复NP 4~24
        const npGain = rollFate(4);
        
        d.np = Math.min(100, d.np + npGain);
        this.updateUnitBars(this.currentUnit);
        this.updateNobleButton();
        
        // 获得额外行动次数
        const extraActions = Phaser.Math.Between(1, 3);
        d.dogLightActions = extraActions;
        
        // 初始化技能封锁
        if (!d.sealedSkills) d.sealedSkills = {};
        
        this.addLog(`${d.name} 卷狗之光: NP+${npGain}，获得${extraActions}次额外行动`);
        this.addLog('警告：每次行动后将封锁一个技能3回合');
        this.actionText.setText(`额外行动: ${extraActions}次`);
        
        this.finishAction();
    }

    // 兰斯洛特技能1：骑士不留名
    useForAllOne() {
        const d = this.currentUnit.data;
        const skill = d.skills.find(s => s.effect === 'forAllOne');
        const duration = skill?.duration || 2;
        
        // 设置隐身状态
        d.forAllOne = duration;
        d.critNext = true;  // 下次攻击暴击
        d.rideMove = true;  // 移动后可再移动
        
        // 主动回NP (5~30)
        const npGain = rollFate(5);
        d.np = Math.min(100, d.np + npGain);
        this.updateUnitBars(this.currentUnit);
        
        // 视觉效果：半透明
        this.currentUnit.setAlpha(0.5);
        
        this.addLog(`${d.name} 骑士不留名: 隐身${duration}回合, NP+${npGain}`);
        this.addLog('效果: 免疫技能伤害、下次攻击暴击、移动后可再移动');
        this.actionText.setText(`隐身 ${duration} 回合, NP+${npGain}`);
        
        this.finishAction();
    }

    // 兰斯洛特技能2：无毁的湖光
    useArondight() {
        const d = this.currentUnit.data;
        const skill = d.skills.find(s => s.effect === 'arondight');
        
        // 随机护盾值 3~18 × 2
        let rolls = 0;
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            scene.diceDisplay.setVisible(true);
            rolls++;
            
            if (rolls >= 16) {
                clearInterval(rollAnim);
                const shieldValue = rollFate(skill?.shieldDice || 3) * (skill?.shieldMultiplier || 2);
                
                d.shield += shieldValue;
                d.arondightActive = true;
                d.atkBuff = (d.atkBuff || 0) + (skill?.atkBonus || 10);
                
                scene.updateUnitBars(scene.currentUnit);
                audioManager.playShield();
                
                scene.diceResultText.setText(`护盾: ${shieldValue}`);
                scene.addLog(`${d.name} 无毁的湖光: +${shieldValue}护盾`);
                scene.addLog('效果: 受击反弹30%伤害，攻击+10');
                scene.actionText.setText(`阿隆戴特装备! 护盾+${shieldValue}`);
                
                scene.finishAction();
            }
        }, 80);
    }

    // 兰斯洛特技能3：永恒之臂
    useKnightOfOwner() {
        const d = this.currentUnit.data;
        const skill = d.skills.find(s => s.effect === 'knightOfOwner');
        const sealDuration = skill?.sealDuration || 3;
        
        // 显示敌方单位选择
        this.clearHighlights();
        const enemies = this.units.filter(u => u.data.team !== d.team);
        
        if (enemies.length === 0) {
            this.actionText.setText('没有可夺取宝具的目标');
            this.finishAction();
            return;
        }
        
        // 高亮所有敌人
        enemies.forEach(enemy => {
            const x = enemy.data.x;
            const y = enemy.data.y;
            const highlight = this.add.rectangle(
                x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                GAME_CONFIG.tileSize - 4,
                GAME_CONFIG.tileSize - 4,
                0x9b59b6, 0.5
            );
            this.highlightTiles.push({ x, y, type: 'target', highlight: highlight });
        });
        
        this.actionText.setText('选择要夺取宝具的敌人');
        
        // 设置点击监听
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            const target = this.getUnitAt(tileX, tileY);
            
            this.clearHighlights();
            
            if (target && target.data.team !== d.team) {
                // 夺取宝具
                d.stolenNoble = {
                    noble: JSON.parse(JSON.stringify(target.data.noble)),
                    fromUnit: target.data.name,
                    turnsLeft: sealDuration
                };
                
                // 封印敌方宝具
                target.data.nobleSeal = sealDuration;
                
                this.addLog(`${d.name} 永恒之臂: 夺取了 ${target.data.name} 的宝具!`);
                this.addLog(`${target.data.name} 的宝具被封印 ${sealDuration} 回合`);
                this.actionText.setText(`夺取宝具: ${d.stolenNoble.noble.name}`);
                
                // 视觉效果
                this.showStealEffect(target);
            } else {
                this.addLog('取消夺取');
            }
            
            this.finishAction();
        });
    }

    // 夺取宝具视觉效果
    showStealEffect(target) {
        const x = target.x;
        const y = target.y;
        
        // 紫色光环效果
        const ring = this.add.circle(x, y, 40, 0x9b59b6, 0.8);
        this.tweens.add({
            targets: ring,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });
    }

    // ========== 韩信技能 ==========
    
    // 韩信技能1：暗度陈仓
    useSecretPath() {
        const d = this.currentUnit.data;
        const unit = this.currentUnit;
        
        this.actionText.setText('暗度陈仓：选择瞬移位置');
        this.clearHighlights();
        
        // 高亮所有空位
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                if (!this.getUnitAt(x, y) && (x !== d.x || y !== d.y)) {
                    const highlight = this.createPulseHighlight(x, y, 0x1f6f78, 0.24, 0xf6d365, 12);
                    this.highlightTiles.push({ x, y, type: 'teleport', highlight });
                }
            }
        }
        
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const tile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'teleport');
            this.clearHighlights();
            
            if (tile) {
                // 瞬移效果：消失再出现
                const allTargets = [unit, d.border, d.hpBar, d.hpBarBg, d.npBar, d.npBarBg, d.shieldBar];
                const originX = unit.x;
                const originY = unit.y;
                const posX = tileX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                const posY = tileY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;

                this.createTacticalPathEffect(originX, originY, posX, posY, 0x63e6be, 0xf6d365);
                this.createMoveTrail(originX, originY, posX, posY, 0x63e6be);
                this.createFormationSigilAt(originX, originY, 0x63e6be, 0xf6d365, 28, 1242, 360);
                this.playScreenPulse(0x63e6be, 0.08, 130);
                this.showCombatText(unit, '暗渡', '#7ef5d8', '17px');
                
                this.tweens.add({
                    targets: allTargets,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => {
                        // 更新位置数据
                        d.x = tileX;
                        d.y = tileY;
                        
                        // 直接设置新位置
                        unit.x = posX;
                        unit.y = posY;
                        d.border.x = posX;
                        d.border.y = posY;
                        d.hpBar.x = posX;
                        d.hpBar.y = posY - 35;
                        d.hpBarBg.x = posX;
                        d.hpBarBg.y = posY - 35;
                        d.npBar.x = posX - 25;
                        d.npBar.y = posY - 26;
                        d.npBarBg.x = posX;
                        d.npBarBg.y = posY - 26;
                        d.shieldBar.x = posX - 25;
                        d.shieldBar.y = posY - 42;
                        
                        // 再出现
                        this.tweens.add({
                            targets: allTargets,
                            alpha: 1,
                            duration: 150,
                            onComplete: () => {
                                this.createRadialBurstAt(posX, posY, 0xf6d365, 58, 10, 1243);
                                this.createFormationSigilAt(posX, posY, 0x63e6be, 0xf6d365, 34, 1244, 420);
                                this.shakeCamera(100, 0.0032);
                            }
                        });
                    }
                });
                
                // 设置暗度陈仓状态：下次行动强制普攻，伤害×2，回复等量NP，扣除伤害一半HP
                d.secretPathActive = true;
                
                this.addLog(`${d.name} 暗度陈仓: 瞬移成功!`);
                this.addLog('下次行动将变为普攻(伤害×2, 回复等量NP, 扣除伤害一半HP)');
                this.actionText.setText('瞬移完成! 下次行动变为强化普攻');
                
                const scene = this;
                setTimeout(() => scene.finishAction(), 500);
            } else {
                this.addLog('取消瞬移');
                this.finishAction();
            }
        });
    }
    
    // 韩信技能2：背水一战
    useLastStand() {
        const d = this.currentUnit.data;
        
        // 用基础HP（100）计算损失，而不是无上限的maxHp
        const baseHp = 100;
        const lostHp = Math.max(0, baseHp - d.hp);
        const damageBonus = lostHp; // 损失的HP直接转为攻击加成
        
        // 添加攻击加成
        d.atkBuff = (d.atkBuff || 0) + damageBonus;
        d.lastStandBonus = (d.lastStandBonus || 0) + damageBonus;

        this.createImpactEffect(this.currentUnit, 0x63e6be, {
            radius: 68,
            shake: true,
            shakeDuration: 110,
            shakeIntensity: 0.0038,
            pulseAlpha: 0.1,
            sparkCount: 12
        });
        this.createFormationSigilAt(this.currentUnit.x, this.currentUnit.y, 0x63e6be, 0xf6d365, 36, 1243, 420);
        this.showCombatText(this.currentUnit, `ATK+${damageBonus}`, '#f6d365', '18px');

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const banner = this.add.rectangle(this.currentUnit.x, this.currentUnit.y, 10, 34, 0xf6d365, 0.7).setDepth(1239);
            banner.setRotation(angle);
            this.tweens.add({
                targets: banner,
                x: this.currentUnit.x + Math.cos(angle) * 54,
                y: this.currentUnit.y + Math.sin(angle) * 54,
                alpha: 0,
                scaleY: 1.4,
                duration: 360,
                ease: 'Cubic.easeOut',
                onComplete: () => banner.destroy()
            });
        }
        
        this.addLog(`${d.name} 背水一战: 损失${lostHp}HP`);
        this.addLog(`攻击力+${damageBonus}! (总计+${d.atkBuff})`);
        
        // HP低于30时获得战斗续行（可叠加）
        if (d.hp <= 30) {
            d.gutsCount = (d.gutsCount || 0) + 1;
            this.showCombatText(this.currentUnit, `GUTS+${d.gutsCount}`, '#7ef5d8', '16px');
            this.addLog(`HP危急! 获得战斗续行! (共${d.gutsCount}次)`);
            this.actionText.setText(`背水一战! 攻击+${damageBonus}, 战斗续行${d.gutsCount}次!`);
        } else {
            this.actionText.setText(`背水一战! 攻击+${damageBonus}`);
        }
        
        this.time.delayedCall(260, () => this.finishAction());
    }
    
    // 韩信技能3：十面埋伏 - 玩家手动选择位置
    useAmbush() {
        const d = this.currentUnit.data;
        const skill = d.skills.find(s => s.effect === 'ambush');
        const maxTraps = skill?.maxTraps || 10;
        
        // 初始化陷阱数组
        if (!this.ambushTraps) this.ambushTraps = [];
        
        // 检查当前陷阱数量
        const currentTraps = this.ambushTraps.filter(t => t.ownerTeam === this.currentUnit.data.team).length;
        if (currentTraps >= maxTraps) {
            this.addLog('陷阱已达上限(10个)!');
            this.actionText.setText('陷阱已达上限!');
            this.finishAction();
            return;
        }
        
        // 本次可放置的陷阱数量 (3~6个，但不超过上限)
        const trapCount = Math.min(Phaser.Math.Between(3, 6), maxTraps - currentTraps);

        this.showCombatText(this.currentUnit, '布阵', '#f6d365', '17px');
        this.playScreenPulse(0x4a2316, 0.06, 110);
        
        this.addLog(`十面埋伏: 可布置${trapCount}个陷阱`);
        this.actionText.setText(`点击地图放置陷阱 (0/${trapCount})，点击空白处结束`);
        
        // 高亮可放置的位置（5格范围内）
        this.clearHighlights();
        const range = 5;
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const tx = d.x + dx;
                const ty = d.y + dy;
                const dist = Math.abs(dx) + Math.abs(dy);
                
                if (dist <= range && dist > 0 &&
                    tx >= 0 && tx < GAME_CONFIG.mapWidth && 
                    ty >= 0 && ty < GAME_CONFIG.mapHeight &&
                    !this.getUnitAt(tx, ty) &&
                    !this.ambushTraps.some(t => t.x === tx && t.y === ty)) {
                    const highlight = this.createPulseHighlight(tx, ty, 0x4a1610, 0.24, 0xf6d365, 10);
                    this.highlightTiles.push({ x: tx, y: ty, type: 'trap', highlight });
                }
            }
        }
        
        // 设置放置陷阱状态
        this.placingTraps = true;
        this.trapSkill = skill;
        this.maxTrapsCount = trapCount;
        this.placedTrapsCount = 0;
        this.trapOwner = this.currentUnit;
        
        // 开始监听陷阱放置
        this.setupTrapPlacementInput();
    }
    
    // 处理陷阱放置输入
    setupTrapPlacementInput() {
        this.input.once('pointerdown', (pointer) => {
            if (!this.placingTraps) return;
            
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const tile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'trap');
            
            if (tile) {
                // 创建陷阱
                const trapSprite = this.createAmbushTrapSprite(tileX, tileY, this.trapOwner.data.team);
                this.createFormationSigilAt(trapSprite.x, trapSprite.y, 0x63e6be, 0xf6d365, 28, 1241, 360);
                this.createRadialBurstAt(trapSprite.x, trapSprite.y, 0xf6d365, 42, 6, 1240);
                
                this.ambushTraps.push({
                    x: tileX,
                    y: tileY,
                    ownerTeam: this.trapOwner.data.team,
                    sprite: trapSprite,
                    rootDuration: this.trapSkill?.rootDuration || 1
                });
                
                // 移除该位置的高亮
                tile.highlight.destroy();
                this.highlightTiles = this.highlightTiles.filter(t => t !== tile);
                
                this.placedTrapsCount++;
                this.addLog(`在(${tileX},${tileY})布置陷阱 (${this.placedTrapsCount}/${this.maxTrapsCount})`);
                this.actionText.setText(`点击地图放置陷阱 (${this.placedTrapsCount}/${this.maxTrapsCount})`);
                
                // 更新陷阱可见性
                this.updateTrapVisibility();
                
                if (this.placedTrapsCount >= this.maxTrapsCount) {
                    // 达到本次上限，结束布置
                    this.finishTrapPlacement();
                } else {
                    // 继续监听
                    this.setupTrapPlacementInput();
                }
            } else {
                // 点击非高亮区域，结束布置
                this.finishTrapPlacement();
            }
        });
    }
    
    // 结束陷阱放置
    finishTrapPlacement() {
        this.clearHighlights();
        this.placingTraps = false;
        
        if (this.placedTrapsCount > 0) {
            const totalTraps = this.ambushTraps.filter(t => t.ownerTeam === this.trapOwner.data.team).length;
            this.addLog(`布置完成! 本次${this.placedTrapsCount}个，总计${totalTraps}/10`);
            this.actionText.setText(`布置${this.placedTrapsCount}个陷阱完成!`);
        } else {
            this.addLog('取消布置陷阱');
            this.actionText.setText('');
        }
        
        this.finishAction();
    }
    
    // 更新陷阱可见性（只对放置者队伍可见）
    updateTrapVisibility() {
        if (!this.ambushTraps) return;
        
        this.ambushTraps.forEach(trap => {
            if (trap.sprite) {
                // 陷阱只对放置者的队伍可见
                const isVisible = this.currentTurn === trap.ownerTeam;
                trap.sprite.setVisible(isVisible);
            }
        });
    }
    
    // 检查陷阱触发
    checkAmbushTraps(unit) {
        if (!this.ambushTraps || this.ambushTraps.length === 0) return;
        
        const triggeredTraps = this.ambushTraps.filter(trap => 
            trap.x === unit.data.x && trap.y === unit.data.y && 
            trap.ownerTeam !== unit.data.team
        );
        
        triggeredTraps.forEach(trap => {
            const damage = rollFate(3);
            const trapX = trap.sprite ? trap.sprite.x : unit.x;
            const trapY = trap.sprite ? trap.sprite.y : unit.y;

            if (trap.sprite) {
                trap.sprite.setVisible(true);
            }

            this.createSlashTrail(trapX, trapY, unit.x, unit.y, 0x63e6be, 18);
            this.createFormationSigilAt(trapX, trapY, 0x63e6be, 0xf6d365, 30, 1242, 320);
            this.createImpactEffect(unit, 0xf6d365, {
                radius: 72,
                shake: true,
                shakeDuration: 130,
                shakeIntensity: 0.0045,
                pulseAlpha: 0.11,
                sparkCount: 12
            });
            this.showCombatText(unit, '伏兵', '#f6d365', '18px');

            this.dealDamage(unit, damage, 'skill');
            this.showDamageNumber(unit, damage);
            
            // 定身效果
            unit.data.rooted = (unit.data.rooted || 0) + trap.rootDuration;
            
            this.addLog(`${unit.data.name} 触发陷阱! 受到${damage}伤害并被定身${trap.rootDuration}回合!`);
            
            // 移除陷阱
            if (trap.sprite) {
                this.tweens.add({
                    targets: trap.sprite,
                    scaleX: 1.35,
                    scaleY: 1.35,
                    alpha: 0,
                    duration: 180,
                    ease: 'Quad.easeOut',
                    onComplete: () => trap.sprite.destroy()
                });
            }
            this.ambushTraps = this.ambushTraps.filter(t => t !== trap);
        });
    }
    
    // 更新陷阱（陷阱永久存在，不需要更新持续时间）
    updateAmbushTraps() {
        // 陷阱现在永久存在直到触发，不需要更新
    }

    // ================================================================
    // 水月无影 - 固有时域制（时间停止）
    // ================================================================
    useTimeStop(skill) {
        const d = this.currentUnit.data;
        // 随机持续 2~3 回合，随机攻击加成 5~15
        const duration = Phaser.Math.Between(2, 3);
        const atkBonus = Phaser.Math.Between(5, 15);

        this.timeStopTurns = duration;
        this.timeStopCaster = this.currentUnit;
        d.atkBuff = (d.atkBuff || 0) + atkBonus;

        audioManager.playSkill();
        // 时间停止特效：大范围冰蓝色波纹
        this.createRadialBurstAt(d.x, d.y, 0x88ccff, 100, 18, 1800);
        this.createRadialBurstAt(d.x, d.y, 0xb8a9d4, 60, 12, 1200);
        this.playScreenPulse(0x88ccff, 0.15, 250);
        this.shakeCamera(80, 0.0012);

        this.addLog(`${d.name} 发动固有时域制！时间停止${duration}回合！`);
        this.addLog(`攻击力+${atkBonus}`);
        this.actionText.setText(`⏱ 时间停止! ${duration}回合 +${atkBonus}攻`);
        this.finishAction();
    }

    // ================================================================
    // 水月无影 - 月瞳·城临（千年城）
    // ================================================================
    useMillenniumCastle(skill) {
        const d = this.currentUnit.data;
        // 随机持续 2~4 回合
        const duration = Phaser.Math.Between(2, 4);

        this.millenniumCastleActive = true;
        this.millenniumCastleTurns = duration;
        this.millenniumCastleCaster = this.currentUnit;
        this.millenniumCastleBurnMin = skill.burnMin || 10;
        this.millenniumCastleBurnMax = skill.burnMax || 20;
        this.millenniumCastleNpMin = skill.npRegenMin || 5;
        this.millenniumCastleNpMax = skill.npRegenMax || 15;

        // 保存原始地图颜色
        this.millenniumCastleOriginalTiles = [];
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            this.millenniumCastleOriginalTiles[y] = [];
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.millenniumCastleOriginalTiles[y][x] = this.map[y][x].baseColor;
            }
        }

        const mapPixelW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const mapPixelH = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        const centerX = mapPixelW / 2;
        const centerY = mapPixelH / 2;

        // 城堡背景图覆盖整个地图（没有图片则用渐变矩形）
        if (this.millenniumCastleBg) this.millenniumCastleBg.destroy();
        if (this.textures.exists('millennium_castle_bg')) {
            this.millenniumCastleBg = this.add.image(centerX, centerY, 'millennium_castle_bg');
            this.millenniumCastleBg.setDisplaySize(mapPixelW, mapPixelH);
            this.millenniumCastleBg.setDepth(-0.5);
            this.millenniumCastleBg.setAlpha(0);
            this.tweens.add({
                targets: this.millenniumCastleBg,
                alpha: 0.45,
                duration: 800,
                ease: 'Quad.easeIn'
            });
        } else {
            // 回退：紫色渐变矩形
            console.log('millennium_castle_bg not loaded, using fallback rectangle');
            this.millenniumCastleBg = this.add.rectangle(centerX, centerY, mapPixelW, mapPixelH, 0x1a0a2e, 0.3);
            this.millenniumCastleBg.setDepth(-0.5);
        }

        // 逐个瓦片变色动画（城堡风格：暗紫/灰）
        const castleColors = [0x2a1a3e, 0x1e1430, 0x332044, 0x261838, 0x2d1c3a, 0x1f1232];
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const tile = this.map[y][x].tile;
                const newColor = castleColors[(x * 7 + y * 13) % castleColors.length];
                this.map[y][x].baseColor = newColor;
                const dist = BattleCore.manhattanDistance({ x: d.x, y: d.y }, { x, y });
                const delay = dist * 30;
                // 用延时 + setFillStyle 替代 tween fillColor
                this.time.delayedCall(delay, () => {
                    tile.setFillStyle(newColor, 0.6);
                    tile.setStrokeStyle(1.5, 0x6c3483, 0.4);
                });
            }
        }

        audioManager.playSkill();
        this.createRadialBurstAt(d.x, d.y, 0x6c3483, 120, 20, 1800);
        this.playScreenPulse(0x6c3483, 0.18, 300);
        this.shakeCamera(150, 0.002);

        this.addLog(`${d.name} 展开千年城！持续${duration}回合`);
        this.addLog('敌方每回合扣血且无法使用宝具');
        this.actionText.setText(`千年城展开! ${duration}回合`);
        this.finishAction();
    }

    // 处理千年城效果（在回合开始时调用）
    processMillenniumCastle(team) {
        if (!this.millenniumCastleActive || this.millenniumCastleTurns <= 0) return;

        const caster = this.millenniumCastleCaster;
        if (!caster || !caster.data) {
            this.endMillenniumCastle();
            return;
        }

        // 对敌方造成持续伤害
        const enemies = this.units.filter(u => u.data && u.data.team !== caster.data.team);
        enemies.forEach(e => {
            const burnDmg = Phaser.Math.Between(this.millenniumCastleBurnMin, this.millenniumCastleBurnMax);
            e.data.hp -= burnDmg;
            this.updateUnitBars(e);
            this.showDamageNumber(e, burnDmg);
            this.addLog(`${e.data.name} 受到千年城侵蚀 ${burnDmg} 伤害`);
            if (e.data.hp <= 0) {
                this.addLog(`${e.data.name} 被千年城吞噬!`);
                audioManager.playDeath();
                this.destroyUnit(e);
            }
        });

        // 封印敌方宝具
        enemies.forEach(e => {
            if (!e.data.nobleSeal || e.data.nobleSeal <= 0) {
                e.data.nobleSeal = 1;
            }
        });

        // 施法者恢复NP
        const npRegen = Phaser.Math.Between(this.millenniumCastleNpMin, this.millenniumCastleNpMax);
        caster.data.np = Math.min((caster.data.maxNp === Infinity ? 200 : caster.data.maxNp) || 100,
            caster.data.np + npRegen);
        this.updateUnitBars(caster);
        this.addLog(`${caster.data.name} 在千年城中恢复 ${npRegen} NP`);

        // 回合递减
        this.millenniumCastleTurns--;
        if (this.millenniumCastleTurns <= 0) {
            this.endMillenniumCastle();
        }
    }

    endMillenniumCastle() {
        this.millenniumCastleActive = false;
        this.millenniumCastleTurns = 0;

        // 渐隐城堡背景
        if (this.millenniumCastleBg) {
            this.tweens.add({
                targets: this.millenniumCastleBg,
                alpha: 0,
                duration: 600,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    if (this.millenniumCastleBg) {
                        this.millenniumCastleBg.destroy();
                        this.millenniumCastleBg = null;
                    }
                }
            });
        }

        // 逐个恢复原始地图颜色
        if (this.millenniumCastleOriginalTiles) {
            for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
                for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                    const origColor = this.millenniumCastleOriginalTiles[y]?.[x];
                    if (origColor !== undefined && this.map[y]?.[x]) {
                        const tile = this.map[y][x].tile;
                        this.map[y][x].baseColor = origColor;
                        const dist = BattleCore.manhattanDistance(
                            { x: Math.floor(GAME_CONFIG.mapWidth / 2), y: Math.floor(GAME_CONFIG.mapHeight / 2) },
                            { x, y }
                        );
                        this.time.delayedCall(dist * 20, () => {
                            tile.setFillStyle(origColor, 1);
                            tile.setStrokeStyle(1, 0x101722, 0.82);
                        });
                    }
                }
            }
        }

        this.addLog('千年城消散了...');
    }

    // ================================================================
    // 水月无影 - 月影（分身）
    // ================================================================
    useMoonShadow() {
        const d = this.currentUnit.data;

        // 分身不能再创建分身
        if (d.isClone) {
            this.actionText.setText('分身无法再次分身');
            this.addLog('分身无法使用月影');
            this.finishAction();
            return;
        }

        // 随机消耗 25%~50% HP
        const hpRatio = Phaser.Math.Between(25, 50) / 100;
        const hpCost = Math.floor(d.hp * hpRatio);

        if (d.hp <= hpCost) {
            this.actionText.setText('HP不足，无法召唤分身');
            this.addLog('HP不足，月影发动失败');
            this.finishAction();
            return;
        }

        // 消耗一半HP
        d.hp -= hpCost;
        this.updateUnitBars(this.currentUnit);
        this.showDamageNumber(this.currentUnit, hpCost);

        // 找相邻空格
        const adjPos = this.findAdjacentEmptyTile(d.x, d.y);
        if (!adjPos) {
            this.actionText.setText('周围无空位，分身召唤失败');
            this.addLog('周围没有空间召唤分身');
            // 返还HP
            d.hp += hpCost;
            this.updateUnitBars(this.currentUnit);
            this.finishAction();
            return;
        }

        // 创建分身
        const clone = this.createCloneUnit(adjPos.x, adjPos.y, d.team, d.charId, this.currentUnit);

        audioManager.playSkill();
        this.createRadialBurstAt(adjPos.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            adjPos.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            0xb8a9d4, 60, 12, 1200);

        this.addLog(`${d.name} 消耗${hpCost}HP(${Math.round(hpRatio * 100)}%)，召唤月之分身！`);
        this.addLog(`分身HP:${clone.data.hp} NP:${clone.data.np}`);
        this.actionText.setText('分身召唤完成!');
        this.finishAction();
    }

    // 寻找相邻空格
    // 找距施法者 2 格（隔一格）的空位用于召唤分身
    findAdjacentEmptyTile(x, y) {
        const candidates = [];
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist !== 2) continue; // 只要距离恰好为 2 的格子
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < GAME_CONFIG.mapWidth &&
                    ny >= 0 && ny < GAME_CONFIG.mapHeight &&
                    !this.getUnitAt(nx, ny) &&
                    this.map[ny] && this.map[ny][nx] && this.map[ny][nx].walkable) {
                    candidates.push({ x: nx, y: ny });
                }
            }
        }
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // 创建分身单位
    createCloneUnit(x, y, team, charId, originalUnit) {
        const charData = CHARACTERS[charId];
        const classData = CLASS_CONFIG[charData.class];
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;

        let sprite;
        let portraitH = 0;
        if (charData.avatar && this.textures.exists(charId)) {
            const tex = this.textures.get(charId);
            const texW = tex.getSourceImage().width;
            const texH = tex.getSourceImage().height;
            const aspectRatio = texW / texH;
            const displayW = GAME_CONFIG.tileSize - 6;
            const displayH = Math.min(displayW / (texW / texH), GAME_CONFIG.tileSize - 6);
            portraitH = displayH;
            sprite = this.add.image(posX, posY - displayH * 0.12, charId);
            sprite.setDisplaySize(displayW, displayH);
            if (aspectRatio < 0.85) {
                sprite.setOrigin(0.5, 0.32);
            }
        } else {
            sprite = this.add.circle(posX, posY, GAME_CONFIG.tileSize / 3, classData.color);
        }
        sprite.setDepth(8);
        sprite.setAlpha(0.65); // 半透明表示分身
        sprite.setTint(0xccbbff); // 淡紫色 tint 区分本体

        const borderH = portraitH > 0 ? portraitH + 12 : GAME_CONFIG.tileSize - 6;
        const borderY = posY;
        const border = this.add.rectangle(posX, borderY, GAME_CONFIG.tileSize - 6, borderH);
        border.setStrokeStyle(2.5, 0xb8a9d4, 0.9);
        border.setFillStyle(0x2a1a4e, 0.25);
        border.setDepth(7);

        // 分身标签
        const cloneLabel = this.add.text(posX, posY + GAME_CONFIG.tileSize / 2 - 4, '分身', {
            fontSize: '9px',
            fill: '#b8a9d4',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(12);

        const hpBarBg = this.add.rectangle(posX, posY - 35, 42, 6, 0x101722, 0.9).setDepth(10);
        hpBarBg.setStrokeStyle(1, 0x000000, 0.45);
        const hpBar = this.add.rectangle(posX, posY - 35, 40, 4, 0x9b59b6).setDepth(11);

        const npBarBg = this.add.rectangle(posX, posY - 26, 42, 5, 0x101722, 0.9).setDepth(10);
        npBarBg.setStrokeStyle(1, 0x000000, 0.35);
        const npBar = this.add.rectangle(posX - 20, posY - 26, 0, 3, C.gold2).setDepth(11);
        npBar.setOrigin(0, 0.5);

        const shieldBar = this.add.rectangle(posX - 20, posY - 42, 0, 3, C.blue).setDepth(11);
        shieldBar.setOrigin(0, 0.5);

        sprite.data = {
            x, y, team, charId,
            name: charData.name + '(分身)',
            className: classData.name,
            class: charData.class,
            hp: originalUnit.data.hp,
            maxHp: originalUnit.data.maxHp,
            np: originalUnit.data.np,
            maxNp: originalUnit.data.maxNp,
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
            isClone: true,
            cloneMaster: originalUnit,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border, cloneLabel
        };

        // 浮动动画
        sprite.data.idleTween = this.tweens.add({
            targets: [sprite, border, hpBar, hpBarBg, npBar, npBarBg, shieldBar],
            y: '-=2',
            duration: 1600 + Math.random() * 500,
            yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut',
            delay: Math.random() * 600
        });

        this.units.push(sprite);
        return sprite;
    }

    // ================================================================
    // 水月无影 - 宝具：月淮泉·花影（7分身）
    // ================================================================
    useMoonSpringFlowers(noble) {
        const d = this.currentUnit.data;
        const cloneCount = Phaser.Math.Between(5, 7);
        const exitDamageMin = noble.exitDamageMin || 20;
        const exitDamageMax = noble.exitDamageMax || 40;
        const inCastle = this.millenniumCastleActive && this.millenniumCastleTurns > 0;

        audioManager.playNoble();

        // 华丽登场效果
        this.createRadialBurstAt(d.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            d.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            0xd4b8f0, 120, 18, 2000);
        this.playScreenPulse(0xb8a9d4, 0.22, 300);
        this.shakeCamera(200, 0.003);

        this.addLog(`${d.name} 发动宝具: 月淮泉·花影！`);
        this.addLog(`召唤${cloneCount}个月之分身！`);

        const clones = [];
        const scene = this;
        for (let i = 0; i < cloneCount; i++) {
            this.time.delayedCall(i * 120, () => {
                const pos = scene.findAdjacentEmptyTile(d.x, d.y);
                if (pos) {
                    const clone = scene.createCloneUnit(pos.x, pos.y, d.team, d.charId, scene.currentUnit);
                    clone.data.isNobleClone = true;
                    clone.data.nobleCloneTurns = (noble.duration || 1);
                    clone.data.nobleCloneExitMin = exitDamageMin;
                    clone.data.nobleCloneExitMax = exitDamageMax;
                    clone.data.nobleCloneInCastle = inCastle;
                    clone.data.name = CHARACTERS[d.charId].name + '(花影)';
                    clone.data.np = 0;
                    clone.setAlpha(0); // 初始透明，然后渐显
                    scene.tweens.add({ targets: clone, alpha: 0.65, duration: 300, ease: 'Quad.easeOut' });
                    clones.push(clone);

                    // 每个分身的登场特效
                    const px = pos.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                    const py = pos.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                    scene.createRadialBurstAt(px, py, 0xd4b8f0, 55, 10, 1000);
                    scene.createRadialBurstAt(px, py, 0xb8a9d4, 30, 6, 600);
                }
            });
        }

        if (inCastle) this.addLog('千年城中！退场伤害增强');

        this.time.delayedCall(cloneCount * 120 + 400, () => {
            scene.addLog(`成功召唤${clones.length}个花影分身`);
            scene.actionText.setText(`🌸 花影! ${clones.length}分身`);
            scene.finishAction();
        });
    }

    // 宝具分身退场处理（在回合切换时调用）
    processNobleClones() {
        const nobleClones = this.units.filter(u => u.data && u.data.isNobleClone);
        if (nobleClones.length === 0) return;

        nobleClones.forEach(clone => {
            clone.data.nobleCloneTurns--;
            if (clone.data.nobleCloneTurns <= 0) {
                // 分身退场
                if (clone.data.nobleCloneInCastle) {
                    const exitDmg = Phaser.Math.Between(
                        clone.data.nobleCloneExitMin,
                        clone.data.nobleCloneExitMax
                    );
                    const enemies = this.units.filter(u =>
                        u.data && u.data.team !== clone.data.team && !u.data.isClone && !u.data.isNobleClone
                    );
                    enemies.forEach(e => {
                        const dist = BattleCore.manhattanDistance(
                            { x: clone.data.x, y: clone.data.y },
                            { x: e.data.x, y: e.data.y }
                        );
                        if (dist <= 2) {
                            this.dealDamage(e, exitDmg, 'noble');
                            this.showDamageNumber(e, exitDmg);
                            // 退场爆发特效
                            this.createRadialBurstAt(e.x, e.y, 0xd4b8f0, 45, 8, 800);
                            this.createRadialBurstAt(e.x, e.y, 0xb8a9d4, 20, 4, 400);
                        }
                    });
                    this.addLog(`花影退场: 千年城共鸣 ${exitDmg} 伤害`);
                }
                this.destroyCloneUnit(clone);
            }
        });
    }

    // 销毁分身单位
    destroyCloneUnit(unit) {
        if (!unit || !unit.data) return;
        const d = unit.data;

        // 如果是月影分身（非宝具分身），转移NP给本体
        if (d.isClone && !d.isNobleClone && d.cloneMaster && d.cloneMaster.data) {
            const transferNp = d.np || 0;
            if (transferNp > 0) {
                const masterMaxNp = d.cloneMaster.data.maxNp === Infinity ? 200 :
                    (d.cloneMaster.data.maxNp || 100);
                d.cloneMaster.data.np = Math.min(masterMaxNp,
                    (d.cloneMaster.data.np || 0) + transferNp);
                this.updateUnitBars(d.cloneMaster);
                this.addLog(`分身NP(${transferNp})转移至本体`);
            }
        }

        // 停止动画
        if (d.idleTween) d.idleTween.stop();
        if (d.selectTween) d.selectTween.stop();

        // 销毁视觉元素
        const elements = [unit, d.border, d.hpBar, d.hpBarBg, d.npBar, d.npBarBg, d.shieldBar, d.cloneLabel];
        elements.forEach(el => {
            if (el) {
                this.tweens.add({
                    targets: el,
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    duration: 300,
                    ease: 'Quad.easeIn',
                    onComplete: () => el.destroy()
                });
            }
        });

        // 从数组中移除
        this.units = this.units.filter(u => u !== unit);

        // 如果当前选中单位是这个分身，清除选中
        if (this.currentUnit === unit) {
            this.currentUnit = null;
        }
    }

    useHeleweiBurst(noble) {
        const d = this.currentUnit.data;
        
        // 设置强制攻击状态
        d.heleweiBurst = {
            forcedAttacks: noble.forcedAttacks || 3,
            poisonDamage: noble.poisonDamage || 8,
            poisonTurns: noble.poisonTurns || 3,
            slowAmount: noble.slowAmount || 1
        };
        
        // 检查敌人是否有玫瑰标记
        const enemies = this.units.filter(u => u.data.team !== d.team);
        const hasRoseMark = enemies.some(e => e.data.roseMark);
        if (hasRoseMark) {
            d.heleweiBurst.aoeMode = true;
            this.addLog('检测到玫瑰标记！伤害将变为范围伤害');
        }
        
        this.addLog(`${d.name} 何乐不为·有何不为 激活！`);
        this.addLog(`接下来${d.heleweiBurst.forcedAttacks}次行动强制变为普通攻击`);
        this.addLog('攻击将附加中毒和减速效果');
        
        this.actionText.setText(`强制攻击剩余: ${d.heleweiBurst.forcedAttacks}次`);
        this.finishAction();
    }

    // 执行强制攻击（何乐为宝具效果）
    performForcedAttack(target) {
        const d = this.currentUnit.data;
        if (!d.heleweiBurst || d.heleweiBurst.forcedAttacks <= 0) return;
        
        // 计算随机伤害
        let baseDamage = rollFate(d.diceCount);
        
        console.log(`[performForcedAttack] 基础伤害: ${baseDamage}, 随机强度: ${d.diceCount}`);
        this.addLog(`${d.name} 强制攻击: ${baseDamage}基础伤害`);
        
        // 范围攻击（以目标为中心3x3）
        const centerX = target.data.x;
        const centerY = target.data.y;
        const hitTargets = [];
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = centerX + dx;
                const checkY = centerY + dy;
                
                if (checkX < 0 || checkX >= GAME_CONFIG.mapWidth || 
                    checkY < 0 || checkY >= GAME_CONFIG.mapHeight) continue;
                
                const unit = this.getUnitAt(checkX, checkY);
                if (unit && unit.data.team !== d.team) {
                    console.log(`[performForcedAttack] 命中 ${unit.data.name} 在 (${checkX}, ${checkY}), 造成 ${baseDamage} 伤害`);
                    this.dealDamage(unit, baseDamage);
                    this.showDamageNumber(unit, baseDamage);
                    
                    // 施加中毒
                    unit.data.poison = {
                        damage: d.heleweiBurst.poisonDamage,
                        turns: d.heleweiBurst.poisonTurns
                    };
                    
                    // 施加减速
                    unit.data.slow = {
                        amount: d.heleweiBurst.slowAmount,
                        turns: 3
                    };
                    
                    hitTargets.push(unit.data.name);
                }
                
                // 瓷器吸收
                if (d.porcelainEntity && d.porcelainEntity.x === checkX && d.porcelainEntity.y === checkY) {
                    const absorbed = this.addDamageToPorcelain(this.currentUnit, baseDamage);
                    hitTargets.push(`瓷器(${absorbed})`);
                }
            }
        }
        
        audioManager.playAttack();
        
        if (hitTargets.length > 0) {
            this.addLog(`范围命中: ${hitTargets.join(', ')} + 中毒 + 减速`);
        }
        
        d.heleweiBurst.forcedAttacks--;
        
        if (d.heleweiBurst.forcedAttacks <= 0) {
            this.addLog('宝具效果结束');
            d.heleweiBurst = null;
        } else {
            this.actionText.setText(`强制攻击剩余: ${d.heleweiBurst.forcedAttacks}次`);
        }
    }
    
    // 执行暗度陈仓攻击（韩信）
    performSecretPathAttack(attacker, defender) {
        const d = attacker.data;
        d.secretPathActive = false;
        
        // 计算伤害：普攻伤害×2
        let randomStrength = d.diceCount + (d.extraDice || 0);
        let baseDamage = rollFate(randomStrength) + (d.atkBuff || 0);
        let totalDamage = baseDamage * 2; // 伤害×2
        
        // 回复等量NP
        const npGain = totalDamage;
        d.np = (d.np || 0) + npGain;
        
        // 扣除伤害一半的HP
        const hpCost = Math.floor(totalDamage / 2);
        d.hp = Math.max(1, d.hp - hpCost); // 至少保留1HP
        
        this.addLog(`${d.name} 暗度陈仓攻击!`);
        this.addLog(`基础${baseDamage}×2 = ${totalDamage}伤害`);
        this.addLog(`NP+${npGain}, HP-${hpCost}`);
        
        // 攻击动画
        const originalX = attacker.x;
        const originalY = attacker.y;
        const targetX = defender.x;
        const targetY = defender.y;
        
        const dx = targetX - originalX;
        const dy = targetY - originalY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const rushX = originalX + (dx / dist) * (dist - 40);
        const rushY = originalY + (dy / dist) * (dist - 40);

        this.createTacticalPathEffect(originalX, originalY, targetX, targetY, 0x63e6be, 0xf6d365);
        this.createSlashTrail(originalX, originalY, targetX, targetY, 0x63e6be, 18);
        this.createFormationSigilAt(targetX, targetY, 0x63e6be, 0xf6d365, 28, 1242, 300);
        this.playScreenPulse(0x63e6be, 0.08, 120);
        this.showCombatText(attacker, '奇袭', '#7ef5d8', '17px');
        
        let damageDealt = false;
        this.tweens.add({
            targets: [attacker, attacker.data.border],
            x: rushX,
            y: rushY,
            duration: 100,
            ease: 'Power2',
            yoyo: true,
            onYoyo: () => {
                if (damageDealt) return;
                damageDealt = true;

                this.createSlashTrail(rushX, rushY, targetX, targetY, 0xf6d365, 22);
                this.createImpactEffect(defender, 0xf6d365, {
                    radius: 74,
                    shake: true,
                    shakeDuration: 130,
                    shakeIntensity: 0.0048,
                    pulseAlpha: 0.11,
                    sparkCount: 14
                });
                this.createFormationSigilAt(targetX, targetY, 0x63e6be, 0xf6d365, 34, 1244, 360);
                 
                audioManager.playAttack();
                this.showDamageNumber(defender, totalDamage);
                this.dealDamage(defender, totalDamage);
                
                // 更新自己的血条
                this.updateUnitBars(attacker);
                
                // 敌人受击闪烁
                if (defender.data && defender.data.hp > 0) {
                    this.tweens.add({
                        targets: defender,
                        alpha: 0.3,
                        duration: 100,
                        yoyo: true,
                        repeat: 2
                    });
                }
            },
            onComplete: () => {
                if (!this.gameOver) {
                    this.finishAction();
                }
            }
        });
        
        // UI跟随动画
        this.tweens.add({
            targets: [attacker.data.hpBar, attacker.data.hpBarBg],
            x: rushX,
            y: rushY - 35,
            duration: 100,
            ease: 'Power2',
            yoyo: true
        });
        
        const msg = `暗度陈仓! ${totalDamage}伤害, NP+${npGain}, HP-${hpCost}`;
        this.actionText.setText(msg);
        
        // 清除buff
        d.atkBuff = 0;
        d.extraDice = 0;
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
        const scene = this;
        const rollAnim = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 12) {
                clearInterval(rollAnim);
                
                // 多段随机伤害
                const randomStrength = noble.diceCount || 3;
                // 连续随机数 (基础值到基础值*6)
                const total = rollFate(randomStrength);
                const damage = total * (noble.multiplier || 5);
                
                let hitCount = 0;
                const attacker = scene.currentUnit;
                
                enemies.forEach(e => {
                    const dist = Math.abs(e.data.x - attacker.data.x) + Math.abs(e.data.y - attacker.data.y);
                    if (dist <= noble.range) {
                        // 破甲：无视护盾
                        if (noble.pierceShield) {
                            const originalShield = e.data.shield;
                            e.data.shield = 0;
                            scene.dealDamage(e, damage, 'noble');
                            e.data.shield = originalShield;
                        } else {
                            scene.dealDamage(e, damage, 'noble');
                        }
                        
                        // 击退效果
                        if (noble.knockback && e.data.hp > 0) {
                            scene.knockbackUnit(e, attacker, noble.knockback);
                        }
                        
                        hitCount++;
                    }
                });
                
                scene.diceResultText.setText(`${total}×${noble.multiplier}=${damage}`);
                let effectText = '';
                if (noble.pierceShield) effectText += ' 无视护盾';
                if (noble.knockback) effectText += ` 击退${noble.knockback}格`;
                const nobleMsg = `${scene.currentUnit.data.name} 发动宝具 ${noble.name}，${hitCount}人受到${damage}伤害${effectText}`;
                scene.actionText.setText(nobleMsg);
                scene.addLog(nobleMsg);
                scene.finishAction();
            }
        }, 80);
    }

    // 誓约胜利之剑：直线攻击输入
    setupExcaliburLineInput(noble) {
        this.input.once('pointerdown', (pointer) => {
            const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
            const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
            
            const dirTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'direction');
            if (dirTile) {
                this.clearHighlights();
                this.executeExcaliburLine(noble, dirTile.dir);
            } else {
                this.setupExcaliburLineInput(noble);
            }
        });
    }

    // 誓约胜利之剑：执行直线攻击
    executeExcaliburLine(noble, direction) {
        let rolls = 0;
        const scene = this;
        
        const rollInterval = setInterval(() => {
            const tempRoll = Phaser.Math.Between(1, 6);
            scene.diceDisplay.setText(String(tempRoll));
            rolls++;
            if (rolls >= 12) {
                clearInterval(rollInterval);
                
                // 连续随机数
                const randomStrength = noble.diceCount || 4;
                const total = rollFate(randomStrength);
                const damage = total * (noble.multiplier || 5);
                
                // 获取直线上的所有敌人
                const enemies = scene.getEnemiesInLine(scene.currentUnit, direction);
                let hitCount = 0;
                
                enemies.forEach(enemy => {
                    // 无视护盾
                    if (noble.pierceShield) {
                        const originalShield = enemy.data.shield;
                        enemy.data.shield = 0;
                        scene.dealDamage(enemy, damage, 'noble');
                        enemy.data.shield = originalShield;
                    } else {
                        scene.dealDamage(enemy, damage, 'noble');
                    }
                    
                    // 添加灼烧效果
                    if (noble.burnDamage && noble.burnTurns && enemy.data.hp > 0) {
                        enemy.data.burn = {
                            damage: noble.burnDamage,
                            turns: noble.burnTurns
                        };
                        scene.addLog(`${enemy.data.name} 被灼烧! ${noble.burnTurns}回合每回合${noble.burnDamage}伤害`);
                    }
                    
                    scene.showDamageNumber(enemy, damage);
                    hitCount++;
                });
                
                audioManager.playNoble();
                scene.diceResultText.setText(`${total}×${noble.multiplier}`);
                const nobleMsg = `${scene.currentUnit.data.name} 发动 ${noble.name}! ${hitCount}人受到${damage}伤害+灼烧`;
                scene.actionText.setText(nobleMsg);
                scene.addLog(nobleMsg);
                scene.finishAction();
            }
        }, 80);
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
        
        const startX = oldX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const startY = oldY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const targetX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const targetY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const moveColor = this.getTeamFxColor(unit.data.team);

        this.createMoveTrail(startX, startY, targetX, targetY, moveColor);
        this.createRadialBurstAt(startX, startY, moveColor, 34, 5, 1182);
        
        // 移动动画
        this.tweens.add({
            targets: [unit, unit.data.border],
            x: targetX,
            y: targetY,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.createRadialBurstAt(targetX, targetY, moveColor, 42, 6, 1182);
                // 检查地形效果
                this.checkFieldEffects(unit);
                // 检查陷阱触发
                this.checkAmbushTraps(unit);
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
        // 检查是否有暗度陈仓状态（韩信）
        if (attacker.data.secretPathActive) {
            this.performSecretPathAttack(attacker, defender);
            return;
        }
        
        // 检查是否有何乐为宝具强制攻击状态
        if (attacker.data.heleweiBurst && attacker.data.heleweiBurst.forcedAttacks > 0) {
            this.performForcedAttack(defender);
            this.finishAction();
            return;
        }
        
        const attackResult = BattleCore.calculateAttackDamage(attacker.data, rollFate);
        let totalDamage = attackResult.damage;

        attackResult.events.forEach((event) => {
            if (event.type === 'projectionBonus') {
                this.addLog(`投影武器破碎! +${event.amount}伤害`);
            }
        });
        Object.assign(attacker.data, attackResult.attackerPatch);
        
        // 圆桌誓约效果
        const oathResult = this.applyRoundTableOaths(attacker, defender, totalDamage);
        totalDamage = oathResult.damage;
        
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
        let damageDealt = false; // 防止重复造成伤害
        this.tweens.add({
            targets: [attacker, attacker.data.border],
            x: rushX,
            y: rushY,
            duration: 150,
            ease: 'Power2',
            yoyo: true,
            onYoyo: () => {
                // 防止重复造成伤害
                if (damageDealt) return;
                damageDealt = true;
                
                // 在冲刺到达时造成伤害
                audioManager.playAttack();
                this.createSlashTrail(originalX, originalY, targetX, targetY, this.getTeamFxColor(attacker.data.team), 18);
                this.playCharAttackEffect(attacker, defender);
                this.shakeCamera(110, 0.0045);
                this.playScreenPulse(this.getTeamFxColor(attacker.data.team), 0.12, 110);
                console.log(`[attack] ${attacker.data.name} 攻击 ${defender.data.name}, 伤害: ${totalDamage}`);
                this.showDamageNumber(defender, totalDamage);
                this.dealDamage(defender, totalDamage);
                
                // 狂化效果：攻击命中NP+2~12
                if (attacker.data && attacker.data.class === 'berserker') {
                    const npGain = rollFate(2);
                    attacker.data.np = Math.min(100, attacker.data.np + npGain);
                    attacker.data.berserkNpPending = true; // 标记下次受伤要扣NP
                    this.updateUnitBars(attacker);
                    this.addLog(`狂化: NP+${npGain}`);
                }
                
                // 敌人受击闪烁（只有在敌人还活着时）
                if (defender.data && defender.data.hp > 0) {
                    this.tweens.add({
                        targets: defender,
                        alpha: 0.3,
                        duration: 100,
                        yoyo: true,
                        repeat: 2
                    });
                }
            },
            onComplete: () => {
                // 动画完成后结束行动
                if (!this.gameOver) {
                    this.finishAction();
                }
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


    // damageType: 'attack'=普攻, 'skill'=技能, 'noble'=宝具
    dealDamage(unit, damage, damageType = 'attack') {
        const originalHp = unit.data.hp;
        console.log(`[dealDamage] ${unit.data.name} 原HP:${originalHp}, 受到伤害:${damage}, 类型:${damageType}`);
        console.log(`[dealDamage] 调用栈:`, new Error().stack);
        
        // 七重圆环满层：免疫宝具伤害
        if (unit.data.nobleImmune && damageType === 'noble') {
            unit.data.nobleImmune = false;
            this.addLog(`${unit.data.name} 七重圆环发动，免疫宝具伤害!`);
            this.showCombatText(unit, '免疫', '#f1c40f');
            this.createImpactEffect(unit, 0xf1c40f, { radius: 56 });
            return;
        }
        
        // 对魔力：免疫技能伤害
        if (unit.data.magicImmune && damageType === 'skill') {
            unit.data.magicImmune = false;
            this.addLog(`${unit.data.name} 对魔力发动，免疫技能伤害!`);
            this.showCombatText(unit, '抵抗', '#74b9ff');
            this.createImpactEffect(unit, 0x74b9ff, { radius: 52 });
            return;
        }
        
        // 骑士不留名（兰斯洛特隐身）：免疫技能伤害
        if (unit.data.forAllOne && damageType === 'skill') {
            this.addLog(`${unit.data.name} 骑士不留名发动，免疫技能伤害!`);
            this.showCombatText(unit, '无效', '#95a5a6');
            this.createImpactEffect(unit, 0x95a5a6, { radius: 52 });
            return;
        }
        
        // 气息遮断（闪避）：免疫普攻伤害
        if (unit.data.evade && damageType === 'attack') {
            unit.data.evade = false;
            this.addLog(`${unit.data.name} 气息遮断发动，闪避普攻!`);
            this.showCombatText(unit, '闪避', '#dfe6e9');
            this.createImpactEffect(unit, 0xdfe6e9, { radius: 46 });
            return;
        }
        
        // 无毁的湖光反伤 + 回NP
        if (unit.data.arondightActive && unit.data.shield > 0) {
            const reflectDamage = Math.floor(damage * 0.3);
            if (reflectDamage > 0 && this.currentUnit && this.currentUnit !== unit) {
                this.addLog(`阿隆戴特反弹${reflectDamage}伤害!`);
                this.showCombatText(unit, '反击', '#5dade2');
                // 延迟反伤，避免递归
                const scene = this;
                setTimeout(() => {
                    if (scene.currentUnit && scene.currentUnit.data) {
                        scene.currentUnit.data.hp -= reflectDamage;
                        scene.updateUnitBars(scene.currentUnit);
                        scene.showDamageNumber(scene.currentUnit, reflectDamage);
                    }
                }, 100);
            }
            // 受击回复NP (3~18)
            const npGain = rollFate(3);
            unit.data.np = Math.min(100, unit.data.np + npGain);
            this.updateUnitBars(unit);
            this.addLog(`阿隆戴特: NP+${npGain}`);
        }
        
        // 加雷斯誓约：减少受到的伤害
        if (unit.data.roundTableDamageReduce && unit.data.roundTableDamageReduce > 0) {
            const reduce = unit.data.roundTableDamageReduce;
            const oldDamage = damage;
            damage = Math.max(0, damage - reduce);
            this.addLog(`加雷斯誓约: 减少${oldDamage - damage}伤害`);
        }
        
        // 护盾吸收伤害
        if (unit.data.shield > 0) {
            if (unit.data.shield >= damage) {
                unit.data.shield -= damage;
                this.addLog(`${unit.data.name} 护盾吸收 ${damage} 伤害`);
                this.updateUnitBars(unit);
                this.showCombatText(unit, '护盾', '#5dade2');
                this.createImpactEffect(unit, 0x5dade2, { radius: 58 });
                // 护盾没了，清除阿隆戴特状态
                return;
            } else {
                damage -= unit.data.shield;
                this.addLog(`${unit.data.name} 护盾破碎`);
                unit.data.shield = 0;
                this.showCombatText(unit, '破盾', '#5dade2');
                this.createImpactEffect(unit, 0x5dade2, { radius: 76, shake: damageType === 'noble', shakeDuration: 120, shakeIntensity: 0.004 });
                // 护盾破碎，清除阿隆戴特加成
                if (unit.data.arondightActive) {
                    unit.data.arondightActive = false;
                    unit.data.atkBuff = Math.max(0, (unit.data.atkBuff || 0) - 10);
                    this.addLog(`阿隆戴特效果结束`);
                }
            }
        }
        
        // 狂化效果：受伤时NP-2~12（如果有待扣标记）
        if (unit.data.class === 'berserker' && unit.data.berserkNpPending) {
            const npLoss = rollFate(2);
            unit.data.np = Math.max(0, unit.data.np - npLoss);
            unit.data.berserkNpPending = false;
            this.addLog(`狂化反噬: NP-${npLoss}`);
        }
        
        // 阿瓦隆反馈：受伤时回复
        if (unit.data.avalonCounter && unit.data.avalonCounter > 0) {
            const recover = Math.floor(damage / 2);
            unit.data.hp = Math.min(unit.data.maxHp, unit.data.hp + recover);
            unit.data.np = Math.min(100, unit.data.np + recover);
            unit.data.avalonCounter--;
            this.addLog(`${unit.data.name} 阿瓦隆反馈! 回复${recover}HP和${recover}NP (剩余${unit.data.avalonCounter}次)`);
        }
        
        unit.data.hp -= damage;
        console.log(`[dealDamage] ${unit.data.name} 最终扣血:${damage}, 剩余HP:${unit.data.hp} (原HP:${originalHp})`);
        this.updateUnitBars(unit);

        // 受击闪白 + 抖动
        if (unit && unit.setTint) { unit.setTint(0xffffff); this.time.delayedCall(90, () => { if (unit && unit.clearTint) unit.clearTint(); }); }
        if (unit.data.idleTween) unit.data.idleTween.pause();
        unit.data._origX = unit.x; unit.data._origY = unit.y;
        this.tweens.add({ targets: unit, x: unit.x + 4, duration: 35, yoyo: true, repeat: 3, onComplete: () => { unit.x = unit.data._origX; unit.y = unit.data._origY; if (unit.data.idleTween) unit.data.idleTween.resume(); } });

        this.createImpactEffect(unit, this.getDamageFxColor(damageType), {
            radius: damageType === 'noble' ? 96 : (damageType === 'skill' ? 74 : 64),
            shake: damageType === 'noble',
            shakeDuration: 130,
            shakeIntensity: 0.005,
            pulseAlpha: damageType === 'noble' ? 0.18 : 0.1,
            sparkCount: damageType === 'noble' ? 14 : 10
        });
        
        // 战斗续行检查（可叠加次数）
        if (unit.data.hp <= 0 && (unit.data.gutsCount > 0 || unit.data.guts)) {
            unit.data.hp = 1;
            if (unit.data.gutsCount > 0) {
                unit.data.gutsCount--;
                this.addLog(`${unit.data.name} 战斗续行发动，保留1HP（剩余${unit.data.gutsCount}层）`);
            } else {
                unit.data.guts = false;
                this.addLog(`${unit.data.name} 战斗续行发动，保留1HP`);
            }
            this.updateUnitBars(unit);
            this.showCombatText(unit, '续命', '#f39c12');
            this.createImpactEffect(unit, 0xf39c12, { radius: 72, shake: true, shakeDuration: 120, shakeIntensity: 0.0042 });
            return;
        }
        
        if (unit.data.hp <= 0) {
            console.log(`${unit.data.name} HP <= 0, 调用 destroyUnit`);
            this.addLog(`${unit.data.name} 被击败!`);
            audioManager.playDeath();
            
            // 加雷斯誓约：击杀敌人后回复NP
            if (this.currentUnit && this.currentUnit.data.pendingGoodOath) {
                const npGain = this.currentUnit.data.pendingGoodOath;
                this.currentUnit.data.np = Math.min(100, this.currentUnit.data.np + npGain);
                this.updateUnitBars(this.currentUnit);
                this.addLog(`加雷斯誓约: 击杀敌人，NP+${npGain}`);
                this.currentUnit.data.pendingGoodOath = 0;
            }
            
            this.destroyUnit(unit);
        }
    }
    
    // 回复HP（考虑多多益善被动）
    healUnit(unit, amount) {
        let healAmount = amount;
        
        // 多多益善被动：HP+NP总和>200时回复减半
        if (unit.data.hasUnlimitedPassive) {
            const total = unit.data.hp + unit.data.np;
            if (total > 200) {
                healAmount = Math.floor(amount / 2);
                this.addLog(`多多益善: 回复减半 (${amount}→${healAmount})`);
            }
        }
        
        // 无上限时不限制maxHp
        if (unit.data.hasUnlimitedPassive) {
            unit.data.hp += healAmount;
        } else {
            unit.data.hp = Math.min(unit.data.maxHp, unit.data.hp + healAmount);
        }
        
        return healAmount;
    }
    
    // 回复NP（考虑多多益善被动）
    chargeUnit(unit, amount) {
        let chargeAmount = amount;
        
        // 多多益善被动：HP+NP总和>200时回复减半
        if (unit.data.hasUnlimitedPassive) {
            const total = unit.data.hp + unit.data.np;
            if (total > 200) {
                chargeAmount = Math.floor(amount / 2);
                this.addLog(`多多益善: 回复减半 (${amount}→${chargeAmount})`);
            }
        }
        
        // 无上限时不限制maxNp
        if (unit.data.hasUnlimitedPassive) {
            unit.data.np += chargeAmount;
        } else {
            unit.data.np = Math.min(unit.data.maxNp, unit.data.np + chargeAmount);
        }
        
        return chargeAmount;
    }

    updateUnitBars(unit) {
        // 多多益善被动：HP和NP无上限，显示时用100作为基准
        const displayMaxHp = unit.data.hasUnlimitedPassive ? Math.max(100, unit.data.hp) : unit.data.maxHp;
        const displayMaxNp = unit.data.hasUnlimitedPassive ? Math.max(100, unit.data.np) : unit.data.maxNp;
        
        const hpPercent = Math.max(0, Math.min(1, unit.data.hp / displayMaxHp));
        unit.data.hpBar.width = 50 * hpPercent;
        
        // 多多益善时HP条变金色
        if (unit.data.hasUnlimitedPassive && unit.data.hp > 100) {
            unit.data.hpBar.fillColor = 0xffd700; // 金色
        } else {
            unit.data.hpBar.fillColor = hpPercent > 0.5 ? 0x2ecc71 : (hpPercent > 0.25 ? 0xf39c12 : 0xe74c3c);
        }
        
        const npPercent = Math.min(1, unit.data.np / displayMaxNp);
        unit.data.npBar.width = 50 * npPercent;
        
        // 多多益善时NP超过100变金色
        if (unit.data.hasUnlimitedPassive && unit.data.np > 100) {
            unit.data.npBar.fillColor = 0xffd700; // 金色
        } else {
            unit.data.npBar.fillColor = 0xf1c40f; // 默认黄色
        }
        
        // 护盾条
        const shieldPercent = Math.min(1, unit.data.shield / 50);
        unit.data.shieldBar.width = 50 * shieldPercent;
    }

    destroyUnit(unit) {
        console.log('destroyUnit 被调用, 单位:', unit.data ? unit.data.name : 'unknown');

        // 死亡粒子爆发
        if (unit && unit.data) {
            const dx = unit.x, dy = unit.y;
            const color = unit.data.team === 'player' ? C.blue : C.red;
            for (let i = 0; i < 18; i++) {
                const p = this.add.circle(dx, dy, Phaser.Math.Between(2, 5), color, 0.8);
                p.setDepth(1500);
                const angle = Math.random() * Math.PI * 2;
                const dist = Phaser.Math.Between(30, 80);
                this.tweens.add({
                    targets: p,
                    x: dx + Math.cos(angle) * dist,
                    y: dy + Math.sin(angle) * dist,
                    alpha: 0, scale: 0.2,
                    duration: Phaser.Math.Between(400, 700),
                    ease: 'Power2',
                    onComplete: () => p.destroy()
                });
            }
            // 金色中心闪光
            const flash = this.add.circle(dx, dy, 5, C.gold, 0.9).setDepth(1501);
            this.tweens.add({
                targets: flash,
                scale: 8, alpha: 0,
                duration: 400, ease: 'Power2',
                onComplete: () => flash.destroy()
            });
        }

        // 如果被销毁的是UBW拥有者，结束UBW
        if (this.ubwActive && this.ubwOwner === unit) {
            this.endUBW();
        }
        
        // 如果是当前单位被销毁，清除引用
        if (this.currentUnit === unit) {
            this.currentUnit = null;
        }
        if (this.selectedUnit === unit) {
            this.selectedUnit = null;
        }
        
        // 先从数组中移除
        this.units = this.units.filter(u => u !== unit);
        console.log('剩余单位数量:', this.units.length);
        console.log('剩余单位:', this.units.map(u => u.data ? u.data.name : 'null').join(', '));
        
        // 月影分身：被杀后NP转移给本体
        if (unit.data && unit.data.isClone && !unit.data.isNobleClone && unit.data.cloneMaster && unit.data.cloneMaster.data) {
            const transferNp = unit.data.np || 0;
            if (transferNp > 0) {
                const masterMaxNp = unit.data.cloneMaster.data.maxNp === Infinity ? 200 :
                    (unit.data.cloneMaster.data.maxNp || 100);
                unit.data.cloneMaster.data.np = Math.min(masterMaxNp,
                    (unit.data.cloneMaster.data.np || 0) + transferNp);
                this.updateUnitBars(unit.data.cloneMaster);
                this.addLog(`分身被击杀！NP(${transferNp})转移至本体`);
            } else {
                this.addLog('分身被击杀！');
            }
        }

        // 安全销毁UI元素
        if (unit.data) {
            if (unit.data.hpBar) unit.data.hpBar.destroy();
            if (unit.data.hpBarBg) unit.data.hpBarBg.destroy();
            if (unit.data.npBar) unit.data.npBar.destroy();
            if (unit.data.npBarBg) unit.data.npBarBg.destroy();
            if (unit.data.shieldBar) unit.data.shieldBar.destroy();
            if (unit.data.border) unit.data.border.destroy();
            if (unit.data.selectTween) unit.data.selectTween.stop();
            // 清除 data 引用
            unit.data = null;
        }
        unit.destroy();
        
        // 检查游戏是否结束
        console.log('调用 checkGameOver...');
        const gameEnded = this.checkGameOver();
        console.log('游戏结束:', gameEnded);
        
        // 如果游戏没结束，但当前单位被销毁了，需要选择下一个单位
        if (!gameEnded && !this.currentUnit) {
            const scene = this;
            setTimeout(() => {
                if (!scene.gameOver) {
                    scene.selectNextUnit();
                }
            }, 500);
        }
    }

    finishAction() {
        console.log('finishAction 被调用, gameOver:', this.gameOver);
        if (this.gameOver) return;
        
        this.clearHighlights();
        this.clearSkillButtons();
        
        // 检查卷狗之光额外行动
        if (this.currentUnit && this.currentUnit.data.dogLightActions > 0) {
            // 先封锁一个技能
            const availableSkills = [0, 1, 2].filter(i => {
                const sealed = this.currentUnit.data.sealedSkills || {};
                return !sealed[i] || sealed[i] <= 0;
            });
            
            if (availableSkills.length > 0) {
                const skillToSeal = availableSkills[Phaser.Math.Between(0, availableSkills.length - 1)];
                if (!this.currentUnit.data.sealedSkills) this.currentUnit.data.sealedSkills = {};
                this.currentUnit.data.sealedSkills[skillToSeal] = 3;
                const skillName = this.currentUnit.data.skills[skillToSeal]?.name || `技能${skillToSeal + 1}`;
                this.addLog(`${skillName} 被封锁3回合!`);
            }
            
            // 减少额外行动次数
            this.currentUnit.data.dogLightActions--;
            
            // 如果还有额外行动，继续行动
            if (this.currentUnit.data.dogLightActions >= 0) {
                if (this.currentUnit.data.dogLightActions > 0) {
                    this.actionText.setText(`卷狗之光: 剩余${this.currentUnit.data.dogLightActions}次额外行动`);
                } else {
                    this.actionText.setText('卷狗之光: 最后一次额外行动');
                }
                this.diceResult = null;
                this.waitingForAction = false;
                if (this.diceDisplay) this.diceDisplay.setVisible(false);
                if (this.diceResultText) this.diceResultText.setText('');
                this.updateBerserkButton();
                return;
            }
        }

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
            if (this.diceDisplay) this.diceDisplay.setVisible(false);
            if (this.diceResultText) this.diceResultText.setText('');
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
            if (this.diceDisplay) this.diceDisplay.setVisible(false);
            if (this.diceResultText) this.diceResultText.setText('');
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

            // 测试模式下不标记已行动
            if (!this.testMode) {
                this.currentUnit.data.acted = true;
                this.currentUnit.setAlpha(0.5);
                const borderColor = this.currentUnit.data.team === 'player' ? 0x3498db : 0xe74c3c;
                this.currentUnit.data.border.setStrokeStyle(3, borderColor);
            }
        }
        this.waitingForAction = false;
        this.diceResult = null;
        
        // 在线模式：行动完成后自动结束回合
        if (this.onlineMode && this.isMyTurn()) {
            this.addLog('行动完成，自动结束回合');
            this.broadcastStateSync('actionEnd');
            networkManager.endTurn();
            return;
        }
        
        const scene = this;
        setTimeout(() => scene.selectNextUnit(), 800);
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
            // 测试模式下不标记已行动
            if (!this.testMode) {
                this.currentUnit.data.acted = true;
                this.currentUnit.setAlpha(0.5);
                const borderColor = this.currentUnit.data.team === 'player' ? 0x3498db : 0xe74c3c;
                this.currentUnit.data.border.setStrokeStyle(3, borderColor);
            }
        }
        this.waitingForAction = false;
        this.diceResult = null;

        // 测试模式：更新状态条，不切换单位
        if (this.testMode) {
            this.updateTestStatus();
            return;
        }

        if (this.onlineMode && this.isMyTurn()) {
            this.addLog('行动完成，自动结束回合');
            this.broadcastStateSync('actionEnd');
            networkManager.endTurn();
            return;
        }

        const scene = this;
        setTimeout(() => scene.selectNextUnit(), 800);
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
            if (!this.isMyTurn()) {
                console.log('不是你的回合，无法结束');
                return;
            }
            
            console.log('发送结束回合请求');
            this.addLog('结束回合...');
            
            // 设置当前单位为已行动
            if (this.currentUnit) {
                this.currentUnit.data.acted = true;
                this.currentUnit.setAlpha(0.5);
            }
            
            // 通知服务器回合结束
            this.broadcastStateSync('manualEndTurn');
            networkManager.endTurn();
            return;
        }
        
        // 本地模式
        if (this.currentTurn === 'player') {
            // 玩家1结束回合
            this.units.filter(u => u.data.team === 'player').forEach(u => {
                u.data.acted = true;
                u.setAlpha(0.5);
            });
            // 时间停止中：如果施法者在player队则跳过enemy回合
            if (this.timeStopTurns > 0 && this.timeStopCaster && this.timeStopCaster.data.team === 'player') {
                this.addLog('固有时域制: 跳过敌方回合');
                this.timeStopTurns--;
                if (this.timeStopTurns <= 0) {
                    this.addLog('时间重新开始流动');
                    this.timeStopCaster = null;
                }
                this.startPlayerTurn();
            } else {
                this.startEnemyTurn();
            }
        } else if (this.currentTurn === 'enemy') {
            // 玩家2结束回合
            this.units.filter(u => u.data.team === 'enemy').forEach(u => {
                u.data.acted = true;
                u.setAlpha(0.5);
            });
            // 时间停止中：如果施法者在enemy队则跳过player回合
            if (this.timeStopTurns > 0 && this.timeStopCaster && this.timeStopCaster.data.team === 'enemy') {
                this.addLog('固有时域制: 跳过敌方回合');
                this.timeStopTurns--;
                if (this.timeStopTurns <= 0) {
                    this.addLog('时间重新开始流动');
                    this.timeStopCaster = null;
                }
                this.startEnemyTurn();
            } else {
                this.startPlayerTurn();
            }
        }
    }


    checkGameOver() {
        console.log('checkGameOver 被调用');
        console.log('当前 units 数组长度:', this.units.length);
        
        // 打印所有单位信息
        this.units.forEach((u, i) => {
            console.log(`单位${i}:`, u.data ? `${u.data.name} (${u.data.team})` : 'data为null');
        });
        
        const players = this.units.filter(u => u.data && u.data.team === 'player');
        const enemies = this.units.filter(u => u.data && u.data.team === 'enemy');
        
        console.log('玩家1单位数:', players.length, '玩家2单位数:', enemies.length);
        
        if (players.length === 0) {
            console.log('玩家1全灭，显示游戏结束画面');
            this.addLog('=== 玩家2 胜利! ===');
            audioManager.playVictory();
            this.showGameOver('玩家2 胜利!', 0xe74c3c);
            return true;
        } else if (enemies.length === 0) {
            console.log('玩家2全灭，显示游戏结束画面');
            this.addLog('=== 玩家1 胜利! ===');
            audioManager.playVictory();
            this.showGameOver('玩家1 胜利!', 0x2ecc71);
            return true;
        }
        console.log('游戏继续');
        return false;
    }

    showGameOver(text, color) {
        console.log('showGameOver 被调用, 文字:', text);
        this.gameOver = true;
        
        // 清除所有输入监听
        this.input.removeAllListeners();
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // 全屏遮罩
        const overlay = this.add.rectangle(centerX, centerY, 
            this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8);
        overlay.setDepth(200);
        
        // 胜利文字动画
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        const winText = this.add.text(centerX, centerY - 50, text, { 
            fontSize: '48px', fill: colorHex, fontStyle: 'bold',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);
        winText.setDepth(201);
        
        // 文字弹出动画
        this.tweens.add({
            targets: winText,
            alpha: 1,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // 装饰线
        const line1 = this.add.rectangle(centerX, centerY - 100, 250, 3, color);
        const line2 = this.add.rectangle(centerX, centerY + 5, 250, 3, color);
        line1.setDepth(201).setAlpha(0);
        line2.setDepth(201).setAlpha(0);
        
        this.tweens.add({
            targets: [line1, line2],
            alpha: 1,
            duration: 300,
            delay: 300
        });
        
        // 返回大厅按钮
        const scene = this;
        const backBtn = this.add.text(centerX, centerY + 60, '[ 返回大厅 ]', { 
            fontSize: '22px', fill: '#3498db' 
        }).setOrigin(0.5).setAlpha(0);
        backBtn.setDepth(201);
        
        this.tweens.add({
            targets: backBtn,
            alpha: 1,
            duration: 300,
            delay: 500,
            onComplete: () => {
                backBtn.setInteractive({ useHandCursor: true });
                backBtn.on('pointerover', () => backBtn.setStyle({ fill: '#5dade2' }));
                backBtn.on('pointerout', () => backBtn.setStyle({ fill: '#3498db' }));
                backBtn.on('pointerdown', () => {
                    scene.shutdown();
                    if (scene.onlineMode) {
                        networkManager.disconnect();
                    }
                    scene.scene.start('LobbyScene');
                });
            }
        });
        
        // 再来一局按钮
        const replayBtn = this.add.text(centerX, centerY + 100, '[ 再来一局 ]', { 
            fontSize: '18px', fill: '#2ecc71' 
        }).setOrigin(0.5).setAlpha(0);
        replayBtn.setDepth(201);
        
        this.tweens.add({
            targets: replayBtn,
            alpha: 1,
            duration: 300,
            delay: 600,
            onComplete: () => {
                replayBtn.setInteractive({ useHandCursor: true });
                replayBtn.on('pointerover', () => replayBtn.setStyle({ fill: '#58d68d' }));
                replayBtn.on('pointerout', () => replayBtn.setStyle({ fill: '#2ecc71' }));
                replayBtn.on('pointerdown', () => {
                    scene.shutdown();
                    if (scene.onlineMode) {
                        networkManager.disconnect();
                    }
                    scene.scene.start('CharacterSelectScene', { mode: 'local' });
                });
            }
        });
    }
}
