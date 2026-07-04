class CharacterSelectScene extends Phaser.Scene {
    constructor() { super({ key: 'CharacterSelectScene' }); }

    init(data) {
        this.testMode = !!(data && data.testMode);
        this.onlineMode = !!(data && data.mode === 'online');
        this.player1Char = null;
        this.player2Char = null;
        this.currentPlayer = 1;
        this.mySelection = null;
        this.opponentSelection = null;
        this.charCards = [];
    }

    shutdown() { this.charCards = []; }

    preload() {
        for (const id in CHARACTERS) {
            const c = CHARACTERS[id];
            if (c.avatar && !this.textures.exists(id)) this.load.image(id, c.avatar);
        }
    }

    create() {
        this.input.removeAllListeners();
        this.input.enabled = true;
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        addBg(this, W, H);
        addParticles(this, W, H);
        this.createHeader(W);
        this.createCards(W, H);
        this.createBottom(W, H);
        this.refreshCards();
        this.updateStartState();

        if (this.onlineMode) this.setupOnline();
    }

    createHeader(W) {
        const top = createPanel(this, 12, 12, W - 24, 44, {
            fill: C.panel,
            alpha: 0.78,
            strokeAlpha: 0.18,
            accentAlpha: 0.06,
            radius: 8
        });
        top.setDepth(3);

        this.add.text(28, 26, '← 返回', {
            fontSize: '12px',
            fill: colorHex(C.fg2),
            fontFamily: UI_FONT,
            fontStyle: 'bold'
        }).setOrigin(0, 0.5)
            .setDepth(4)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (this.onlineMode) networkManager.disconnect();
                this.scene.start('LobbyScene');
            })
            .on('pointerover', function() { this.setStyle({ fill: colorHex(C.gold2) }); })
            .on('pointerout', function() { this.setStyle({ fill: colorHex(C.fg2) }); });

        let title = '选择角色';
        let subtitle = 'PLAYER 1 SELECT';
        if (this.testMode) {
            title = '技能测试';
            subtitle = 'TRAINING LAB';
        } else if (this.onlineMode) {
            title = '在线对战';
            subtitle = 'ONLINE DUEL';
        }

        this.add.text(W / 2, 22, title, {
            fontSize: '18px',
            fill: colorHex(C.gold2),
            fontFamily: UI_FONT,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4);

        this.add.text(W / 2, 40, subtitle, {
            fontSize: '9px',
            fill: colorHex(C.fg3),
            fontFamily: TITLE_FONT,
            letterSpacing: 4
        }).setOrigin(0.5).setDepth(4);
    }

    createCards(W, H) {
        const chars = Object.keys(CHARACTERS);
        const cw = 162;
        const ch = 284;
        const gap = 14;
        const total = chars.length * cw + (chars.length - 1) * gap;
        const cy = 226;

        // 可视区域宽度（留边距）
        const viewMargin = 40;
        const viewW = W - viewMargin * 2;

        // 卡片总宽超出可视区 → 需要滚动，从左边距开始；否则居中
        const scrollable = total > viewW;
        const sx = scrollable ? viewMargin : (W - total) / 2;

        // 用容器包裹所有卡片，滚动容器即可
        const container = this.add.container(0, 0);
        this.cardsContainer = container;

        this.charCards = [];
        chars.forEach((charId, i) => {
            const charData = CHARACTERS[charId];
            const classData = CLASS_CONFIG[charData.class];
            const cx = sx + i * (cw + gap) + cw / 2;
            const top = cy - ch / 2;
            const left = cx - cw / 2;

            const bgGfx = this.add.graphics();
            const border = this.add.graphics();
            const accent = this.add.rectangle(cx, top + 4, cw - 14, 3, classData.color, 0.82);
            const portraitFrame = this.add.rectangle(cx, top + 92, 108, 132, 0x000000, 0.18)
                .setStrokeStyle(1, C.gold, 0.18);

            let portrait;
            if (this.textures.exists(charId)) {
                portrait = this.add.image(cx, top + 92, charId).setDisplaySize(100, 126);
            } else {
                portrait = this.add.circle(cx, top + 92, 48, classData.color, 0.55);
            }

            const classBadge = this.add.text(left + 14, top + 22, classData.name, {
                fontSize: '10px',
                fill: colorHex(classData.color),
                fontFamily: UI_FONT,
                fontStyle: 'bold'
            });
            const nameText = this.add.text(cx, top + 176, charData.name, {
                fontSize: '14px',
                fill: colorHex(C.fg),
                fontFamily: UI_FONT,
                fontStyle: 'bold',
                wordWrap: { width: cw - 22 }
            }).setOrigin(0.5, 0);
            const nobleText = this.add.text(cx, top + 206, charData.noble.name, {
                fontSize: '9px',
                fill: colorHex(C.gold2),
                fontFamily: UI_FONT,
                wordWrap: { width: cw - 22 }
            }).setOrigin(0.5, 0);
            const statText = this.add.text(cx, top + 238,
                `移动 ${classData.moveRange}   射程 ${classData.attackRange}\n命运 ${classData.diceCount}-${classData.diceCount * 6}`, {
                    fontSize: '10px',
                    fill: colorHex(C.fg2),
                    fontFamily: UI_FONT,
                    align: 'center',
                    lineSpacing: 3
                }).setOrigin(0.5, 0);
            const tag = this.add.text(cx, top + 268, '', {
                fontSize: '10px',
                fill: colorHex(C.gold2),
                fontFamily: UI_FONT,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const hit = this.add.rectangle(cx, cy, cw, ch, 0xffffff, 0).setInteractive({ useHandCursor: true });
            const card = {
                charId, cx, cy, cw, ch,
                color: classData.color,
                bgGfx, border, accent, portraitFrame, portrait,
                classBadge, nameText, nobleText, statText, tag, hit
            };

            hit.on('pointerover', () => this.paintCard(card, this.cardState(card.charId), true));
            hit.on('pointerout', () => this.paintCard(card, this.cardState(card.charId), false));
            // 用 pointerup 选择，拖动时不触发
            hit.on('pointerup', () => {
                if (this._cardDragged) return;
                this.selectChar(card.charId);
            });

            // 全部子元素加入容器
            container.add([bgGfx, border, accent, portraitFrame, portrait,
                classBadge, nameText, nobleText, statText, tag, hit]);

            this.charCards.push(card);
        });

        // 滚动范围：容器最多向左移动 (total - viewW)，让最右卡片露出
        this._scrollMinX = scrollable ? -(total - viewW) : 0;
        this._scrollMaxX = 0;
        this._scrollX = 0;

        if (scrollable) this.setupCardScroll(W, H, viewMargin, viewW);
    }

    setupCardScroll(W, H, viewMargin, viewW) {
        const container = this.cardsContainer;

        // 滚动提示箭头
        this.leftArrow = this.add.text(viewMargin - 22, 226, '‹', {
            fontSize: '40px', fill: colorHex(C.gold2), fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.5).setDepth(20);
        this.rightArrow = this.add.text(W - viewMargin + 22, 226, '›', {
            fontSize: '40px', fill: colorHex(C.gold2), fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.85).setDepth(20);

        const clampScroll = () => {
            this._scrollX = Phaser.Math.Clamp(this._scrollX, this._scrollMinX, this._scrollMaxX);
            container.x = this._scrollX;
            if (this.leftArrow) this.leftArrow.setAlpha(this._scrollX < this._scrollMaxX - 1 ? 0.85 : 0.2);
            if (this.rightArrow) this.rightArrow.setAlpha(this._scrollX > this._scrollMinX + 1 ? 0.85 : 0.2);
        };
        this._clampCardScroll = clampScroll;

        // 拖动滚动
        this._cardDragged = false;
        let dragStartX = 0;
        let dragStartScroll = 0;
        let pointerDown = false;

        this.input.on('pointerdown', (pointer) => {
            pointerDown = true;
            this._cardDragged = false;
            dragStartX = pointer.x;
            dragStartScroll = this._scrollX;
        });
        this.input.on('pointermove', (pointer) => {
            if (!pointerDown) return;
            const dx = pointer.x - dragStartX;
            if (Math.abs(dx) > 8) this._cardDragged = true;
            this._scrollX = dragStartScroll + dx;
            clampScroll();
        });
        this.input.on('pointerup', () => { pointerDown = false; });

        // 滚轮滚动
        this.input.on('wheel', (pointer, over, dx, dy) => {
            this._scrollX -= (dy !== 0 ? dy : dx) * 0.6;
            clampScroll();
        });

        clampScroll();
    }

    cardState(charId) {
        if (this.testMode) return this.player1Char === charId ? 'PICK' : 'IDLE';
        if (this.onlineMode) {
            if (this.mySelection === charId) return 'SELF';
            if (this.opponentSelection === charId) return 'RIVAL';
            return 'IDLE';
        }
        if (this.player1Char === charId) return 'P1';
        if (this.player2Char === charId) return 'P2';
        return 'IDLE';
    }

    paintCard(card, state, hover) {
        const hw = card.cw / 2;
        const hh = card.ch / 2;
        const x = card.cx - hw;
        const y = card.cy - hh;
        const selected = state !== 'IDLE';
        const stroke = state === 'P2' || state === 'RIVAL' ? C.red : (selected ? C.blue : C.gold);
        const fill = hover || selected ? C.panel2 : C.panel;

        card.bgGfx.clear();
        card.bgGfx.fillStyle(fill, selected ? 0.96 : 0.84);
        card.bgGfx.fillRoundedRect(x, y, card.cw, card.ch, 8);
        card.bgGfx.fillStyle(card.color, hover || selected ? 0.16 : 0.07);
        card.bgGfx.fillRoundedRect(x + 1, y + 1, card.cw - 2, 34, 8);
        card.bgGfx.fillStyle(0x000000, 0.22);
        card.bgGfx.fillRect(x + 12, y + 52, card.cw - 24, 104);

        card.border.clear();
        card.border.lineStyle(selected ? 2 : 1, selected ? stroke : C.gold, selected ? 0.74 : (hover ? 0.38 : 0.16));
        card.border.strokeRoundedRect(x, y, card.cw, card.ch, 8);

        card.accent.setFillStyle(card.color, hover || selected ? 1 : 0.72);
        card.portraitFrame.setStrokeStyle(1, selected ? stroke : C.gold, selected ? 0.46 : 0.18);
        card.portrait.setAlpha(hover || selected ? 1 : 0.9);
        card.nameText.setStyle({ fill: colorHex(hover || selected ? C.gold2 : C.fg) });

        const tagText = {
            P1: 'PLAYER 1',
            P2: 'PLAYER 2',
            PICK: 'SELECTED',
            SELF: 'YOUR PICK',
            RIVAL: 'RIVAL PICK',
            IDLE: ''
        }[state];
        card.tag.setText(tagText);
        card.tag.setStyle({ fill: colorHex(state === 'P2' || state === 'RIVAL' ? C.red : C.blue) });
    }

    refreshCards() {
        this.charCards.forEach(card => this.paintCard(card, this.cardState(card.charId), false));
    }

    createBottom(W, H) {
        const y = H - 96;
        const strip = createPanel(this, 74, y, W - 148, 76, {
            fill: C.panel,
            alpha: 0.82,
            strokeAlpha: 0.18,
            radius: 8
        });
        strip.setDepth(2);

        if (this.testMode) {
            this.p1Text = this.add.text(W / 2, y + 24, '选择一名角色进入技能测试', {
                fontSize: '13px',
                fill: colorHex(C.fg2),
                fontFamily: UI_FONT
            }).setOrigin(0.5);
        } else {
            this.add.text(W / 2, y + 22, 'VS', {
                fontSize: '24px',
                fill: colorHex(C.gold2),
                fontFamily: TITLE_FONT,
                fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(0.9);
            this.p1Text = this.add.text(W / 2 - 190, y + 24, '玩家1：待选择', {
                fontSize: '13px',
                fill: colorHex(C.fg2),
                fontFamily: UI_FONT,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.p2Text = this.add.text(W / 2 + 190, y + 24, '玩家2：待选择', {
                fontSize: '13px',
                fill: colorHex(C.fg2),
                fontFamily: UI_FONT,
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        const buttonText = this.onlineMode ? '等待双方确认' : '开始战斗';
        this.startBtn = createBtn(this, W / 2, H - 30, 250, 40, buttonText, C.gold,
            () => this.startGame(),
            { fontSize: 14, icon: '>' }
        );
        this.startBtn.setDepth(5);
    }

    updateStartState() {
        if (!this.startBtn) return;
        this.startBtn.setEnabled(this.canStart());
        if (this.testMode && this.p1Text) {
            this.p1Text.setText(this.player1Char ? `测试角色：${CHARACTERS[this.player1Char].name}` : '选择一名角色进入技能测试');
            this.p1Text.setStyle({ fill: colorHex(this.player1Char ? C.gold2 : C.fg2) });
        }
    }

    canStart() {
        if (this.testMode) return !!this.player1Char;
        if (this.onlineMode) return false;
        return !!this.player1Char && !!this.player2Char;
    }

    startGame() {
        if (!this.canStart()) return;
        if (this.onlineMode) {
            networkManager.onOpponentSelected = null;
            networkManager.onGameStart = null;
        }
        if (this.testMode) this.scene.start('TestScene', { character: this.player1Char });
        else this.scene.start('GameScene', { mode: 'local', player1: this.player1Char, player2: this.player2Char });
    }

    selectChar(charId) {
        if (this.testMode) {
            this.player1Char = charId;
            this.refreshCards();
            this.updateStartState();
            return;
        }

        if (this.onlineMode) {
            if (this.mySelection) return;
            this.mySelection = charId;
            if (networkManager.myTeam === 'player') {
                this.p1Text.setText('你：' + CHARACTERS[charId].name);
                this.p1Text.setStyle({ fill: colorHex(C.blue) });
            } else {
                this.p2Text.setText('你：' + CHARACTERS[charId].name);
                this.p2Text.setStyle({ fill: colorHex(C.red) });
            }
            this.refreshCards();
            networkManager.selectCharacter(charId);
            return;
        }

        if (this.currentPlayer === 1) {
            this.player1Char = charId;
            if (this.player2Char === charId) this.player2Char = null;
            this.p1Text.setText('玩家1：' + CHARACTERS[charId].name);
            this.p1Text.setStyle({ fill: colorHex(C.blue) });
            if (!this.player2Char) {
                this.p2Text.setText('玩家2：待选择');
                this.p2Text.setStyle({ fill: colorHex(C.fg2) });
            }
            this.currentPlayer = 2;
        } else {
            if (charId === this.player1Char) return;
            this.player2Char = charId;
            this.p2Text.setText('玩家2：' + CHARACTERS[charId].name);
            this.p2Text.setStyle({ fill: colorHex(C.red) });
        }

        this.refreshCards();
        this.updateStartState();
    }

    setupOnline() {
        networkManager.onOpponentSelected = (data) => {
            this.opponentSelection = data.character;
            if (networkManager.myTeam === 'player') {
                this.p2Text.setText('对手：' + CHARACTERS[data.character].name);
                this.p2Text.setStyle({ fill: colorHex(C.red) });
            } else {
                this.p1Text.setText('对手：' + CHARACTERS[data.character].name);
                this.p1Text.setStyle({ fill: colorHex(C.blue) });
            }
            this.refreshCards();
        };
        networkManager.onGameStart = (data) => {
            this.scene.start('GameScene', {
                mode: 'online',
                players: data.players,
                currentTurn: data.currentTurn,
                initialState: data.initialState
            });
        };
    }
}
