class TestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TestScene' });
        this.highlightTiles = [];
        this.isMoving = false;
        this.ubwActive = false;
        this.ubwSwords = [];
        this.ubwDuration = 0;
        // 水月无影
        this.timeStopTurns = 0;
        this.millenniumCastleActive = false;
        this.millenniumCastleTurns = 0;
        this.millenniumCastleBg = null;
        this.millenniumCastleOriginalTiles = null;
        this.millenniumCastleBurnMin = 10;
        this.millenniumCastleBurnMax = 20;
        this.millenniumCastleNpMin = 5;
        this.millenniumCastleNpMax = 15;
    }

    init(data) {
        this.selectedChar = (data && data.character) || 'saber_artoria';
        this.highlightTiles = [];
        this.isMoving = false;
        this.ubwActive = false;
        this.ubwSwords = [];
        this.ubwDuration = 0;
        this.projectionBtns = [];
        this.currentUnit = null;
        this.testUnit = null;
        this.dummyTarget = null;
        this.units = [];
        // 水月无影
        this.timeStopTurns = 0;
        this.millenniumCastleActive = false;
        this.millenniumCastleTurns = 0;
        this.millenniumCastleBg = null;
        this.millenniumCastleOriginalTiles = null;
        this.millenniumCastleBurnMin = 10;
        this.millenniumCastleBurnMax = 20;
        this.millenniumCastleNpMin = 5;
        this.millenniumCastleNpMax = 15;
    }

    shutdown() {
        // 清理输入监听
        this.input.removeAllListeners();
        
        // 清理数据引用
        if (this.testUnit) this.testUnit.data = null;
        if (this.dummyTarget) this.dummyTarget.data = null;
        if (this.units) {
            this.units.forEach(u => { if (u) u.data = null; });
        }
        
        // 清理UBW
        if (this.ubwActive) {
            this.ubwActive = false;
            this.ubwSwords = [];
        }
        
        // 清理高亮
        this.highlightTiles = [];
    }

    preload() {
        for (const charId in CHARACTERS) {
            const char = CHARACTERS[charId];
            if (char.avatar && !this.textures.exists(charId)) {
                this.load.image(charId, char.avatar);
            }
        }
        // 加载武器贴图（多种武器）
        if (!this.textures.exists('weapon_0')) this.load.image('weapon_0', 'assets/weapons/wuqi.png');
        if (!this.textures.exists('weapon_1')) this.load.image('weapon_1', 'assets/weapons/wuqi1.png');
        if (!this.textures.exists('weapon_2')) this.load.image('weapon_2', 'assets/weapons/wuqi2.png');
        if (!this.textures.exists('weapon_3')) this.load.image('weapon_3', 'assets/weapons/wuqi3.png');
        // 加载抠好图的武器（用于无限剑制动画）
        if (!this.textures.exists('weapon_nobg_1')) this.load.image('weapon_nobg_1', 'assets/characters/wuqi1-removebg-preview.png');
        if (!this.textures.exists('weapon_nobg_2')) this.load.image('weapon_nobg_2', 'assets/characters/wuqi2-removebg-preview.png');
        if (!this.textures.exists('weapon_nobg_3')) this.load.image('weapon_nobg_3', 'assets/characters/wuqi3-removebg-preview.png');
        // 加载瓷器贴图
        if (!this.textures.exists('ciqi')) this.load.image('ciqi', 'assets/weapons/ciqi.png');
        // 加载抠好图的瓷器（从characters目录）
        if (!this.textures.exists('ciqi_nobg')) this.load.image('ciqi_nobg', 'assets/characters/ciqi-removebg-preview.png');
        // 加载无限剑制背景
        if (!this.textures.exists('ubw_bg_0')) this.load.image('ubw_bg_0', 'assets/ubw/OIP.png');
        if (!this.textures.exists('ubw_bg_1')) this.load.image('ubw_bg_1', 'assets/ubw/OIP1.png');
        if (!this.textures.exists('ubw_bg_2')) this.load.image('ubw_bg_2', 'assets/ubw/20170323124330_ikxMc.png');
        // 千年城背景
        if (!this.textures.exists('millennium_castle_bg')) this.load.image('millennium_castle_bg', 'assets/characters/millennium_castle_bg.png');
        // 水月无影技能动画
        this.load.video('skill_millennium_castle', 'assets/skills/mooncell_castle.mp4');

        const nobleChars = ['saber_artoria', 'archer_emiya', 'berserker_lancelot', 'caster_helewei', 'lancer_hanxin', 'archer_licunxu'];
        nobleChars.forEach(cid => {
            const videoPath = 'assets/nobles/' + cid + '.mp4';
            this.load.video('noble_' + cid, [videoPath, videoPath.replace('.mp4', '.webm')]);
        });
        
        // 加载圆桌骑士图片
        const knights = ['knight_arthur', 'knight_kay', 'knight_bedivere', 'knight_palamedes', 
                         'knight_gaheris', 'knight_agravain', 'knight_lancelot', 'knight_mordred',
                         'knight_galahad', 'knight_gawain', 'knight_tristan', 'knight_gareth'];
        knights.forEach(k => {
            if (!this.textures.exists(k)) {
                this.load.image(k, `assets/characters/${k}.png`);
            }
        });
    }

    create() {
        // 清理之前可能残留的输入监听
        this.input.removeAllListeners();
        this.input.enabled = true;
        
        audioManager.init();
        
        this.createMap();
        this.createTestUnit();
        this.createDummyTarget();
        this.createUI();
        this.createLogPanel();
        this.createUnitTooltip();
        
        this.currentUnit = this.testUnit;
        
        this.input.on('pointerdown', (pointer) => {
            audioManager.resume();
            // 先检查是否触摸到角色显示信息
            this.checkUnitTouch(pointer);
            this.handleMapClick(pointer);
        });
        
        // 触摸/悬停显示角色信息
        this.input.on('pointermove', (pointer) => {
            this.checkUnitHover(pointer);
        });
    }

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
                const seed = (x * 37 + y * 19 + x * y * 7) % 11;
                const isStone = seed === 0 || seed === 7;
                const grassPalette = [0x2f694f, 0x376f56, 0x2d5d49, 0x3f7659];
                const stonePalette = [0x5a5546, 0x69604c, 0x514c43];
                const color = isStone ? stonePalette[seed % stonePalette.length] : grassPalette[seed % grassPalette.length];
                const tile = this.add.rectangle(
                    x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    GAME_CONFIG.tileSize - 2, GAME_CONFIG.tileSize - 2, color
                );
                tile.setStrokeStyle(1, 0x101722, 0.82);
                tile.setDepth(-1);
                if (seed % 3 === 0) {
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
                this.map[y][x] = { tile, x, y, walkable: true, originalColor: color, baseColor: color };
            }
        }
    }

    createTestUnit() {
        const charData = CHARACTERS[this.selectedChar];
        const classData = CLASS_CONFIG[charData.class];
        const x = 2, y = 3;
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        let unit;
        let portraitH = 0;
        if (charData.avatar && this.textures.exists(this.selectedChar)) {
            const tex = this.textures.get(this.selectedChar);
            const texW = tex.getSourceImage().width;
            const texH = tex.getSourceImage().height;
            const aspectRatio = texW / texH;
            const displayW = GAME_CONFIG.tileSize - 6;
            const displayH = Math.min(displayW / (texW / texH), GAME_CONFIG.tileSize - 6);
            portraitH = displayH;
            unit = this.add.image(posX, posY, this.selectedChar);
            unit.setDisplaySize(displayW, displayH);
        } else {
            unit = this.add.circle(posX, posY, GAME_CONFIG.tileSize / 3, classData.color);
        }

        const borderH = portraitH > 0 ? portraitH + 12 : GAME_CONFIG.tileSize - 6;
        const borderY = posY;
        const border = this.add.rectangle(posX, borderY, GAME_CONFIG.tileSize - 6, borderH);
        border.setStrokeStyle(3, 0x3498db);
        border.setFillStyle();
        
        const hpBarBg = this.add.rectangle(posX, posY - 35, 52, 8, 0x333333);
        const hpBar = this.add.rectangle(posX, posY - 35, 50, 6, 0x2ecc71);
        const npBarBg = this.add.rectangle(posX, posY - 26, 52, 6, 0x333333);
        const npBar = this.add.rectangle(posX - 25, posY - 26, 0, 4, 0xf1c40f);
        npBar.setOrigin(0, 0.5);
        const shieldBar = this.add.rectangle(posX - 25, posY - 42, 0, 4, 0x3498db);
        shieldBar.setOrigin(0, 0.5);
        
        // 检查是否有多多益善被动（韩信）
        const hasUnlimitedPassive = charData.passive === 'duoduoyishan';
        
        unit.data = {
            x, y, team: 'player', charId: this.selectedChar,
            name: charData.name, className: classData.name, class: charData.class,
            hp: 100, maxHp: hasUnlimitedPassive ? 9999 : 100, 
            np: 100, maxNp: hasUnlimitedPassive ? 9999 : 100, 
            shield: 0,
            diceCount: classData.diceCount, moveRange: classData.moveRange,
            attackRange: classData.attackRange, skills: charData.skills,
            noble: charData.noble, buffs: [], atkBuff: 0, extraDice: 0,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border,
            roAiasCount: 0, roAiasLastValue: 0, projectedWeapon: false,
            passive: charData.passive,
            baseHp: 100, baseNp: 100 // 记录基础值用于计算回复减半
        };
        
        this.testUnit = unit;
        this.units = [unit];
    }

    createDummyTarget() {
        const x = 9, y = 3;
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
            x, y, team: 'enemy', name: '测试假人', charId: 'dummy',
            hp: Infinity, maxHp: Infinity, np: 0, maxNp: 100, shield: 0,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border
        };
        
        this.dummyTarget = dummy;
        this.units.push(dummy);
    }

    createUI() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const charData = CHARACTERS[this.selectedChar];

        // ═══ 顶部悬浮状态栏 ═══
        const topBar = this.add.graphics();
        topBar.fillStyle(C.bg, 0.92);
        topBar.fillRect(0, 0, mapW, 44);
        topBar.fillStyle(C.gold, 0.16);
        topBar.fillRect(0, 43, mapW, 1);
        topBar.fillStyle(C.blue, 0.05);
        topBar.fillRect(0, 0, mapW, 43);

        this.add.text(10, 4, '← 返回', {
            fontSize: '11px', fill: colorHex(C.fg2), fontFamily: UI_FONT, fontStyle: 'bold'
        }).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { window.location.reload(); })
            .on('pointerover', function() { this.setStyle({ fill: colorHex(C.gold2) }); })
            .on('pointerout', function() { this.setStyle({ fill: colorHex(C.fg2) }); });

        this.add.text(mapW / 2, 4, `测试模式: ${charData.name}`, {
            fontSize: '13px', fill: colorHex(C.gold2), fontFamily: UI_FONT, fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.statusText = this.add.text(mapW / 2, 20, '', {
            fontSize: '10px', fill: colorHex(C.fg3), fontFamily: UI_FONT
        }).setOrigin(0.5, 0);

        this.actionText = this.add.text(mapW / 2, 33, '', {
            fontSize: '10px', fill: colorHex(C.green), fontFamily: UI_FONT
        }).setOrigin(0.5, 0);

        // ═══ 右侧单位信息 ═══
        const sideW = W - mapW;
        const sideBg = this.add.graphics();
        sideBg.fillStyle(0x070a12, 0.96);
        sideBg.fillRect(mapW, 0, sideW, H);
        sideBg.fillStyle(C.gold, 0.12);
        sideBg.fillRect(mapW, 0, 1, H);

        const rx = mapW + 8;
        const sidePanelW = Math.max(166, sideW - 16);
        createPanel(this, rx - 2, 48, sidePanelW + 4, 82, {
            fill: C.panel,
            alpha: 0.86,
            strokeAlpha: 0.16,
            accentAlpha: 0.06,
            radius: 6
        });

        addSectionLabel(this, rx + 2, 61, 'TRAINING UNIT', C.gold2);
        this.add.text(rx + 2, 72, charData.name, {
            fontSize: '11px', fill: colorHex(C.fg), fontFamily: UI_FONT, fontStyle: 'bold',
            wordWrap: { width: sidePanelW - 12 }
        });
        this.add.text(rx + 2, 88, CLASS_CONFIG[charData.class].name, {
            fontSize: '10px', fill: colorHex(C.gold2), fontFamily: UI_FONT
        });

        this.testHPText = this.add.text(rx + 2, 104, '', { fontSize: '9px', fill: colorHex(C.red), fontFamily: UI_FONT });
        this.testNPText = this.add.text(rx + 2, 116, '', { fontSize: '9px', fill: colorHex(C.blue), fontFamily: UI_FONT });

        // 假人状态
        this.dummyStatusText = this.add.text(rx + 2, 136, '', {
            fontSize: '9px',
            fill: colorHex(C.red),
            fontFamily: UI_FONT,
            wordWrap: { width: sidePanelW - 12 }
        });

        this.updateStatus();
        this.updateDummyStatus();

        // ═══ 底部悬浮操作栏（双排） ═══
        const barTop = H - 74;
        const barBg = this.add.graphics();
        barBg.fillStyle(C.bg, 0.93);
        barBg.fillRect(0, barTop, mapW, 74);
        barBg.fillStyle(C.gold, 0.16);
        barBg.fillRect(0, barTop, mapW, 2);

        const row1Y = H - 58;  // 技能排
        const row2Y = H - 24;  // 控制排

        // 技能按钮
        charData.skills.forEach((skill, i) => {
            const x = 10 + i * 155;
            this.createButton(x, row1Y, `${i+1}.${skill.name}`, 0x4a90d9, () => this.useSkill(i), '10px');
        });

        // 宝具按钮
        this.nobleBtn = this.createButton(
            10 + charData.skills.length * 155, row1Y,
            '宝具:' + charData.noble.name, 0xf0c040, () => this.useNoble(), '10px'
        );

        // 控制按钮（紧凑排列）
        const ctrlBtns = [
            ['移动', 0x27ae60, () => this.startMove()],
            ['攻击', 0xe74c3c, () => this.startAttack()],
            ['+NP50', 0x8b5cf6, () => this.addNP(50)],
            ['+HP50', 0x2ecc71, () => this.addHP(50)],
            ['重置', 0x4a90d9, () => this.resetAll()],
            ['移假人', 0xe89829, () => this.startMoveDummy()],
            ['假人攻', 0xc0392b, () => this.dummyAttack()],
            ['职阶技', 0x8b5cf6, () => this.useClassSkill()],
        ];

        const ctrlW = 78;
        const ctrlGap = 6;
        ctrlBtns.forEach(([label, color, cb], i) => {
            this.createButton(10 + i * (ctrlW + ctrlGap), row2Y, label, color, cb, '10px');
        });

        // 强制攻击（宝具触发后显示）
        this.forcedAttackBtn = this.createButton(
            10 + ctrlBtns.length * (ctrlW + ctrlGap), row2Y,
            '强制攻击', 0xff6b6b, () => {
                if (this.testUnit.data.heleweiBurst && this.testUnit.data.heleweiBurst.forcedAttacks > 0) {
                    this.performForcedAttack();
                }
            }, '10px'
        );
        this.forcedAttackBtn.setVisible(false);
    }

    createButton(x, y, text, color, callback, fontSize = '12px') {
        const baseColor = '#' + color.toString(16).padStart(6, '0');
        const w = Math.max(76, Math.min(150, text.length * 12 + 24));
        const h = 24;
        const bg = this.add.graphics();
        const paint = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? C.panel2 : C.bg2, hover ? 0.96 : 0.9);
            bg.fillRoundedRect(x, y - h / 2, w, h, 5);
            bg.fillStyle(color, hover ? 0.22 : 0.1);
            bg.fillRoundedRect(x + 1, y - h / 2 + 1, w - 2, 10, 5);
            bg.lineStyle(1, hover ? C.gold2 : C.gold, hover ? 0.38 : 0.16);
            bg.strokeRoundedRect(x, y - h / 2, w, h, 5);
            bg.fillStyle(color, hover ? 0.9 : 0.5);
            bg.fillRect(x + 4, y - h / 2 + 6, 2, h - 12);
        };
        paint(false);

        const hit = this.add.rectangle(x + w / 2, y, w, h, 0xffffff, 0).setInteractive({ useHandCursor: true });
        const btn = this.add.text(x + w / 2, y, text, {
            fontSize,
            fill: baseColor,
            fontStyle: 'bold',
            fontFamily: UI_FONT
        }).setOrigin(0.5);
        hit.on('pointerdown', callback)
            .on('pointerover', () => { paint(true); btn.setStyle({ fill: colorHex(C.gold2) }); })
            .on('pointerout', () => { paint(false); btn.setStyle({ fill: baseColor }); });

        const originalSetVisible = btn.setVisible.bind(btn);
        btn.setVisible = (visible) => {
            bg.setVisible(visible);
            hit.setVisible(visible);
            originalSetVisible(visible);
            return btn;
        };
        const originalDestroy = btn.destroy.bind(btn);
        btn.destroy = () => {
            bg.destroy();
            hit.destroy();
            originalDestroy();
        };
        return btn;
    }

    createLogPanel() {
        const mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const logX = mapW + 8;
        const logY = 156;
        const logWidth = Math.max(166, W - mapW - 16);
        const logHeight = H - logY - 14;
        
        createPanel(this, logX, logY, logWidth, logHeight, {
            fill: C.panel,
            alpha: 0.86,
            strokeAlpha: 0.16,
            accentAlpha: 0.06,
            radius: 6
        });
        
        this.add.text(logX + 10, logY + 12, '测试日志', {
            fontSize: '13px',
            fill: colorHex(C.gold2),
            fontFamily: UI_FONT,
            fontStyle: 'bold'
        });
        
        this.logText = this.add.text(logX + 10, logY + 38, '', { 
            fontSize: '11px',
            fill: colorHex(C.fg2),
            fontFamily: UI_FONT,
            wordWrap: { width: logWidth - 26 },
            lineSpacing: 3
        });
        this.logs = [];
    }

    createUnitTooltip() {
        // 创建角色信息提示框
        this.tooltipContainer = this.add.container(0, 0).setDepth(1000).setVisible(false);
        
        this.tooltipBg = this.add.rectangle(0, 0, 180, 150, 0x1a1a2e, 0.95);
        this.tooltipBg.setStrokeStyle(2, 0x4a4a6a);
        this.tooltipBg.setOrigin(0, 0);
        
        this.tooltipText = this.add.text(10, 10, '', {
            fontSize: '11px', fill: '#fff', lineSpacing: 4, wordWrap: { width: 160 }
        });
        
        this.tooltipContainer.add([this.tooltipBg, this.tooltipText]);
    }

    checkUnitHover(pointer) {
        const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
        const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
        
        // 检查是否在地图范围内
        if (tileX < 0 || tileX >= GAME_CONFIG.mapWidth || tileY < 0 || tileY >= GAME_CONFIG.mapHeight) {
            this.tooltipContainer.setVisible(false);
            return;
        }
        
        // 检查是否有单位
        const unit = this.getUnitAt(tileX, tileY);
        if (unit && unit.data) {
            this.showUnitTooltip(unit, pointer.x, pointer.y);
        } else {
            this.tooltipContainer.setVisible(false);
        }
    }

    checkUnitTouch(pointer) {
        const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
        const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
        
        // 检查是否在地图范围内
        if (tileX < 0 || tileX >= GAME_CONFIG.mapWidth || tileY < 0 || tileY >= GAME_CONFIG.mapHeight) {
            return;
        }
        
        // 检查是否有单位，显示信息2秒
        const unit = this.getUnitAt(tileX, tileY);
        if (unit && unit.data) {
            this.showUnitTooltip(unit, pointer.x, pointer.y);
            // 2秒后自动隐藏
            if (this.tooltipTimer) this.tooltipTimer.remove();
            this.tooltipTimer = this.time.delayedCall(2000, () => {
                this.tooltipContainer.setVisible(false);
            });
        }
    }

    showUnitTooltip(unit, x, y) {
        const d = unit.data;
        let info = `【${d.name}】\n`;
        info += `━━━━━━━━━━━━━━━━\n`;
        info += `HP: ${d.hp}/${d.maxHp}`;
        if (d.shield > 0) info += `  护盾: ${d.shield}`;
        info += `\n`;
        if (d.np !== undefined) info += `NP: ${d.np}/${d.maxNp}\n`;
        
        // 技能详情
        if (d.skills && d.skills.length > 0) {
            info += `\n【技能】\n`;
            d.skills.forEach((skill, i) => {
                info += `${i+1}. ${skill.name}\n`;
                info += `   ${skill.desc}\n`;
            });
        }
        
        // 宝具
        if (d.noble) {
            info += `\n【宝具】${d.noble.name}\n`;
            info += `   ${d.noble.desc}\n`;
        }
        
        // 增益状态
        let buffs = [];
        if (d.roAiasCount > 0) buffs.push(`七重圆环 ${d.roAiasCount}/7层 (护盾累计)`);
        if (d.nobleImmune) buffs.push(`宝具免疫 (免疫一次宝具伤害)`);
        if (d.projectedWeapon) buffs.push(`投影武器 (+${d.projectionBonus || 0}伤害)`);
        if (d.burstMode && d.burstMode.turns > 0) buffs.push(`魔力放出 ${d.burstMode.turns}次 (范围+${d.burstMode.rangeBonus}, 伤害+命运×${d.burstMode.multiplier})`);
        if (d.avalonCounter && d.avalonCounter.remaining > 0) buffs.push(`阿瓦隆 ${d.avalonCounter.remaining}次 (受伤回复HP和NP)`);
        if (d.critNext) buffs.push(`暴击准备 (下次攻击伤害×1.5)`);
        if (d.guts) {
            const gutsCount = typeof d.guts === 'number' ? d.guts : 1;
            buffs.push(`战斗续行 ${gutsCount}次 (致命伤害保留1HP)`);
        }
        if (d.evade) buffs.push(`闪避 (免疫下次攻击)`);
        if (d.dogLightActions > 0) buffs.push(`额外行动 ${d.dogLightActions}次`);
        if (d.lastStandBonus > 0) buffs.push(`背水一战 攻击+${d.lastStandBonus}`);
        
        if (buffs.length > 0) {
            info += `\n【增益状态】\n`;
            buffs.forEach(b => info += `✦ ${b}\n`);
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
        if (d.sealedSkills) {
            const sealed = Object.entries(d.sealedSkills).filter(([k, v]) => v > 0);
            sealed.forEach(([k, v]) => debuffs.push(`技能${parseInt(k)+1}封锁 ${v}回合`));
        }
        
        if (debuffs.length > 0) {
            info += `\n【减益状态】\n`;
            debuffs.forEach(b => info += `✧ ${b}\n`);
        }
        
        this.tooltipText.setText(info);
        
        // 调整背景大小
        const bounds = this.tooltipText.getBounds();
        this.tooltipBg.width = Math.max(250, bounds.width + 20);
        this.tooltipBg.height = bounds.height + 20;
        
        // 调整位置，避免超出屏幕
        let tooltipX = x + 15;
        let tooltipY = y + 15;
        
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        
        if (tooltipX + this.tooltipBg.width > W) tooltipX = x - this.tooltipBg.width - 15;
        if (tooltipY + this.tooltipBg.height > H) tooltipY = y - this.tooltipBg.height - 15;
        
        this.tooltipContainer.setPosition(tooltipX, tooltipY);
        this.tooltipContainer.setVisible(true);
    }

    updateStatus() {
        const d = this.testUnit.data;
        let status = `HP: ${d.hp}/${d.maxHp}  NP: ${d.np}/${d.maxNp}  护盾: ${d.shield}`;
        
        // 卫宫状态
        if (d.roAiasCount > 0) status += `  七重圆环:${d.roAiasCount}层`;
        if (d.projectedWeapon) status += `  [投影武器]`;
        
        // 阿尔托莉雅状态
        if (d.burstMode && d.burstMode.turns > 0) status += `  魔力放出:${d.burstMode.turns}次`;
        if (d.avalonCounter && d.avalonCounter.remaining > 0) status += `  阿瓦隆:${d.avalonCounter.remaining}次`;
        if (d.critNext) status += `  [暴击准备]`;
        
        // 何乐为状态
        if (d.porcelainEntity) status += `  瓷器:${d.porcelainEntity.damage}/100`;
        if (d.heleweiBurst) status += `  强制攻击:${d.heleweiBurst.forcedAttacks}次`;
        if (d.dogLightActions > 0) status += `  额外行动:${d.dogLightActions}`;
        
        if (d.sealedSkills) {
            const sealed = Object.entries(d.sealedSkills).filter(([k, v]) => v > 0);
            if (sealed.length > 0) {
                status += '  封锁:' + sealed.map(([k, v]) => `技能${parseInt(k)+1}(${v})`).join(',');
            }
        }
        
        this.statusText.setText(status);
        
        if (this.nobleBtn) {
            this.nobleBtn.setStyle({ fill: d.np >= 100 ? '#f1c40f' : '#666' });
        }
        
        if (this.forcedAttackBtn) {
            this.forcedAttackBtn.setVisible(d.heleweiBurst && d.heleweiBurst.forcedAttacks > 0);
        }
    }

    updateDummyStatus() {
        if (!this.dummyTarget || !this.dummyTarget.data) return;
        const d = this.dummyTarget.data;
        const hpStr = d.maxHp === Infinity ? '∞ (无限)' : `${d.hp}/${d.maxHp}`;
        let status = `假人: HP ${hpStr}`;
        if (d.shield > 0) status += ` 护盾:${d.shield}`;
        if (d.roseMark) status += ` [玫瑰标记]`;
        if (d.poison) status += ` [中毒${d.poison.turns}回合]`;
        if (d.slow) status += ` [减速]`;
        if (d.burn) status += ` [灼烧${d.burn.turns}回合]`;
        this.dummyStatusText.setText(status);
    }

    startMoveDummy() {
        // 时间停止中：假人不能移动
        if (this.timeStopTurns > 0 && this.timeStopCaster && this.timeStopCaster.data.team !== 'enemy') {
            this.addLog('固有时域制: 时间停止中，假人无法移动');
            return;
        }
        if (this.isMovingDummy) {
            this.clearHighlights();
            this.isMovingDummy = false;
            this.actionText.setText('');
            return;
        }
        
        this.isMovingDummy = true;
        this.isMoving = false;
        this.isAttacking = false;
        
        // 显示所有可移动的格子
        this.clearHighlights();
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                if (!this.getUnitAt(x, y)) {
                    const highlight = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0xf39c12, 0.4
                    );
                    this.highlightTiles.push({ x, y, type: 'dummyMove', highlight: highlight });
                }
            }
        }
        this.actionText.setText('点击橙色格子移动假人');
    }
    
    // 假人攻击玩家
    dummyAttack() {
        // 时间停止中：假人不能行动
        if (this.timeStopTurns > 0 && this.timeStopCaster && this.timeStopCaster.data.team !== 'enemy') {
            this.addLog('固有时域制: 时间停止中，假人无法行动');
            return;
        }
        const dummy = this.dummyTarget;
        const player = this.testUnit;
        
        // 检查距离
        const dist = Math.abs(dummy.data.x - player.data.x) + Math.abs(dummy.data.y - player.data.y);
        const attackRange = 2; // 假人攻击范围
        
        if (dist > attackRange) {
            this.addLog(`假人攻击失败: 距离${dist}超出范围${attackRange}`);
            this.actionText.setText('假人攻击范围不足!');
            return;
        }
        
        // 计算伤害 (2~12)
        const damage = rollFate(2);
        
        this.addLog(`假人攻击! 造成${damage}伤害`);
        this.actionText.setText(`假人攻击! ${damage}伤害`);
        
        // 检查陷阱（假人移动时触发）
        this.checkAmbushTraps(dummy);
        
        // 造成伤害
        this.dealDamage(player, damage);
        this.showDamageNumber(player, damage);
        
        // 攻击动画
        const originalX = dummy.x;
        const originalY = dummy.y;
        const targetX = player.x;
        const targetY = player.y;
        
        const dx = targetX - originalX;
        const dy = targetY - originalY;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const rushX = originalX + (dx / distPx) * (distPx - 40);
        const rushY = originalY + (dy / distPx) * (distPx - 40);
        
        this.tweens.add({
            targets: dummy,
            x: rushX,
            y: rushY,
            duration: 100,
            yoyo: true
        });
        
        audioManager.playAttack();
        this.updateStatus();
    }

    addLog(msg) {
        this.logs.unshift(msg);
        if (this.logs.length > 12) this.logs.pop();
        this.logText.setText(this.logs.join('\n'));
    }

    addNP(amount) {
        const d = this.testUnit.data;
        
        // 多多益善被动：HP+NP>200时回复减半
        if (d.passive === 'duoduoyishan' && (d.hp + d.np) > 200) {
            amount = Math.floor(amount / 2);
            this.addLog(`多多益善: 回复减半 → NP +${amount}`);
        } else {
            this.addLog(`NP +${amount}`);
        }
        
        d.np = Math.min(d.maxNp, d.np + amount);
        this.updateUnitBars(this.testUnit);
        this.updateStatus();
    }
    
    // 添加HP的方法（支持多多益善）
    addHP(amount) {
        const d = this.testUnit.data;
        
        // 多多益善被动：HP+NP>200时回复减半
        if (d.passive === 'duoduoyishan' && (d.hp + d.np) > 200) {
            amount = Math.floor(amount / 2);
            this.addLog(`多多益善: 回复减半 → HP +${amount}`);
        } else {
            this.addLog(`HP +${amount}`);
        }
        
        d.hp = Math.min(d.maxHp, d.hp + amount);
        this.updateUnitBars(this.testUnit);
        this.updateStatus();
    }

    resetAll() {
        this.testUnit.data.hp = 100;
        this.testUnit.data.np = 100;
        this.testUnit.data.shield = 0;
        this.testUnit.data.roAiasCount = 0;
        this.testUnit.data.roAiasLastValue = 0;
        this.testUnit.data.projectedWeapon = false;
        this.updateUnitBars(this.testUnit);
        
        this.dummyTarget.data.hp = 200;
        this.dummyTarget.data.shield = 0;
        this.updateUnitBars(this.dummyTarget);
        
        if (this.ubwActive) this.endUBW();
        if (this.millenniumCastleActive) SharedSkills.endMillenniumCastle(this);
        this.timeStopTurns = 0;
        this.timeStopCaster = null;

        this.updateStatus();
        this.addLog('=== 全部重置 ===');
    }

    // ========== 宝具系统 ==========
    useNoble() {
        try {
        // 检查是否已死亡
        if (this.testUnit.data.hp <= 0) {
            this.addLog('已被击败，无法行动!');
            return;
        }

        if (this.testUnit.data.np < 100) {
            this.addLog('NP不足!');
            this.actionText.setText('NP不足，无法发动宝具');
            return;
        }
        
        const noble = this.testUnit.data.noble;
        
        // 保存当前NP用于计算宝具加成（韩信国士无双需要）
        this.testUnit.data.npBeforeNoble = this.testUnit.data.np;
        
        this.testUnit.data.np = 0;
        this.updateUnitBars(this.testUnit);
        this.updateStatus();
        
        // 播放宝具动画
        this.playNobleAnimation(noble, () => {
            this.executeNobleEffect(noble);
        });
        } catch(e) { console.error('useNoble error:', e); this.addLog('宝具错误: ' + (e.message || '')); }
    }

    playNobleAnimation(noble, onComplete) {
        const charId = this.testUnit && this.testUnit.data && this.testUnit.data.charId;
        if (charId && typeof NobleCinematics !== 'undefined' && NobleCinematics.playVideo(this, charId, onComplete)) {
            return;
        }
        // 使用新的宝具动画系统
        NobleAnimations.play(this, this.testUnit, noble, onComplete);
    }

    executeNobleEffect(noble) {
        this.addLog(`宝具发动: ${noble.name}`);
        this.actionText.setText(`宝具: ${noble.name}!`);
        SharedSkills.executeNobleEffect(this, this.testUnit, noble);
        // 非 mooncell 宝具需要手动 finish（mooncell 宝具内部已延迟 finish）
        if (noble.effect !== 'moonSpringFlowers') {
            this.finishAction();
        }
    }

    // 遗留宝具回退
    _onNoble(noble) {
        const d = this.testUnit.data;
        switch(noble.effect) {
            case 'unlimitedBladeWorks': this.useUnlimitedBladeWorks(); break;
            case 'heleweiBurst': this.useHeleweiBurst(noble); break;
            case 'arondightOverload': this.useArondightOverload(noble); break;
            case 'unrivaledGeneral': this.useUnrivaledGeneral(noble); break;
            default: {
                const baseDmg = rollFate(6);
                let damage = baseDmg * 5;
                if (d.roundTableOaths && d.roundTableOaths.length > 0) {
                    const result = this.applyRoundTableOaths(d, this.dummyTarget, damage);
                    damage = result.damage;
                }
                this.dealDamage(this.dummyTarget, damage);
                this.showDamageNumber(this.dummyTarget, damage);
                this.addLog(`命运${baseDmg}×5 = ${damage}伤害`);
                break;
            }
        }
    }

    // 兰斯洛特宝具：缚锁全开·过载
    useArondightOverload(noble) {
        const d = this.testUnit.data;
        
        // 检查是否有偷来的宝具
        if (d.stolenNoble && d.stolenNoble.turnsLeft > 0) {
            const stolenNoble = d.stolenNoble.noble;
            this.addLog(`使用偷来的宝具: ${stolenNoble.name}!`);
            d.stolenNoble = null;
            
            // 执行偷来的宝具（简化处理）
            const baseDmg = rollFate(6);
            const damage = baseDmg * 5;
            this.dealDamage(this.dummyTarget, damage);
            this.showDamageNumber(this.dummyTarget, damage);
            this.addLog(`偷来的宝具: ${damage}伤害`);
            return;
        }
        
        // 检查攻击范围
        const attackRange = d.attackRange || 1;
        const dist = Math.abs(this.dummyTarget.data.x - d.x) + Math.abs(this.dummyTarget.data.y - d.y);
        
        if (dist > attackRange) {
            this.addLog(`目标超出攻击范围! (距离${dist}, 范围${attackRange})`);
            this.actionText.setText('目标超出攻击范围');
            // 退还NP
            d.np = 100;
            this.updateUnitBars(this.testUnit);
            this.updateStatus();
            return;
        }
        
        // 原本的宝具效果
        const randomStrength = noble.diceCount || 6;
        const multiplier = noble.multiplier || 4;
        const baseDamage = rollFate(randomStrength);
        const totalDamage = baseDamage * multiplier;
        
        // 无视闪避
        const hadEvade = this.dummyTarget.data.evade;
        if (noble.ignoreEvade) {
            this.dummyTarget.data.evade = false;
            if (hadEvade) this.addLog('无视闪避!');
        }
        
        this.dealDamage(this.dummyTarget, totalDamage);
        this.showDamageNumber(this.dummyTarget, totalDamage);
        this.addLog(`缚锁全开·过载: ${baseDamage}×${multiplier}=${totalDamage}伤害`);
    }
    
    // 韩信宝具：国士无双
    useUnrivaledGeneral(noble) {
        const d = this.testUnit.data;
        const attackRange = d.attackRange || 2;
        
        // 检查目标是否在攻击范围内
        const dist = Math.abs(this.dummyTarget.data.x - d.x) + Math.abs(this.dummyTarget.data.y - d.y);
        
        if (dist > attackRange) {
            this.addLog(`目标超出攻击范围! (距离${dist}, 范围${attackRange})`);
            this.actionText.setText('目标超出攻击范围');
            // 退还NP
            d.np = d.npBeforeNoble || 100;
            this.updateUnitBars(this.testUnit);
            return;
        }
        
        // 使用发动宝具前保存的NP值计算加成
        const npUsed = d.npBeforeNoble || 100;
        const excessNp = Math.max(0, npUsed - 100); // 超过100的部分
        const npMultiplier = 1 + Math.floor(excessNp / 50) * 0.5; // 每50点+50%
        
        // 基础伤害 10~60
        const baseDamage = rollFate(10);
        const totalDamage = Math.floor(baseDamage * npMultiplier);
        
        this.dealDamage(this.dummyTarget, totalDamage);
        this.showDamageNumber(this.dummyTarget, totalDamage);
        
        if (excessNp > 0) {
            this.addLog(`国士无双! NP${npUsed}(超出${excessNp}) → ${baseDamage}×${npMultiplier.toFixed(1)}=${totalDamage}伤害`);
        } else {
            this.addLog(`国士无双! ${baseDamage}×1.0=${totalDamage}伤害`);
        }
        this.actionText.setText(`国士无双! ${totalDamage}伤害!`);
        
        // 显示特效
        this.showUnrivaledEffect();
    }
    
    // 国士无双特效
    showUnrivaledEffect() {
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

    useHeleweiBurst(noble) {
        const d = this.testUnit.data;
        
        // 设置强制攻击状态
        d.heleweiBurst = {
            forcedAttacks: noble.forcedAttacks || 3,
            poisonDamage: noble.poisonDamage || 8,
            poisonTurns: noble.poisonTurns || 3,
            slowAmount: noble.slowAmount || 1,
            aoeMode: false
        };
        
        // 检查敌人是否有玫瑰标记
        const target = this.dummyTarget;
        if (target.data.roseMark) {
            d.heleweiBurst.aoeMode = true;
            this.addLog('检测到玫瑰标记！伤害将变为范围伤害');
        }
        
        this.addLog(`何乐不为·有何不为 激活！`);
        this.addLog(`接下来${d.heleweiBurst.forcedAttacks}次行动强制变为普通攻击`);
        this.addLog('攻击将附加中毒和减速效果');
        
        this.actionText.setText(`强制攻击剩余: ${d.heleweiBurst.forcedAttacks}次`);
        this.updateStatus();
    }

    // 执行强制攻击（宝具效果）- 范围伤害
    performForcedAttack() {
        const d = this.testUnit.data;
        if (!d.heleweiBurst || d.heleweiBurst.forcedAttacks <= 0) return;
        
        // 计算伤害
        // 随机伤害 (基础值到基础值*6)
        let baseDamage = rollFate(d.diceCount);
        
        this.addLog(`强制攻击: 命运${baseDamage}基础伤害`);
        
        // 以假人为中心进行范围攻击
        const centerX = this.dummyTarget.data.x;
        const centerY = this.dummyTarget.data.y;
        
        // 对范围内所有单位造成伤害（3x3范围）
        const hitTargets = [];
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = centerX + dx;
                const checkY = centerY + dy;
                
                // 检查边界
                if (checkX < 0 || checkX >= GAME_CONFIG.mapWidth || 
                    checkY < 0 || checkY >= GAME_CONFIG.mapHeight) continue;
                
                // 检查是否有敌方单位
                const unit = this.getUnitAt(checkX, checkY);
                if (unit && unit !== this.testUnit && unit.data) {
                    this.dealDamageToTarget(unit, baseDamage);
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
                
                // 检查是否有瓷器
                if (d.porcelainEntity && d.porcelainEntity.x === checkX && d.porcelainEntity.y === checkY) {
                    const absorbed = this.addDamageToPorcelain(baseDamage);
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
        
        this.updateStatus();
    }

    // ========== 无限剑制 ==========
    useUnlimitedBladeWorks() {
        this.ubwActive = true;
        this.ubwDuration = 5;
        
        // 保存已有武器
        const existingPositions = [];
        if (this.ubwSwords && this.ubwSwords.length > 0) {
            this.ubwSwords.forEach(sword => {
                existingPositions.push({ x: sword.x, y: sword.y, damage: sword.damage });
                if (sword.sprite) sword.sprite.destroy();
            });
        }
        this.ubwSwords = [];
        
        // 改变地图
        this.changeMapToUBW();
        
        // 恢复已有武器
        existingPositions.forEach(pos => this.spawnUBWSwordAt(pos.x, pos.y, pos.damage));
        
        // 生成新剑
        for (let i = 0; i < 3; i++) this.spawnUBWSword();
        
        // 初始伤害 (随机4~24)
        const total = rollFate(4);
        const damage = total * 4;
        this.dealDamage(this.dummyTarget, damage);
        this.showDamageNumber(this.dummyTarget, damage);
        
        this.addLog(`无限剑制展开! 持续${this.ubwDuration}回合`);
        this.addLog(`剑雨: 命运${total}×4 = ${damage}伤害`);
        
        this.time.delayedCall(500, () => this.processUBWSwords());
        this.createUBWControls();
    }

    createUBWControls() {
        const H = this.cameras.main.height;
        const y = H - 20;
        this.ubwNextTurnBtn = this.createButton(430, y, '[模拟回合]', 0xf0c040, () => this.simulateUBWTurn(), '10px');
        this.ubwEndBtn = this.createButton(520, y, '[结束结界]', 0xe74c3c, () => this.endUBW(), '10px');
    }

    simulateUBWTurn() {
        if (!this.ubwActive) return;
        
        this.ubwDuration--;
        this.addLog(`--- UBW剩余 ${this.ubwDuration} 回合 ---`);
        
        if (Phaser.Math.Between(1, 100) <= 60) this.spawnUBWSword();
        this.processUBWSwords();
        
        if (this.ubwDuration <= 0) this.endUBW();
    }

    changeMapToUBW() {
        // 添加无限剑制背景图片
        const bgIndex = Phaser.Math.Between(0, 2);
        const mapW = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize;
        const mapH = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize;
        
        this.ubwBackground = this.add.image(mapW / 2, mapH / 2, `ubw_bg_${bgIndex}`);
        this.ubwBackground.setDisplaySize(mapW, mapH);
        this.ubwBackground.setDepth(-1);
        this.ubwBackground.setAlpha(0);
        
        this.tweens.add({
            targets: this.ubwBackground,
            alpha: 0.9,
            duration: 1000
        });
        
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.map[y][x].tile.setFillStyle(0x000000, 0.2);
                this.map[y][x].tile.setStrokeStyle(1, 0xcd853f, 0.5);
            }
        }
    }

    restoreMapFromUBW() {
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
        
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                this.map[y][x].tile.setFillStyle(this.map[y][x].originalColor);
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
                this.spawnUBWSwordAt(x, y);
                return;
            }
            attempts++;
        }
    }

    spawnUBWSwordAt(x, y, damage) {
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        // 随机选择武器贴图
        const weaponIndex = Phaser.Math.Between(0, 3);
        const sword = this.add.image(posX, posY, `weapon_${weaponIndex}`);
        sword.setDisplaySize(GAME_CONFIG.tileSize - 10, GAME_CONFIG.tileSize - 10);
        sword.setAlpha(0);
        
        this.tweens.add({ targets: sword, alpha: 1, duration: 200 });
        
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
                this.swordAttack(sword, target);
            } else {
                this.moveSwordToward(sword, target);
            }
        });
    }

    moveSwordToward(sword, target) {
        const dx = Math.sign(target.data.x - sword.x);
        const dy = Math.sign(target.data.y - sword.y);
        
        let newX = sword.x + dx;
        let newY = sword.y + dy;
        
        newX = Math.max(0, Math.min(GAME_CONFIG.mapWidth - 1, newX));
        newY = Math.max(0, Math.min(GAME_CONFIG.mapHeight - 1, newY));
        
        if (!this.getUnitAt(newX, newY) && !this.getSwordAt(newX, newY)) {
            sword.x = newX;
            sword.y = newY;
        }
        
        const posX = sword.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = sword.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        this.tweens.add({ targets: sword.sprite, x: posX, y: posY, duration: 200, ease: 'Power2' });
        
        const dist = Math.abs(target.data.x - sword.x) + Math.abs(target.data.y - sword.y);
        if (dist <= 1) {
            this.time.delayedCall(250, () => this.swordAttack(sword, target));
        }
    }

    swordAttack(sword, target) {
        if (!target || target.data.hp <= 0 || !sword || !sword.sprite) return;
        
        const damage = sword.damage;
        const targetPosX = target.data.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const targetPosY = target.data.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        this.tweens.add({
            targets: sword.sprite, x: targetPosX, y: targetPosY, duration: 100,
            onComplete: () => {
                this.dealDamage(target, damage);
                this.showDamageNumber(target, damage);
                audioManager.playAttack();
                sword.sprite.destroy();
                this.ubwSwords = this.ubwSwords.filter(s => s !== sword);
            }
        });
    }

    endUBW() {
        if (!this.ubwActive) return;
        
        if (this.ubwSwords.length > 0) {
            const npGain = this.ubwSwords.length * 10;
            this.testUnit.data.np = Math.min(100, this.testUnit.data.np + npGain);
            this.updateUnitBars(this.testUnit);
            this.addLog(`剩余${this.ubwSwords.length}剑，恢复${npGain}NP`);
            
            this.ubwSwords.forEach(s => { if (s.sprite) s.sprite.destroy(); });
        }
        
        this.ubwSwords = [];
        this.ubwActive = false;
        this.ubwDuration = 0;
        this.restoreMapFromUBW();
        
        if (this.ubwNextTurnBtn) { this.ubwNextTurnBtn.destroy(); this.ubwNextTurnBtn = null; }
        if (this.ubwEndBtn) { this.ubwEndBtn.destroy(); this.ubwEndBtn = null; }
        
        this.addLog('无限剑制结束');
        this.updateStatus();
    }

    // ========== 技能系统 ==========
    useSkill(index) {
        try {
            if (!this.testUnit || !this.testUnit.data || this.testUnit.data.hp <= 0) return;
            const skill = this.testUnit.data.skills[index];
            if (!skill) return;
            this.addLog(`使用: ${skill.name}`);
            audioManager.playSkill();
            // 水月无影 → 月瞳·城临走 SharedSkills（有视频播放），其余走本地 handler
            if (skill.effect === 'millenniumCastle') { SharedSkills.executeSkill(this, this.testUnit, index); return; }
            if (skill.effect === 'timeStop') { this.useTimeStop(skill); return; }
            if (skill.effect === 'moonShadow') { this.useMoonShadow(); return; }
            // 通用效果 → SharedSkills
            if (['heal','charge','atkBuff','extraDice','burstMode','shield','evade','guts','critBuff','healAll','teamAtkBuff'].includes(skill.effect)) {
                SharedSkills.executeSkill(this, this.testUnit, index);
                return;
            }
            this._onSkill(skill, index);
        } catch(e) {
            console.error('useSkill error:', e);
            this.addLog('技能错误: ' + (e.message || ''));
        }
    }

    // 共享模块需要的接口
    finishAction() {
        this.clearHighlights();
        // 千年城回合处理
        if (this.millenniumCastleActive && this.millenniumCastleTurns > 0) {
            this.processMillenniumCastle();
        }
        this.updateStatus();
    }

    processMillenniumCastle() {
        SharedSkills.processMillenniumCastle(this);
    }

    createRadialBurstAt(x, y, color, radius, count, duration) {
        // 简单粒子爆发
        for (var i = 0; i < (count || 8); i++) {
            var angle = (i / (count || 8)) * Math.PI * 2;
            var dist = (radius || 40) * (0.5 + Math.random() * 0.5);
            var p = this.add.circle(
                x + Math.cos(angle) * dist * 0.3,
                y + Math.sin(angle) * dist * 0.3,
                Phaser.Math.Between(2, 5), color, 0.7
            ).setDepth(1200);
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0, scale: 0.2,
                duration: duration || 800,
                onComplete: function() { p.destroy(); }
            });
        }
    }

    destroyUnit(unit) {
        this.handleUnitDeath(unit);
    }

    _setupSkillDamageInput(damage) {
        if (this.dummyTarget && this.dummyTarget.data) {
            this.dealDamage(this.dummyTarget, damage);
            this.showDamageNumber(this.dummyTarget, damage);
            this.addLog(`技能造成 ${damage} 伤害`);
        }
        this.finishAction();
    }

    // 遗留技能回退（共享模块不处理的复杂技能）
    _onSkill(skill, index) {
        switch(skill.effect) {
            case 'burstModeRoll': break;
            case 'shieldRoll': break;
            case 'avalonFull': break;
            case 'avalonCounter': this.useAvalonCounter(); break;
            case 'roundTableOath': this.useRoundTableOath(); break;
            case 'burstWithHammer': this.useBurstWithHammer(skill); break;
            case 'intuition': this.useIntuition(skill); break;
            case 'chargeAndMove': break;
            case 'chargeRollAndMove': break;
            case 'healRoll': break;
            case 'roAias': this.useRoAias(); break;
            case 'projection': this.useProjection(); break;
            case 'tripleStrike': this.useTripleStrike(); break;
            case 'porcelainAttack': this.usePorcelainAttack(); break;
            case 'roseSwordsman': this.useRoseSwordsman(); break;
            case 'dogLight': this.useDogLight(); break;
            case 'forAllOne': this.useForAllOne(); break;
            case 'arondight': this.useArondight(); break;
            case 'knightOfOwner': this.useKnightOfOwner(); break;
            case 'secretPath': this.useSecretPath(); break;
            case 'lastStand': this.useLastStand(); break;
            case 'ambush': this.useAmbush(skill); break;
            default: this.addLog(`技能效果: ${skill.desc}`); break;
        }
    }

    // ========== 阿尔托莉雅技能 ==========
    useBurstWithHammer(skill) {
        const d = this.testUnit.data;
        const target = this.dummyTarget;
        
        // 计算与目标的距离
        const dist = Math.abs(target.data.x - d.x) + Math.abs(target.data.y - d.y);
        
        if (dist > (skill.hammerRange || 5)) {
            this.addLog(`目标超出风王铁锤范围(${skill.hammerRange || 5}格)`);
            return;
        }
        
        // 风王铁锤伤害 = (6-距离) × 命运(1-6)
        const fateRoll = rollSingleFate();
        let hammerDamage = Math.max(1, 6 - dist) * fateRoll;
        let bonusLog = [];
        
        // 应用圆桌誓约效果
        if (d.roundTableOaths && d.roundTableOaths.length > 0) {
            const oathResult = this.applyRoundTableOaths(d, target, hammerDamage);
            hammerDamage = oathResult.damage;
            oathResult.effects.forEach(e => bonusLog.push(e));
        }
        
        this.dealDamage(target, hammerDamage);
        this.showDamageNumber(target, hammerDamage);
        
        let logMsg = `风王铁锤: (6-${dist})×${fateRoll}`;
        if (bonusLog.length > 0) logMsg += ` (${bonusLog.join(', ')})`;
        logMsg += ` = ${hammerDamage}伤害`;
        this.addLog(logMsg);
        
        // 设置后续2次攻击强化
        d.burstMode = {
            turns: skill.turns || 2,
            rangeBonus: skill.rangeBonus || 2,
            multiplier: skill.multiplier || 3
        };
        
        this.addLog(`接下来${d.burstMode.turns}次攻击: 范围+${d.burstMode.rangeBonus}, 伤害+命运×${d.burstMode.multiplier}`);
        this.updateStatus();
    }

    useAvalonCounter() {
        const d = this.testUnit.data;
        const fateRoll = rollSingleFate();
        
        d.avalonCounter = {
            count: fateRoll,
            remaining: fateRoll
        };
        
        this.addLog(`阿瓦隆: 接下来${fateRoll}次受伤时回复伤害一半的HP和NP`);
        this.updateStatus();
    }

    useIntuition(skill) {
        const d = this.testUnit.data;
        // 直觉: 1-6 × 10 = 10-60 NP
        const npGain = Phaser.Math.Between(10, 60);
        
        d.np = Math.min(100, d.np + npGain);
        d.critNext = true;
        
        this.updateUnitBars(this.testUnit);
        this.addLog(`直觉: NP+${npGain}, 下次攻击暴击`);
        this.updateStatus();
    }

    // 圆桌誓约：召唤圆桌骑士的加护
    useRoundTableOath() {
        const d = this.testUnit.data;
        const scene = this;
        
        // 圆桌骑士誓约列表
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
        
        // 随机结果
        const randomResult = Phaser.Math.Between(1, 6);
        const npGain = randomResult * 10;
        
        d.np = Math.min(d.maxNp, d.np + npGain);
        scene.updateUnitBars(scene.testUnit);
        
        // 随机选择1~3位骑士
        const knightCount = Phaser.Math.Between(1, 3);
        const shuffled = Phaser.Utils.Array.Shuffle([...ROUND_TABLE_OATHS]);
        const selectedOaths = shuffled.slice(0, knightCount);
        
        // 初始化誓约数组
        if (!d.roundTableOaths) d.roundTableOaths = [];
        
        // 添加选中的誓约
        selectedOaths.forEach(oath => {
            d.roundTableOaths.push(oath);
        });
        
        // 显示结果
        const knightNames = selectedOaths.map(o => o.knight).join('、');
        scene.addLog(`圆桌誓约! NP+${npGain}`);
        scene.addLog(`响应者: ${knightNames}`);
        
        // 播放骑士召唤动画
        this.playKnightSummonAnimation(selectedOaths, () => {
            // 动画完成后应用效果
            selectedOaths.forEach(oath => {
                scene.addLog(`【${oath.knight}】${oath.oath}`);
                scene.addLog(`  效果: ${oath.effect}`);
                
                // 贝德维尔立即给护盾
                if (oath.condition === 'stronger') {
                    const shieldAmount = oath.bonus.shield();
                    d.shield = (d.shield || 0) + shieldAmount;
                    scene.updateUnitBars(scene.testUnit);
                    scene.addLog(`贝德维尔誓约: 获得${shieldAmount}护盾`);
                }
                // 崔斯坦立即加攻击范围
                if (oath.condition === 'brave') {
                    const rangeBonus = oath.bonus.rangeBonus();
                    d.attackRange = (d.attackRange || 1) + rangeBonus;
                    d.roundTableRangeBonus = rangeBonus;
                    scene.addLog(`崔斯坦誓约: 攻击范围+${rangeBonus}`);
                }
                // 加雷斯立即加减伤（不叠加，取最大值）
                if (oath.condition === 'good') {
                    const reduce = oath.bonus.damageReduce();
                    d.roundTableDamageReduce = Math.max(d.roundTableDamageReduce || 0, reduce);
                    scene.addLog(`加雷斯誓约: 下次受伤减少${reduce}`);
                }
            });
            
            scene.actionText.setText(`圆桌誓约! NP+${npGain}, ${knightNames} 响应`);
            scene.updateStatus();
        });
    }
    
    // 骑士召唤动画
    playKnightSummonAnimation(oaths, callback) {
        const scene = this;
        
        // 安全检查
        if (!scene || !scene.cameras || !scene.cameras.main) {
            if (callback) callback();
            return;
        }
        
        const centerX = scene.cameras.main.width / 2;
        const centerY = scene.cameras.main.height / 2 - 20;
        
        // 创建半透明黑色背景
        const overlay = scene.add.rectangle(centerX, centerY, 
            scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.85);
        overlay.setDepth(100);
        
        // 显示技能名称
        const titleText = scene.add.text(centerX, 60, '『圆桌誓约』', {
            fontSize: '28px', fill: '#f1c40f', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(101).setAlpha(0);
        
        scene.tweens.add({
            targets: titleText,
            alpha: 1,
            duration: 300
        });
        
        // 计算骑士图片位置
        const spacing = 100;
        const startX = centerX - (oaths.length - 1) * spacing / 2;
        
        const allElements = [overlay, titleText];
        let currentIndex = 0;
        
        // 使用 Phaser 的 time.addEvent 来依次显示骑士
        const showNextKnight = () => {
            if (currentIndex >= oaths.length) {
                // 所有骑士显示完毕，等待后淡出
                scene.time.delayedCall(1200, () => {
                    scene.tweens.add({
                        targets: allElements,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            allElements.forEach(el => {
                                if (el && el.destroy) el.destroy();
                            });
                            if (callback) callback();
                        }
                    });
                });
                return;
            }
            
            const oath = oaths[currentIndex];
            const x = startX + currentIndex * spacing;
            
            // 创建骑士图片
            if (scene.textures.exists(oath.image)) {
                const knight = scene.add.image(x, centerY - 20, oath.image);
                knight.setDisplaySize(60, 60);
                knight.setDepth(102);
                knight.setAlpha(0);
                const targetScaleX = knight.scaleX;
                const targetScaleY = knight.scaleY;
                knight.setScale(targetScaleX * 0.3, targetScaleY * 0.3);
                allElements.push(knight);
                
                // 淡入放大动画
                scene.tweens.add({
                    targets: knight,
                    alpha: 1,
                    scaleX: targetScaleX,
                    scaleY: targetScaleY,
                    duration: 300,
                    ease: 'Back.easeOut'
                });
                
                // 金色光环
                const glow = scene.add.circle(x, centerY - 20, 35, 0xf1c40f, 0.4);
                glow.setDepth(101);
                allElements.push(glow);
                
                scene.tweens.add({
                    targets: glow,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0,
                    duration: 500
                });
            }
            
            // 骑士名字
            const nameText = scene.add.text(x, centerY + 25, oath.knight, {
                fontSize: '14px', fill: '#fff', fontStyle: 'bold',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(102).setAlpha(0);
            allElements.push(nameText);
            
            scene.tweens.add({
                targets: nameText,
                alpha: 1,
                duration: 200
            });
            
            // 誓约文字（底部）
            const oathText = scene.add.text(centerX, centerY + 60 + currentIndex * 18, 
                `${oath.knight}:「${oath.oath}」`, {
                fontSize: '10px', fill: '#f1c40f',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(102).setAlpha(0);
            allElements.push(oathText);
            
            scene.tweens.add({
                targets: oathText,
                alpha: 1,
                duration: 200
            });
            
            audioManager.playSkill();
            
            currentIndex++;
            // 400ms后显示下一个骑士
            scene.time.delayedCall(400, showNextKnight);
        };
        
        // 开始显示第一个骑士
        scene.time.delayedCall(400, showNextKnight);
    }

    // ========== 卫宫技能 ==========

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
        this.addLog(`第${d.roAiasCount}层: +${newShield}护盾 (累计${d.shield})`);
        this.updateStatus();
    }

    useProjection() {
        const d = this.testUnit.data;
        
        if (d.projectedWeapon) {
            this.showProjectionOptions();
        } else {
            // 投影加成: 1×2 到 6×2 = 2-12
            const bonus = Phaser.Math.Between(2, 12);
            d.projectedWeapon = true;
            d.projectionBonus = bonus;
            this.addLog(`投影完成! +${bonus}伤害`);
        }
        this.updateStatus();
    }

    showProjectionOptions() {
        if (this.projectionBtns) this.projectionBtns.forEach(btn => btn.destroy());
        this.projectionBtns = [];

        const H = this.cameras.main.height;

        const btn1 = this.createButton(200, H - 100, '[投掷武器]', 0xe74c3c, () => {
            this.clearProjectionBtns();
            this.projectThrow();
        }, '12px');

        const btn2 = this.createButton(320, H - 100, '[放置武器]', 0xf0c040, () => {
            this.clearProjectionBtns();
            this.projectPlace();
        }, '13px');
        
        this.projectionBtns.push(btn1, btn2);
    }

    clearProjectionBtns() {
        if (this.projectionBtns) {
            this.projectionBtns.forEach(btn => btn.destroy());
            this.projectionBtns = [];
        }
    }

    projectThrow() {
        const d = this.testUnit.data;
        // 投掷武器：随机6~36伤害 + 等量NP
        const damage = rollFate(6);
        
        this.dealDamage(this.dummyTarget, damage);
        this.showDamageNumber(this.dummyTarget, damage);
        audioManager.playAttack();
        
        this.testUnit.data.np = Math.min(100, this.testUnit.data.np + damage);
        this.updateUnitBars(this.testUnit);
        
        d.projectedWeapon = false;
        d.projectionBonus = 0;
        
        this.addLog(`投掷武器! ${damage}伤害, NP+${damage}`);
        this.updateStatus();
    }

    projectPlace() {
        const d = this.testUnit.data;
        
        // 投影放置新武器：随机3~18伤害
        const damage = rollFate(3);
        
        // 先造成伤害
        this.dealDamage(this.dummyTarget, damage);
        this.showDamageNumber(this.dummyTarget, damage);
        audioManager.playAttack();
        
        // 然后放置武器
        let x, y, attempts = 0;
        do {
            x = Phaser.Math.Between(0, GAME_CONFIG.mapWidth - 1);
            y = Phaser.Math.Between(0, GAME_CONFIG.mapHeight - 1);
            attempts++;
        } while ((this.getUnitAt(x, y) || (this.ubwSwords && this.getSwordAt(x, y))) && attempts < 20);
        
        if (attempts < 20) {
            this.spawnUBWSwordAt(x, y);
            this.addLog(`投影新武器: ${damage}伤害，武器放置于(${x},${y})`);
        } else {
            this.addLog(`投影新武器: ${damage}伤害`);
        }
        
        d.projectedWeapon = false;
        d.projectionBonus = 0;
        this.updateStatus();
    }

    useTripleStrike() {
        // 鹤翼三连：连续攻击3次，每次随机3~18伤害，最后一击双倍
        const target = this.dummyTarget;
        let totalDamage = 0;
        let totalNp = 0;
        
        this.addLog('=== 鹤翼三连 ===');
        
        for (let strike = 0; strike < 3; strike++) {
            // 每次随机3~18
            let strikeDamage = rollFate(3);
            
            // 最后一击双倍伤害
            if (strike === 2) {
                strikeDamage *= 2;
                this.addLog(`第${strike + 1}击: ${strikeDamage/2}×2 = ${strikeDamage}伤害 (双倍!)`);
            } else {
                this.addLog(`第${strike + 1}击: ${strikeDamage}伤害`);
            }
            
            totalDamage += strikeDamage;
            totalNp += strikeDamage;
            
            // 显示每次攻击的伤害数字（延迟显示）
            const dmg = strikeDamage;
            this.time.delayedCall(strike * 300, () => {
                this.showDamageNumber(target, dmg);
                audioManager.playAttack();
            });
        }
        
        // 延迟造成总伤害
        this.time.delayedCall(600, () => {
            this.dealDamage(target, totalDamage);
            this.testUnit.data.np = Math.min(100, this.testUnit.data.np + totalNp);
            this.updateUnitBars(this.testUnit);
            this.addLog(`总计: ${totalDamage}伤害, NP+${totalNp}`);
            this.updateStatus();
        });
    }

    // ========== 移动和攻击 ==========
    startMove() {
        // 检查是否已死亡
        if (this.testUnit.data.hp <= 0) {
            this.addLog('已被击败，无法行动!');
            return;
        }
        
        if (this.isMoving) {
            this.clearHighlights();
            this.isMoving = false;
            this.actionText.setText('');
            return;
        }
        
        this.isMoving = true;
        this.isAttacking = false;
        this.showMoveRange(this.testUnit, this.testUnit.data.moveRange);
        this.actionText.setText('点击蓝色格子移动');
    }

    startAttack() {
        // 检查是否已死亡
        if (this.testUnit.data.hp <= 0) {
            this.addLog('已被击败，无法行动!');
            return;
        }
        
        if (this.isAttacking) {
            this.clearHighlights();
            this.isAttacking = false;
            this.actionText.setText('');
            return;
        }
        
        this.isAttacking = true;
        this.isMoving = false;
        this.showAttackRange(this.testUnit, this.testUnit.data.attackRange);
        this.actionText.setText('点击红色格子攻击');
    }

    handleMapClick(pointer) {
        const tileX = Math.floor(pointer.x / GAME_CONFIG.tileSize);
        const tileY = Math.floor(pointer.y / GAME_CONFIG.tileSize);
        
        // 处理瞬移（暗度陈仓）
        if (this.waitingForTeleport) {
            this.handleTeleportClick(tileX, tileY);
            return;
        }
        
        // 处理陷阱放置（十面埋伏）
        if (this.placingTraps) {
            this.handleTrapPlacement(tileX, tileY);
            return;
        }
        
        if (this.isMoving) {
            const moveTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'move');
            if (moveTile) {
                this.moveUnit(this.testUnit, tileX, tileY);
                this.clearHighlights();
                this.isMoving = false;
                this.actionText.setText('');
                this.addLog(`移动到 (${tileX},${tileY})`);
            }
        } else if (this.isMovingDummy) {
            const dummyTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'dummyMove');
            if (dummyTile) {
                this.moveUnit(this.dummyTarget, tileX, tileY);
                this.clearHighlights();
                this.isMovingDummy = false;
                this.actionText.setText('');
                this.addLog(`假人移动到 (${tileX},${tileY})`);
            }
        } else if (this.isAttacking) {
            const attackTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'attack');
            if (attackTile) {
                this.performAttack(tileX, tileY);
                this.clearHighlights();
                this.isAttacking = false;
                this.actionText.setText('');
            }
        } else if (this.isSelectingRoseTarget) {
            // 玫瑰剑士目标选择
            const roseTile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'rose');
            if (roseTile) {
                this.clearHighlights();
                this.isSelectingRoseTarget = false;
                this.actionText.setText('');
                this.executeRoseSwordsman(tileX, tileY, roseTile.target, roseTile.isPorcelain);
            }
        }
    }

    performAttack(tileX, tileY) {
        const d = this.testUnit.data;
        
        // 检查是否攻击瓷器
        if (d.porcelainEntity && d.porcelainEntity.x === tileX && d.porcelainEntity.y === tileY) {
            // 攻击自己的瓷器来充能 (随机基础伤害)
            let totalDamage = rollFate(d.diceCount);
            
            // 给瓷器充能
            const absorbed = this.addDamageToPorcelain(totalDamage);
            audioManager.playAttack();
            
            this.addLog(`攻击瓷器: ${totalDamage}伤害，瓷器吸收${absorbed}`);
            this.updateStatus();
            return;
        }
        
        const target = this.getUnitAt(tileX, tileY);
        if (!target || target === this.testUnit) return;
        
        // 普通攻击伤害 (随机基础伤害)
        let baseDamage = rollFate(d.diceCount);
        let totalDamage = baseDamage;
        let bonusLog = [];
        
        // 背水一战加成（atkBuff）
        if (d.atkBuff && d.atkBuff > 0) {
            totalDamage += d.atkBuff;
            bonusLog.push(`背水+${d.atkBuff}`);
        }
        
        // 投影武器加成
        if (d.projectedWeapon && d.projectionBonus) {
            totalDamage += d.projectionBonus;
            bonusLog.push(`投影+${d.projectionBonus}`);
            d.projectedWeapon = false;
            d.projectionBonus = 0;
        }
        
        // 暴击检查（阿尔托莉雅直觉技能）
        if (d.critNext) {
            totalDamage = Math.floor(totalDamage * 1.5);
            bonusLog.push('暴击×1.5');
            d.critNext = false;
        }
        
        // 魔力放出加成 (1-6 × multiplier = 3-18)
        if (d.burstMode && d.burstMode.turns > 0) {
            const burstBonus = rollFate(d.burstMode.multiplier);
            totalDamage += burstBonus;
            d.burstMode.turns--;
            bonusLog.push(`魔放+${burstBonus}`);
        }
        
        // 圆桌誓约效果
        if (d.roundTableOaths && d.roundTableOaths.length > 0) {
            const oathResult = this.applyRoundTableOaths(d, target, totalDamage);
            totalDamage = oathResult.damage;
            oathResult.effects.forEach(e => bonusLog.push(e));
        }
        
        // 暗度陈仓特殊攻击（可以和背水一战叠加）
        if (d.secretPathActive) {
            // 基础伤害×2 + 背水加成
            let secretDamage = baseDamage * 2;
            if (d.atkBuff && d.atkBuff > 0) {
                secretDamage += d.atkBuff;
                bonusLog.push(`背水+${d.atkBuff}`);
            }
            
            const npGain = secretDamage;
            const hpCost = Math.floor(secretDamage / 2);
            
            d.np = Math.min(d.maxNp || 100, d.np + npGain);
            d.hp = Math.max(1, d.hp - hpCost);
            d.secretPathActive = false;
            
            this.dealDamage(target, secretDamage);
            this.showDamageNumber(target, secretDamage);
            this.updateUnitBars(this.testUnit);
            audioManager.playAttack();
            
            let logMsg = `暗度陈仓! ${baseDamage}×2`;
            if (bonusLog.length > 0) logMsg += ` + ${bonusLog.join('+')}`;
            logMsg += ` = ${secretDamage}伤害, NP+${npGain}, HP-${hpCost}`;
            this.addLog(logMsg);
            this.updateStatus();
            return;
        }
        
        this.dealDamage(target, totalDamage);
        this.showDamageNumber(target, totalDamage);
        audioManager.playAttack();
        
        // 获得NP
        const npGain = Math.floor(totalDamage / 2);
        this.testUnit.data.np = Math.min(100, this.testUnit.data.np + npGain);
        this.updateUnitBars(this.testUnit);
        
        let logMsg = `攻击: ${baseDamage}`;
        if (bonusLog.length > 0) logMsg += ` (${bonusLog.join(', ')})`;
        logMsg += ` = ${totalDamage}伤害, NP+${npGain}`;
        this.addLog(logMsg);
        this.updateStatus();
    }
    
    // 应用圆桌誓约效果
    applyRoundTableOaths(attackerData, defender, baseDamage) {
        const oaths = attackerData.roundTableOaths;
        if (!oaths || oaths.length === 0) {
            return { damage: baseDamage, effects: [] };
        }
        
        let damage = baseDamage;
        const effects = [];
        
        oaths.forEach(oath => {
            const getBonus = (key) => typeof oath.bonus[key] === 'function' ? oath.bonus[key]() : oath.bonus[key];
            
            switch(oath.condition) {
                case 'saveWorld': // 亚瑟：对HP<50%敌人伤害+20~50%
                    if (defender.data.hp < defender.data.maxHp * 0.5) {
                        const mult = getBonus('lowHpDamage');
                        damage = Math.floor(damage * mult);
                        effects.push(`亚瑟+${Math.round((mult-1)*100)}%`);
                    }
                    break;
                case 'survival': // 凯：HP<70%时攻击+20~40
                    if (attackerData.hp < attackerData.maxHp * 0.7) {
                        const bonus = getBonus('survivalAtk');
                        damage += bonus;
                        effects.push(`凯+${bonus}`);
                    }
                    break;
                case 'duel': // 巴乐米底：场上敌人≤2时伤害+20~40%
                    {
                        const enemies = this.units.filter(u => u.data.team !== 'player');
                        if (enemies.length <= 2) {
                            const mult = getBonus('duelDamage');
                            damage = Math.floor(damage * mult);
                            effects.push(`巴乐米底+${Math.round((mult-1)*100)}%`);
                        }
                    }
                    break;
                case 'humanity': // 加赫里斯：攻击后NP+20~40
                    {
                        const npGain = getBonus('humanityNp');
                        attackerData.np = Math.min(attackerData.maxNp || 100, attackerData.np + npGain);
                        this.updateUnitBars(this.testUnit);
                        effects.push(`加赫里斯NP+${npGain}`);
                    }
                    break;
                case 'truth': // 阿格规文：25~40%暴击率
                    {
                        const critChance = getBonus('critBonus');
                        if (Math.random() < critChance) {
                            damage = Math.floor(damage * 1.5);
                            effects.push(`阿格规文暴击!`);
                        }
                    }
                    break;
                case 'fairy': // 兰斯洛特：攻击后NP+15~30
                    {
                        const npGain = getBonus('fairyNp');
                        attackerData.np = Math.min(attackerData.maxNp || 100, attackerData.np + npGain);
                        this.updateUnitBars(this.testUnit);
                        effects.push(`兰斯洛特NP+${npGain}`);
                    }
                    break;
                case 'evil': // 莫德雷德：伤害+15~30%
                    {
                        const mult = getBonus('evilDamage');
                        damage = Math.floor(damage * mult);
                        effects.push(`莫德雷德+${Math.round((mult-1)*100)}%`);
                    }
                    break;
                case 'selfless': // 加拉哈德：攻击后回复15~30HP
                    {
                        const heal = getBonus('selflessHeal');
                        attackerData.hp = Math.min(attackerData.maxHp, attackerData.hp + heal);
                        this.updateUnitBars(this.testUnit);
                        effects.push(`加拉哈德HP+${heal}`);
                    }
                    break;
                case 'honor': // 高文：正面攻击伤害+20~35%
                    {
                        const mult = getBonus('honorDamage');
                        damage = Math.floor(damage * mult);
                        effects.push(`高文+${Math.round((mult-1)*100)}%`);
                    }
                    break;
                // 崔斯坦和加雷斯的效果在使用技能时已经应用
            }
        });
        
        return { damage, effects };
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
                    this.highlightTiles.push({ x, y, type: 'move', highlight: highlight });
                }
            }
        }
    }

    showAttackRange(unit, range) {
        this.clearHighlights();
        const d = this.testUnit.data;
        
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const dist = Math.abs(x - unit.data.x) + Math.abs(y - unit.data.y);
                if (dist <= range && dist > 0) {
                    const target = this.getUnitAt(x, y);
                    const hasPorcelain = d.porcelainEntity && d.porcelainEntity.x === x && d.porcelainEntity.y === y;
                    
                    if ((target && target !== unit) || hasPorcelain) {
                        const color = hasPorcelain ? 0x9b59b6 : 0xe74c3c; // 紫色表示瓷器
                        const highlight = this.add.rectangle(
                            x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                            y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                            GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                            color, 0.5
                        );
                        this.highlightTiles.push({ x, y, type: 'attack', highlight: highlight, isPorcelain: hasPorcelain });
                    }
                }
            }
        }
    }

    clearHighlights() {
        this.highlightTiles.forEach(t => { 
            if (t.sprite) t.sprite.destroy(); 
            if (t.highlight) t.highlight.destroy();
        });
        this.highlightTiles = [];
    }

    moveUnit(unit, x, y) {
        unit.data.x = x;
        unit.data.y = y;
        
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        this.tweens.add({ targets: unit, x: posX, y: posY, duration: 200 });
        this.tweens.add({ targets: unit.data.border, x: posX, y: posY, duration: 200 });
        this.tweens.add({ targets: unit.data.hpBar, x: posX, y: posY - 35, duration: 200 });
        this.tweens.add({ targets: unit.data.hpBarBg, x: posX, y: posY - 35, duration: 200 });
        this.tweens.add({ targets: unit.data.npBar, x: posX - 25, y: posY - 26, duration: 200 });
        this.tweens.add({ targets: unit.data.npBarBg, x: posX, y: posY - 26, duration: 200 });
        this.tweens.add({ targets: unit.data.shieldBar, x: posX - 25, y: posY - 42, duration: 200 });
    }

    getUnitAt(x, y) {
        return this.units.find(u => u.data && u.data.x === x && u.data.y === y);
    }

    showDamageNumber(unit, damage) {
        const posX = unit.data.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = unit.data.y * GAME_CONFIG.tileSize;
        
        const dmgText = this.add.text(posX, posY, `-${damage}`, {
            fontSize: '20px', fill: '#e74c3c', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: dmgText,
            y: posY - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => dmgText.destroy()
        });
    }

    updateUnitBars(unit) {
        if (!unit.data) return;

        // 无限血（假人）：血条永远满
        const hpPercent = unit.data.maxHp === Infinity ? 1 : Math.max(0, unit.data.hp / unit.data.maxHp);
        unit.data.hpBar.width = 50 * hpPercent;
        unit.data.hpBar.fillColor = hpPercent > 0.5 ? 0x2ecc71 : (hpPercent > 0.25 ? 0xf39c12 : 0xe74c3c);
        
        if (unit.data.npBar) {
            const npPercent = unit.data.np / unit.data.maxNp;
            unit.data.npBar.width = 50 * npPercent;
        }
        
        if (unit.data.shieldBar) {
            const shieldPercent = Math.min(1, unit.data.shield / 50);
            unit.data.shieldBar.width = 50 * shieldPercent;
        }
    }

    // ========== 何乐为技能 ==========
    usePorcelainAttack() {
        const d = this.testUnit.data;
        
        if (!d.porcelainEntity) {
            // 在附近空格子放置瓷器
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
                
                // 检查边界
                if (px < 0 || px >= GAME_CONFIG.mapWidth || py < 0 || py >= GAME_CONFIG.mapHeight) {
                    continue;
                }
                
                // 检查是否有单位或剑
                const hasUnit = this.getUnitAt(px, py);
                const hasSword = this.ubwSwords && this.getSwordAt(px, py);
                
                if (!hasUnit && !hasSword) {
                    this.spawnPorcelain(px, py);
                    placed = true;
                    this.addLog(`瓷器放置在 (${px}, ${py})`);
                    break;
                }
            }
            
            if (!placed) {
                this.addLog('没有空位放置瓷器！');
                return;
            }
            
            d.porcelainActive = true;
            this.actionText.setText('瓷器已放置，将吸收伤害');
        } else {
            // 引爆瓷器
            const damage = d.porcelainEntity.damage || 0;
            if (damage > 0) {
                this.dealDamageToTarget(this.dummyTarget, damage);
                this.showDamageNumber(this.dummyTarget, damage);
                this.addLog(`瓷器爆炸！造成${damage}点伤害`);
                audioManager.playAttack();
            } else {
                this.addLog('瓷器没有积累伤害');
            }
            
            this.destroyPorcelain();
        }
        this.updateStatus();
    }

    spawnPorcelain(x, y) {
        const posX = x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const posY = y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const tileSize = GAME_CONFIG.tileSize;
        
        // 使用抠好图的瓷器
        let porcelain;
        const ciqiKey = this.textures.exists('ciqi_nobg') ? 'ciqi_nobg' : (this.textures.exists('ciqi') ? 'ciqi' : null);
        
        if (ciqiKey) {
            porcelain = this.add.image(posX, posY, ciqiKey);
            // 计算缩放比例使图片填满整个格子
            const targetSize = tileSize * 0.95;  // 填满95%的格子
            const scaleX = targetSize / porcelain.width;
            const scaleY = targetSize / porcelain.height;
            const finalScale = Math.max(scaleX, scaleY);  // 用max确保填满
            porcelain.setScale(finalScale);
            porcelain.targetScale = finalScale;
            porcelain.textureKey = ciqiKey;  // 保存贴图key用于碎片效果
        } else {
            porcelain = this.add.circle(posX, posY, tileSize / 2.2, 0xffffff);
            porcelain.setStrokeStyle(3, 0x9b59b6);
            porcelain.targetScale = 1;
            porcelain.textureKey = null;
        }
        
        // HP条显示累积伤害
        const hpBarBg = this.add.rectangle(posX, posY - 30, 52, 8, 0x333333);
        const hpBar = this.add.rectangle(posX, posY - 30, 0, 6, 0x9b59b6);
        
        // 伤害数字
        const dmgText = this.add.text(posX, posY + 25, '0', {
            fontSize: '12px', fill: '#9b59b6', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.testUnit.data.porcelainEntity = {
            sprite: porcelain,
            x: x,
            y: y,
            damage: 0,
            maxDamage: 100,
            hpBar: hpBar,
            hpBarBg: hpBarBg,
            dmgText: dmgText,
            textureKey: ciqiKey
        };
        
        // 出现动画 - 使用目标缩放值
        const targetScale = porcelain.targetScale;
        porcelain.setAlpha(0).setScale(0);
        this.tweens.add({
            targets: porcelain,
            alpha: 1,
            scale: targetScale,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    destroyPorcelain() {
        const d = this.testUnit.data;
        if (d.porcelainEntity) {
            const entity = d.porcelainEntity;
            const posX = entity.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
            const posY = entity.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
            
            // 播放碎片效果
            this.playPorcelainShatterEffect(posX, posY, entity.textureKey);
            
            if (entity.sprite) entity.sprite.destroy();
            if (entity.hpBar) entity.hpBar.destroy();
            if (entity.hpBarBg) entity.hpBarBg.destroy();
            if (entity.dmgText) entity.dmgText.destroy();
            d.porcelainEntity = null;
            d.porcelainActive = false;
        }
    }

    // 瓷器碎片效果
    playPorcelainShatterEffect(centerX, centerY, textureKey) {
        const shardCount = 24;  // 更多碎片
        const shards = [];
        const tileSize = GAME_CONFIG.tileSize;
        
        for (let i = 0; i < shardCount; i++) {
            let shard;
            if (textureKey && this.textures.exists(textureKey)) {
                // 用瓷器图片裁剪碎片
                shard = this.add.image(centerX, centerY, textureKey);
                const tex = this.textures.get(textureKey);
                const frame = tex.get();
                const texW = frame.width || 100;
                const texH = frame.height || 100;
                
                // 更大的裁剪区域
                const cropW = Phaser.Math.Between(texW * 0.2, texW * 0.4);
                const cropH = Phaser.Math.Between(texH * 0.2, texH * 0.4);
                const cropX = Phaser.Math.Between(0, Math.max(0, texW - cropW));
                const cropY = Phaser.Math.Between(0, Math.max(0, texH - cropH));
                
                shard.setCrop(cropX, cropY, cropW, cropH);
                // 碎片大小为格子的30-50%
                const shardSize = tileSize * Phaser.Math.FloatBetween(0.3, 0.5);
                shard.setDisplaySize(shardSize, shardSize);
            } else {
                // 备用：青花瓷颜色碎片 - 更大
                const colors = [0xadd8e6, 0x87ceeb, 0xffffff, 0x4169e1];
                const size = tileSize * Phaser.Math.FloatBetween(0.25, 0.4);
                shard = this.add.rectangle(centerX, centerY, size, size, 
                    colors[i % colors.length], 1);
            }
            
            shard.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
            shard.setDepth(1500);
            shards.push(shard);
            
            // 碎片飞散动画 - 飞得更远
            const angle = (i / shardCount) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3);
            const dist = Phaser.Math.Between(tileSize * 0.8, tileSize * 1.5);
            
            this.tweens.add({
                targets: shard,
                x: centerX + Math.cos(angle) * dist,
                y: centerY + Math.sin(angle) * dist,
                rotation: shard.rotation + Phaser.Math.FloatBetween(Math.PI, Math.PI * 3),
                scale: 0.2,
                alpha: 0,
                duration: 600,
                delay: i * 15,
                ease: 'Power2',
                onComplete: () => shard.destroy()
            });
        }
    }

    updatePorcelainDisplay() {
        const d = this.testUnit.data;
        if (d.porcelainEntity) {
            const percent = d.porcelainEntity.damage / d.porcelainEntity.maxDamage;
            d.porcelainEntity.hpBar.width = 50 * percent;
            d.porcelainEntity.dmgText.setText(d.porcelainEntity.damage.toString());
        }
    }

    // 给瓷器添加伤害
    addDamageToPorcelain(damage) {
        const d = this.testUnit.data;
        if (d.porcelainEntity) {
            const absorbed = Math.min(damage, d.porcelainEntity.maxDamage - d.porcelainEntity.damage);
            d.porcelainEntity.damage += absorbed;
            this.updatePorcelainDisplay();
            this.addLog(`瓷器吸收${absorbed}伤害 (累计${d.porcelainEntity.damage}/100)`);
            return absorbed;
        }
        return 0;
    }

    useRoseSwordsman() {
        // 玫瑰剑士 - 选择目标模式
        this.addLog('选择玫瑰剑士的目标（点击敌人或瓷器）');
        this.actionText.setText('选择玫瑰剑士目标');
        
        // 显示可攻击范围（全地图范围内的敌人和瓷器）
        this.showRoseTargets();
        this.isSelectingRoseTarget = true;
    }

    showRoseTargets() {
        this.clearHighlights();
        const d = this.testUnit.data;
        
        // 高亮所有可选目标
        this.units.forEach(unit => {
            if (unit !== this.testUnit && unit.data) {
                const x = unit.data.x;
                const y = unit.data.y;
                const highlight = this.add.rectangle(
                    x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                    0xe91e63, 0.5
                );
                this.highlightTiles.push({ x, y, type: 'rose', highlight: highlight, target: unit });
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
            this.highlightTiles.push({ x: px, y: py, type: 'rose', highlight: highlight, isPorcelain: true });
        }
    }

    executeRoseSwordsman(targetX, targetY, targetUnit, isPorcelain) {
        const d = this.testUnit.data;
        
        // 计算基础伤害 (随机3~18)
        let baseDamage = rollFate(3);
        
        this.addLog(`玫瑰剑士: ${baseDamage}基础伤害`);
        
        // 显示五角星效果（以目标为中心）
        this.showStarEffectWithRange(targetX, targetY, () => {
            // 对范围内所有单位造成伤害（5x5范围）
            const hitTargets = [];
            
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const checkX = targetX + dx;
                    const checkY = targetY + dy;
                    
                    // 检查边界
                    if (checkX < 0 || checkX >= GAME_CONFIG.mapWidth || 
                        checkY < 0 || checkY >= GAME_CONFIG.mapHeight) continue;
                    
                    // 检查是否有敌方单位
                    const unit = this.getUnitAt(checkX, checkY);
                    if (unit && unit !== this.testUnit && unit.data) {
                        let damage = baseDamage;
                        
                        // 有玫瑰标记伤害+50%
                        if (unit.data.roseMark) {
                            damage = Math.floor(damage * 1.5);
                            this.addLog(`${unit.data.name}有标记，伤害+50%`);
                        }
                        
                        this.dealDamage(unit, damage);
                        this.showDamageNumber(unit, damage);
                        
                        // 施加标记
                        unit.data.roseMark = { turns: 10 };
                        hitTargets.push({ name: unit.data.name, damage });
                    }
                    
                    // 检查是否有瓷器
                    if (d.porcelainEntity && d.porcelainEntity.x === checkX && d.porcelainEntity.y === checkY) {
                        const absorbed = this.addDamageToPorcelain(baseDamage);
                        hitTargets.push({ name: '瓷器', damage: absorbed, isPorcelain: true });
                    }
                }
            }
            
            if (hitTargets.length > 0) {
                audioManager.playAttack();
                hitTargets.forEach(t => {
                    if (t.isPorcelain) {
                        this.addLog(`瓷器吸收${t.damage}伤害`);
                    } else {
                        this.addLog(`${t.name}受到${t.damage}伤害，施加标记`);
                    }
                });
            } else {
                this.addLog('范围内没有目标');
            }
            
            this.updateStatus();
        });
    }

    showStarEffectWithRange(centerX, centerY, onComplete) {
        // 五角星的5个顶点
        const starPoints = [
            { dx: 0, dy: -2 },
            { dx: 2, dy: -1 },
            { dx: 1, dy: 2 },
            { dx: -1, dy: 2 },
            { dx: -2, dy: -1 },
        ];
        
        const effects = [];
        const tileSize = GAME_CONFIG.tileSize;
        
        // 显示五角星顶点（不显示范围指示器，只显示星星动画）
        starPoints.forEach((pos, i) => {
            const x = (centerX + pos.dx) * tileSize + tileSize / 2;
            const y = (centerY + pos.dy) * tileSize + tileSize / 2;
            
            // 检查是否在地图范围内
            if (centerX + pos.dx >= 0 && centerX + pos.dx < GAME_CONFIG.mapWidth &&
                centerY + pos.dy >= 0 && centerY + pos.dy < GAME_CONFIG.mapHeight) {
                const effect = this.add.star(x, y, 5, 10, 20, 0xe91e63, 0.9);
                effect.setAlpha(0).setScale(0);
                effects.push(effect);
                
                this.tweens.add({
                    targets: effect,
                    alpha: 1,
                    scale: 1.5,
                    duration: 150,
                    delay: i * 50,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        // 星星出现后立即淡出
                        this.tweens.add({
                            targets: effect,
                            alpha: 0,
                            scale: 0.5,
                            duration: 200,
                            onComplete: () => {
                                if (effect && effect.destroy) effect.destroy();
                            }
                        });
                    }
                });
            }
        });
        
        // 中心爆炸效果
        const centerEffect = this.add.circle(
            centerX * tileSize + tileSize / 2,
            centerY * tileSize + tileSize / 2,
            5, 0xff69b4
        );
        
        this.tweens.add({
            targets: centerEffect,
            radius: 40,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                if (centerEffect && centerEffect.destroy) centerEffect.destroy();
            }
        });
        
        // 快速回调，不等待动画完成
        this.time.delayedCall(400, () => {
            if (onComplete) onComplete();
        });
    }

    showStarEffect(centerX, centerY, onComplete) {
        this.showStarEffectWithRange(centerX, centerY, onComplete);
    }

    useDogLight() {
        const d = this.testUnit.data;
        
        // 恢复NP (随机4~24)
        const npGain = rollFate(4);
        
        d.np = Math.min(100, d.np + npGain);
        this.updateUnitBars(this.testUnit);
        
        // 获得额外行动次数
        const extraActions = Phaser.Math.Between(1, 3);
        d.dogLightActions = extraActions;
        
        // 初始化技能封锁
        if (!d.sealedSkills) d.sealedSkills = {};
        
        this.addLog(`卷狗之光: NP+${npGain}，获得${extraActions}次额外行动`);
        this.addLog('警告：每次行动后将封锁一个技能3回合');
        this.actionText.setText(`额外行动: ${extraActions}次`);
        
        this.updateStatus();
    }

    // 兰斯洛特技能1：骑士不留名
    useForAllOne() {
        const d = this.testUnit.data;
        const skill = d.skills.find(s => s.effect === 'forAllOne');
        const duration = skill?.duration || 2;
        
        d.forAllOne = duration;
        d.critNext = true;
        d.rideMove = true;
        
        this.testUnit.setAlpha(0.5);
        
        this.addLog(`骑士不留名: 隐身${duration}回合`);
        this.addLog('效果: 免疫技能伤害、下次攻击暴击、移动后可再移动');
        this.actionText.setText(`隐身 ${duration} 回合`);
        
        this.updateStatus();
    }

    // 兰斯洛特技能2：无毁的湖光
    useArondight() {
        const d = this.testUnit.data;
        const skill = d.skills.find(s => s.effect === 'arondight');
        
        const shieldValue = rollFate(skill?.shieldDice || 3) * (skill?.shieldMultiplier || 2);
        
        d.shield += shieldValue;
        d.arondightActive = true;
        d.atkBuff = (d.atkBuff || 0) + (skill?.atkBonus || 10);
        
        this.updateUnitBars(this.testUnit);
        
        this.addLog(`无毁的湖光: +${shieldValue}护盾`);
        this.addLog('效果: 受击反弹30%伤害，攻击+10');
        this.actionText.setText(`阿隆戴特装备! 护盾+${shieldValue}`);
        
        this.updateStatus();
    }

    // 兰斯洛特技能3：永恒之臂
    useKnightOfOwner() {
        const d = this.testUnit.data;
        const skill = d.skills.find(s => s.effect === 'knightOfOwner');
        const sealDuration = skill?.sealDuration || 3;
        
        // 测试模式：夺取假人的宝具
        const targetNoble = this.dummyTarget.data.noble;
        
        d.stolenNoble = {
            noble: JSON.parse(JSON.stringify(targetNoble)),
            fromUnit: this.dummyTarget.data.name,
            turnsLeft: sealDuration
        };
        
        this.dummyTarget.data.nobleSeal = sealDuration;
        
        this.addLog(`永恒之臂: 夺取了 ${this.dummyTarget.data.name} 的宝具!`);
        this.addLog(`${this.dummyTarget.data.name} 的宝具被封印 ${sealDuration} 回合`);
        this.actionText.setText(`夺取宝具: ${d.stolenNoble.noble.name}`);
        
        this.updateStatus();
        this.updateDummyStatus();
    }

    // ========== 韩信技能 ==========
    
    // 韩信技能1：暗度陈仓
    useSecretPath() {
        const d = this.testUnit.data;
        
        this.addLog('暗度陈仓: 选择瞬移位置');
        this.actionText.setText('点击地图任意空位瞬移');
        
        // 延迟设置状态，避免点击按钮时立即触发handleMapClick
        this.time.delayedCall(100, () => {
            // 高亮所有空位
            this.clearHighlights();
            for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
                for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                    if (!this.getUnitAt(x, y) && (x !== d.x || y !== d.y)) {
                        const highlight = this.add.rectangle(
                            x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                            y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                            GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                            0x9b59b6, 0.5
                        );
                        highlight.setDepth(10);
                        this.highlightTiles.push({ x, y, type: 'teleport', highlight });
                    }
                }
            }
            
            // 设置等待瞬移状态
            this.waitingForTeleport = true;
            this.addLog(`高亮了${this.highlightTiles.length}个可瞬移位置`);
        });
    }
    
    // 处理瞬移点击（在handleMapClick中调用）
    handleTeleportClick(tileX, tileY) {
        if (!this.waitingForTeleport) return false;
        
        const tile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'teleport');
        
        if (tile) {
            // 瞬移效果：消失再出现
            const unit = this.testUnit;
            const d = unit.data;
            
            // 先消失
            this.tweens.add({
                targets: [unit, d.border, d.hpBar, d.hpBarBg, d.npBar, d.npBarBg, d.shieldBar],
                alpha: 0,
                duration: 150,
                onComplete: () => {
                    // 更新位置数据
                    d.x = tileX;
                    d.y = tileY;
                    
                    // 直接设置新位置
                    const posX = tileX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                    const posY = tileY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
                    
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
                        targets: [unit, d.border, d.hpBar, d.hpBarBg, d.npBar, d.npBarBg, d.shieldBar],
                        alpha: 1,
                        duration: 150
                    });
                }
            });
            
            // 设置暗度陈仓状态
            d.secretPathActive = true;
            
            this.addLog('瞬移成功! 下次攻击: 伤害×2, 回复等量NP, 扣除伤害一半HP');
            this.actionText.setText('暗度陈仓准备完毕!');
            this.updateStatus();
        } else {
            this.addLog('取消瞬移');
        }
        
        this.clearHighlights();
        this.waitingForTeleport = false;
        return true;
    }
    
    // 韩信技能2：背水一战
    useLastStand() {
        const d = this.testUnit.data;
        
        // 用基础HP（100）计算损失，而不是无上限的maxHp
        const baseHp = d.baseHp || 100;
        const lostHp = Math.max(0, baseHp - d.hp); // 损失的HP（基于100计算）
        const damageBonus = lostHp; // 损失HP直接转为攻击加成
        
        d.atkBuff = (d.atkBuff || 0) + damageBonus;
        d.lastStandBonus = (d.lastStandBonus || 0) + damageBonus;
        
        this.addLog(`背水一战: 损失${lostHp}HP → 攻击+${damageBonus} (总计+${d.atkBuff})`);
        
        // HP低于基础HP的30%时获得战斗续行
        if (d.hp <= baseHp * 0.3) {
            // 战斗续行可以叠加次数
            d.guts = (typeof d.guts === 'number' ? d.guts : (d.guts ? 1 : 0)) + 1;
            this.addLog(`HP危急! 获得战斗续行! (共${d.guts}次)`);
            this.actionText.setText(`背水一战! 攻击+${damageBonus}, 战斗续行${d.guts}次!`);
        } else {
            this.actionText.setText(`背水一战! 攻击+${damageBonus}`);
        }
        
        this.updateStatus();
    }
    
    // 韩信技能3：十面埋伏 - 玩家手动选择位置
    useAmbush(skill) {
        const d = this.testUnit.data;
        const maxTraps = skill?.maxTraps || 10;
        
        // 初始化陷阱数组
        if (!this.ambushTraps) this.ambushTraps = [];
        
        // 检查当前陷阱数量
        const currentTraps = this.ambushTraps.length;
        if (currentTraps >= maxTraps) {
            this.addLog('陷阱已达上限(10个)!');
            this.actionText.setText('陷阱已达上限!');
            return;
        }
        
        // 本次可放置的陷阱数量 (3~6个，但不超过上限)
        const trapCount = Math.min(Phaser.Math.Between(3, 6), maxTraps - currentTraps);
        
        this.addLog(`十面埋伏: 可布置${trapCount}个陷阱`);
        this.actionText.setText(`点击地图放置陷阱 (0/${trapCount})`);
        
        // 延迟设置状态，避免点击按钮时立即触发
        this.time.delayedCall(100, () => {
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
                        const highlight = this.add.rectangle(
                            tx * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                            ty * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                            GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                            0x8b0000, 0.4
                        );
                        highlight.setDepth(10);
                        this.highlightTiles.push({ x: tx, y: ty, type: 'trap', highlight });
                    }
                }
            }
            
            // 设置放置陷阱状态
            this.placingTraps = true;
            this.trapSkill = skill;
            this.maxTrapsCount = trapCount;
            this.placedTrapsCount = 0;
        });
    }
    
    // 处理陷阱放置点击
    handleTrapPlacement(tileX, tileY) {
        if (!this.ambushTraps) this.ambushTraps = [];
        
        const tile = this.highlightTiles.find(t => t.x === tileX && t.y === tileY && t.type === 'trap');
        
        if (tile) {
            // 创建陷阱（测试模式可见）
            const trapSprite = this.add.rectangle(
                tileX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                tileY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                GAME_CONFIG.tileSize - 8, GAME_CONFIG.tileSize - 8,
                0x8b0000, 0.5
            );
            trapSprite.setStrokeStyle(2, 0xff0000, 0.8);
            trapSprite.setDepth(5);
            
            this.ambushTraps.push({
                x: tileX,
                y: tileY,
                owner: this.testUnit,
                sprite: trapSprite,
                rootDuration: this.trapSkill?.rootDuration || 1
            });
            
            // 移除该位置的高亮
            tile.highlight.destroy();
            this.highlightTiles = this.highlightTiles.filter(t => t !== tile);
            
            this.placedTrapsCount++;
            this.addLog(`在(${tileX},${tileY})布置陷阱 (${this.placedTrapsCount}/${this.maxTrapsCount})`);
            this.actionText.setText(`点击地图放置陷阱 (${this.placedTrapsCount}/${this.maxTrapsCount})`);
            
            if (this.placedTrapsCount >= this.maxTrapsCount) {
                // 达到本次上限，结束布置
                this.clearHighlights();
                this.placingTraps = false;
                const totalTraps = this.ambushTraps.length;
                this.addLog(`布置完成! 本次${this.placedTrapsCount}个，总计${totalTraps}/10`);
                this.actionText.setText(`布置${this.placedTrapsCount}个陷阱完成!`);
                this.updateStatus();
            }
        } else {
            // 点击非高亮区域，结束布置
            this.clearHighlights();
            this.placingTraps = false;
            if (this.placedTrapsCount > 0) {
                const totalTraps = this.ambushTraps.length;
                this.addLog(`布置完成! 本次${this.placedTrapsCount}个，总计${totalTraps}/10`);
                this.actionText.setText(`布置${this.placedTrapsCount}个陷阱完成!`);
            } else {
                this.addLog('取消布置陷阱');
                this.actionText.setText('');
            }
            this.updateStatus();
        }
    }
    
    // 检查陷阱触发
    checkAmbushTraps(unit) {
        if (!this.ambushTraps || this.ambushTraps.length === 0) return;
        
        const triggeredTraps = this.ambushTraps.filter(trap => 
            trap.x === unit.data.x && trap.y === unit.data.y && 
            trap.owner && trap.owner.data && trap.owner.data.team !== unit.data.team
        );
        
        triggeredTraps.forEach(trap => {
            const damage = rollFate(3);
            this.dealDamage(unit, damage);
            this.showDamageNumber(unit, damage);
            
            unit.data.rooted = (unit.data.rooted || 0) + trap.rootDuration;
            
            this.addLog(`${unit.data.name} 触发陷阱! ${damage}伤害, 定身${trap.rootDuration}回合!`);
            
            trap.sprite.destroy();
            this.ambushTraps = this.ambushTraps.filter(t => t !== trap);
        });
    }
    
    // ========== 职阶技能 ==========
    useClassSkill() {
        const d = this.testUnit.data;
        const classSkill = CLASS_SKILLS[d.class];
        
        if (!classSkill) {
            this.addLog('该职阶没有职阶技能');
            return;
        }
        
        this.addLog(`职阶技能: ${classSkill.name}`);
        audioManager.playSkill();
        
        switch(classSkill.effect) {
            case 'riding':
                // 骑乘：移动后可再移动一次
                d.ridingActive = true;
                this.addLog('骑乘: 下次移动后可再移动一次');
                this.actionText.setText('骑乘效果激活!');
                break;
                
            case 'magicResist':
                // 对魔力：减少受到的魔法伤害
                d.magicResist = (d.magicResist || 0) + 1;
                this.addLog(`对魔力: 魔法伤害减免+1 (当前${d.magicResist})`);
                this.actionText.setText('对魔力效果激活!');
                break;
                
            case 'independentAction':
                // 单独行动：NP消耗减少
                const npGain = rollFate(2);
                d.np = Math.min(d.maxNp, d.np + npGain);
                this.updateUnitBars(this.testUnit);
                this.addLog(`单独行动: NP+${npGain}`);
                this.actionText.setText(`单独行动! NP+${npGain}`);
                break;
                
            case 'territoryCreation':
                // 领地创造：在当前位置创建魔力领域
                this.addLog('领地创造: 在当前位置创建魔力领域');
                this.actionText.setText('领地创造效果激活!');
                break;
                
            case 'itemConstruction':
                // 道具作成：获得随机道具效果
                const effects = ['护盾+20', 'HP+20', 'NP+20'];
                const effect = effects[Phaser.Math.Between(0, effects.length - 1)];
                if (effect === '护盾+20') d.shield += 20;
                else if (effect === 'HP+20') d.hp = Math.min(d.maxHp, d.hp + 20);
                else d.np = Math.min(d.maxNp, d.np + 20);
                this.updateUnitBars(this.testUnit);
                this.addLog(`道具作成: ${effect}`);
                this.actionText.setText(`道具作成! ${effect}`);
                break;
                
            case 'presenceConcealment':
                // 气息遮断：进入隐身状态
                d.stealth = 2;
                d.doubleDamage = true;
                this.testUnit.setAlpha(0.5);
                this.addLog('气息遮断: 隐身2回合，下次攻击伤害×2');
                this.actionText.setText('气息遮断效果激活!');
                break;
                
            case 'madEnhancement':
                // 狂化：攻击力提升，但无法使用技能
                const atkBonus = rollFate(2);
                d.atkBuff = (d.atkBuff || 0) + atkBonus;
                d.berserk = true;
                this.addLog(`狂化: 攻击+${atkBonus}，攻击命中回复NP`);
                this.actionText.setText(`狂化! 攻击+${atkBonus}`);
                break;
                
            case 'battleContinuation':
                // 战斗续行（Lancer）
                d.guts = true;
                this.addLog('战斗续行: 获得一次战斗续行');
                this.actionText.setText('战斗续行效果激活!');
                break;
                
            case 'teleport':
                // 月之转移：全图传送
                this.actionText.setText('选择传送位置（全图任意空格）');
                this.showFullMapTeleport();
                this.setupTeleportInput();
                return; // 不立即 updateStatus，等传送完成后 finishAction 处理
            default:
                this.addLog(`${classSkill.name}: ${classSkill.desc}`);
                break;
        }

        this.updateStatus();
    }

    showFullMapTeleport() {
        this.clearHighlights();
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                if (!this.getUnitAt(x, y) && this.map[y] && this.map[y][x] && this.map[y][x].walkable) {
                    const h = this.add.rectangle(
                        x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                        GAME_CONFIG.tileSize - 4, GAME_CONFIG.tileSize - 4,
                        0xb8a9d4, 0.3
                    );
                    h.setStrokeStyle(1, 0xd4b8f0, 0.5);
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
                scene.addLog(`${scene.testUnit.data.name} 传送到 (${tx},${ty})`);
                scene.moveUnit(scene.testUnit, tx, ty);
                scene.createRadialBurstAt(tx * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    ty * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2, 0xb8a9d4, 60, 12, 1000);
                scene.finishAction();
            } else {
                scene.setupTeleportInput();
            }
        });
    }

    // 重写dealDamage以支持瓷器吸收
    dealDamage(unit, damage) {
        // 加雷斯誓约：减少受到伤害（只生效一次）
        if (unit === this.testUnit && unit.data.roundTableDamageReduce) {
            const reduce = unit.data.roundTableDamageReduce;
            const oldDamage = damage;
            damage = Math.max(0, damage - reduce); // 可以减到0
            this.addLog(`加雷斯誓约: 减伤${reduce} (${oldDamage}→${damage})`);
            // 消耗减伤效果
            unit.data.roundTableDamageReduce = 0;
        }
        
        // 检查是否是自己且有瓷器实体
        if (unit === this.testUnit && this.testUnit.data.porcelainEntity) {
            const absorbed = this.addDamageToPorcelain(damage);
            if (absorbed >= damage) return;
            damage -= absorbed;
        }
        
        this.dealDamageToTarget(unit, damage);
    }

    dealDamageToTarget(unit, damage) {
        // 检查闪避
        if (unit.data.evade) {
            unit.data.evade = false;
            this.addLog(`${unit.data.name} 闪避了攻击!`);
            return;
        }
        
        if (unit.data.shield > 0) {
            if (unit.data.shield >= damage) {
                unit.data.shield -= damage;
                this.addLog(`护盾吸收${damage}伤害`);
                this.updateUnitBars(unit);
                if (unit === this.dummyTarget) this.updateDummyStatus();
                return;
            } else {
                damage -= unit.data.shield;
                this.addLog(`护盾吸收${unit.data.shield}伤害`);
                unit.data.shield = 0;
            }
        }
        
        unit.data.hp = Math.max(0, unit.data.hp - damage);
        
        // 检查战斗续行
        if (unit.data.hp <= 0 && unit.data.guts) {
            const gutsCount = typeof unit.data.guts === 'number' ? unit.data.guts : 1;
            if (gutsCount > 0) {
                unit.data.hp = 1;
                unit.data.guts = gutsCount - 1;
                if (unit.data.guts <= 0) unit.data.guts = false;
                this.addLog(`${unit.data.name} 战斗续行发动! 保留1HP (剩余${unit.data.guts || 0}次)`);
            }
        }
        
        this.updateUnitBars(unit);
        if (unit === this.dummyTarget) this.updateDummyStatus();
        
        if (unit.data.hp <= 0) {
            this.addLog(`${unit.data.name} 被击败!`);
            this.handleUnitDeath(unit);
        }
    }
    
    // 处理单位死亡
    handleUnitDeath(unit) {
        // 如果是月影分身，转移NP
        if (unit.data && unit.data.isClone && !unit.data.isNobleClone && unit.data.cloneMaster && unit.data.cloneMaster.data) {
            const transferNp = unit.data.np || 0;
            if (transferNp > 0) {
                unit.data.cloneMaster.data.np = Math.min(100, (unit.data.cloneMaster.data.np || 0) + transferNp);
                this.updateUnitBars(unit.data.cloneMaster);
                this.addLog(`分身被击杀！NP(${transferNp})转移至本体`);
            }
        }
        // 淡出动画
        this.tweens.add({
            targets: [unit, unit.data.border, unit.data.hpBar, unit.data.hpBarBg, unit.data.npBar, unit.data.npBarBg, unit.data.shieldBar, unit.data.cloneLabel].filter(Boolean),
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.units = this.units.filter(u => u !== unit);
                if (unit === this.testUnit) {
                    this.actionText.setText('你被击败了! 点击[重置]重新开始');
                    this.addLog('=== 游戏结束 ===');
                } else if (unit === this.dummyTarget) {
                    this.actionText.setText('假人被击败! 点击[重置]重新开始');
                    this.addLog('=== 假人被击败 ===');
                }
            }
        });
    }

    // ================================================================
    // 水月无影 - 固有时域制
    // ================================================================
    useTimeStop(skill) {
        const d = this.testUnit.data;
        const duration = Phaser.Math.Between(2, 3);
        const atkBonus = Phaser.Math.Between(5, 15);
        d.atkBuff = (d.atkBuff || 0) + atkBonus;
        this.timeStopTurns = duration;
        audioManager.playSkill();
        this.createRadialBurstAt(this.testUnit.x, this.testUnit.y, 0x88ccff, 100, 18, 1800);
        this.addLog(`${d.name} 发动固有时域制！时间停止${duration}回合！攻击+${atkBonus}`);
        this.actionText.setText(`⏱ 时间停止! +${atkBonus}攻`);
        this.finishAction();
    }

    // ================================================================
    // 水月无影 - 月瞳·城临
    // ================================================================
    useMillenniumCastle(skill) {
        const d = this.testUnit.data;
        const duration = Phaser.Math.Between(2, 4);

        this.millenniumCastleActive = true;
        this.millenniumCastleTurns = duration;
        this.millenniumCastleBurnMin = skill.burnMin || 10;
        this.millenniumCastleBurnMax = skill.burnMax || 20;
        this.millenniumCastleNpMin = skill.npRegenMin || 5;
        this.millenniumCastleNpMax = skill.npRegenMax || 15;

        // 保存原始地图
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

        // 城堡背景
        if (this.millenniumCastleBg) this.millenniumCastleBg.destroy();
        if (this.textures.exists('millennium_castle_bg')) {
            this.millenniumCastleBg = this.add.image(centerX, centerY, 'millennium_castle_bg');
            this.millenniumCastleBg.setDisplaySize(mapPixelW, mapPixelH);
            this.millenniumCastleBg.setDepth(-0.5);
            this.millenniumCastleBg.setAlpha(0);
            this.tweens.add({ targets: this.millenniumCastleBg, alpha: 0.45, duration: 800, ease: 'Quad.easeIn' });
        } else {
            this.millenniumCastleBg = this.add.rectangle(centerX, centerY, mapPixelW, mapPixelH, 0x1a0a2e, 0.3);
            this.millenniumCastleBg.setDepth(-0.5);
        }

        // 逐个瓦片变色
        const castleColors = [0x2a1a3e, 0x1e1430, 0x332044, 0x261838, 0x2d1c3a, 0x1f1232];
        for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
            for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                const tile = this.map[y][x].tile;
                const newColor = castleColors[(x * 7 + y * 13) % castleColors.length];
                this.map[y][x].baseColor = newColor;
                const dist = Math.abs(d.x - x) + Math.abs(d.y - y);
                this.time.delayedCall(dist * 30, () => {
                    tile.setFillStyle(newColor, 0.6);
                    tile.setStrokeStyle(1.5, 0x6c3483, 0.4);
                });
            }
        }

        // 对假人造成一次侵蚀伤害
        if (this.dummyTarget && this.dummyTarget.data) {
            const burnDmg = Phaser.Math.Between(this.millenniumCastleBurnMin, this.millenniumCastleBurnMax);
            this.dealDamage(this.dummyTarget, burnDmg);
            this.showDamageNumber(this.dummyTarget, burnDmg);
            this.addLog(`千年城侵蚀 ${this.dummyTarget.data.name}: ${burnDmg} 伤害`);
        }

        // 自身恢复NP
        const npRegen = Phaser.Math.Between(this.millenniumCastleNpMin, this.millenniumCastleNpMax);
        d.np = Math.min(100, d.np + npRegen);
        this.updateUnitBars(this.testUnit);

        audioManager.playSkill();
        this.createRadialBurstAt(this.testUnit.x, this.testUnit.y, 0x6c3483, 120, 20, 1800);
        this.playScreenPulse(0x6c3483, 0.18, 300);

        this.addLog(`${d.name} 展开千年城！持续${duration}回合`);
        this.actionText.setText(`🏰 千年城展开! ${duration}回合`);
        this.updateStatus();

        // 自动消散
        this.time.delayedCall(3000, () => { if (this.millenniumCastleActive) this.endMillenniumCastle(); });
    }

    endMillenniumCastle() {
        this.millenniumCastleActive = false;
        this.millenniumCastleTurns = 0;
        if (this.millenniumCastleBg) {
            this.tweens.add({
                targets: this.millenniumCastleBg, alpha: 0, duration: 600,
                onComplete: () => { if (this.millenniumCastleBg) { this.millenniumCastleBg.destroy(); this.millenniumCastleBg = null; } }
            });
        }
        if (this.millenniumCastleOriginalTiles) {
            for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
                for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
                    const origColor = this.millenniumCastleOriginalTiles[y]?.[x];
                    if (origColor !== undefined && this.map[y]?.[x]) {
                        const tile = this.map[y][x].tile;
                        this.map[y][x].baseColor = origColor;
                        const dist = Math.abs(Math.floor(GAME_CONFIG.mapWidth / 2) - x) + Math.abs(Math.floor(GAME_CONFIG.mapHeight / 2) - y);
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
        const d = this.testUnit.data;
        if (d.isClone) {
            this.addLog('分身无法再次分身');
            return;
        }
        const hpRatio = Phaser.Math.Between(25, 50) / 100;
        const hpCost = Math.floor(d.hp * hpRatio);
        if (d.hp <= hpCost) {
            this.addLog('HP不足，月影发动失败');
            return;
        }
        d.hp -= hpCost;
        this.updateUnitBars(this.testUnit);
        this.showDamageNumber(this.testUnit, hpCost);

        const adjPos = this.findAdjacentEmpty(d.x, d.y);
        if (!adjPos) {
            d.hp += hpCost;
            this.updateUnitBars(this.testUnit);
            this.addLog('周围没有空间召唤分身');
            return;
        }

        const clone = this.createCloneUnit(adjPos.x, adjPos.y, d.team, d.charId, this.testUnit);
        audioManager.playSkill();
        this.createRadialBurstAt(adjPos.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            adjPos.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2, 0xb8a9d4, 60, 12, 1200);
        this.addLog(`${d.name} 消耗${hpCost}HP(${Math.round(hpRatio * 100)}%)，召唤月之分身！`);
        this.finishAction();
    }

    findAdjacentEmpty(x, y) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        const shuffled = Phaser.Utils.Array.Shuffle([...dirs]);
        for (const [dx, dy] of shuffled) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < GAME_CONFIG.mapWidth && ny >= 0 && ny < GAME_CONFIG.mapHeight &&
                !this.units.find(u => u.data && u.data.x === nx && u.data.y === ny) &&
                this.map[ny] && this.map[ny][nx] && this.map[ny][nx].walkable) {
                return { x: nx, y: ny };
            }
        }
        return null;
    }

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
            sprite = this.add.image(posX, posY, charId).setDisplaySize(displayW, displayH);
        } else {
            sprite = this.add.circle(posX, posY, GAME_CONFIG.tileSize / 3, classData.color);
        }
        sprite.setDepth(8);
        sprite.setAlpha(0.65);
        sprite.setTint(0xccbbff);

        const borderH = portraitH > 0 ? portraitH + 12 : GAME_CONFIG.tileSize - 6;
        const borderY = posY;
        const border = this.add.rectangle(posX, borderY, GAME_CONFIG.tileSize - 6, borderH);
        border.setStrokeStyle(2.5, 0xb8a9d4, 0.9);
        border.setFillStyle(0x2a1a4e, 0.25);
        border.setDepth(7);

        const cloneLabel = this.add.text(posX, posY + GAME_CONFIG.tileSize / 2 - 4, '分身', {
            fontSize: '9px', fill: '#b8a9d4', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(12);

        const hpBarBg = this.add.rectangle(posX, posY - 35, 42, 6, 0x101722, 0.9).setDepth(10);
        const hpBar = this.add.rectangle(posX, posY - 35, 40, 4, 0x9b59b6).setDepth(11);
        const npBarBg = this.add.rectangle(posX, posY - 26, 42, 5, 0x101722, 0.9).setDepth(10);
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
            buffs: [], atkBuff: 0, extraDice: 0,
            burstMode: 0, burstAtkBonus: 0, burstRangeBonus: 0,
            silenced: 0, doubleDamage: false, berserk: false,
            guts: false, extraAction: false, acted: false,
            isClone: true, cloneMaster: originalUnit,
            hpBar, hpBarBg, npBar, npBarBg, shieldBar, border, cloneLabel
        };

        this.units.push(sprite);
        return sprite;
    }

    // ================================================================
    // 水月无影 - 宝具：月淮泉·花影
    // ================================================================
    useMoonSpringFlowers(noble) {
        const d = this.testUnit.data;
        const cloneCount = Phaser.Math.Between(5, 7);
        const exitDamageMin = noble.exitDamageMin || 20;
        const exitDamageMax = noble.exitDamageMax || 40;
        const inCastle = this.millenniumCastleActive;

        audioManager.playNoble();
        this.addLog(`${d.name} 发动宝具: 月淮泉·花影！`);
        this.addLog(`召唤${cloneCount}个月之分身！`);

        let spawned = 0;
        for (let i = 0; i < cloneCount; i++) {
            const pos = this.findAdjacentEmpty(d.x, d.y);
            if (pos) {
                const clone = this.createCloneUnit(pos.x, pos.y, d.team, d.charId, this.testUnit);
                clone.data.isNobleClone = true;
                clone.data.nobleCloneTurns = 1;
                clone.data.nobleCloneExitMin = exitDamageMin;
                clone.data.nobleCloneExitMax = exitDamageMax;
                clone.data.nobleCloneInCastle = inCastle;
                clone.data.name = CHARACTERS[d.charId].name + '(花影)';
                clone.data.np = 0;
                spawned++;
                this.createRadialBurstAt(
                    pos.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    pos.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
                    0xb8a9d4, 48, 8, 800 + i * 80
                );
            }
        }

        if (inCastle) this.addLog('千年城中！分身退场时将造成伤害');

        // 1.5秒后花影退场
        this.time.delayedCall(1500, () => {
            const clones = this.units.filter(u => u.data && u.data.isNobleClone);
            clones.forEach(clone => {
                if (clone.data.nobleCloneInCastle && this.dummyTarget && this.dummyTarget.data) {
                    const exitDmg = Phaser.Math.Between(clone.data.nobleCloneExitMin, clone.data.nobleCloneExitMax);
                    this.dealDamage(this.dummyTarget, exitDmg);
                    this.showDamageNumber(this.dummyTarget, exitDmg);
                    this.addLog(`花影退场: ${exitDmg} 伤害`);
                }
                // 销毁分身
                if (clone.data.cloneLabel) clone.data.cloneLabel.destroy();
                [clone, clone.data.border, clone.data.hpBar, clone.data.hpBarBg, clone.data.npBar, clone.data.npBarBg, clone.data.shieldBar].forEach(el => {
                    if (el) { this.tweens.add({ targets: el, alpha: 0, scaleX: 0.5, scaleY: 0.5, duration: 300, onComplete: () => el.destroy() }); }
                });
                this.units = this.units.filter(u => u !== clone);
            });
        });

        this.addLog(`成功召唤${spawned}个花影分身`);
        this.actionText.setText(`🌸 花影! ${spawned}分身`);
        this.updateStatus();
    }
}
