class LobbyScene extends Phaser.Scene {
    constructor() { super({ key: 'LobbyScene' }); }

    init() {
        this.statusText = null;
        this.roomCodeText = null;
        this.waitingText = null;
    }

    preload() {
        if (!this.textures.exists('saber_lobby')) this.load.image('saber_lobby', 'assets/characters/saber_artoria-removebg-preview.png');
        if (!this.textures.exists('archer_lobby')) this.load.image('archer_lobby', 'assets/characters/archer_emiya-removebg-preview.png');
        if (!this.textures.exists('ubw_lobby')) this.load.image('ubw_lobby', 'assets/ubw/20170323124330_ikxMc.png');
    }

    create() {
        this.input.removeAllListeners();
        this.input.enabled = true;
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const CX = W / 2;

        addBg(this, W, H);
        this.createBackdrop(W, H);
        addParticles(this, W, H);
        this.createHeroes(W, H);
        this.createCommandDeck(CX, H);
        this.setupNetworkCallbacks();
    }

    createBackdrop(W, H) {
        if (this.textures.exists('ubw_lobby')) {
            const bg = this.add.image(W / 2, H / 2, 'ubw_lobby');
            bg.setDisplaySize(W, H).setAlpha(0.22).setDepth(-20);
        }

        const g = this.add.graphics().setDepth(-2);
        g.fillStyle(0x000000, 0.38);
        g.fillRect(0, 0, W, H);

        g.lineStyle(1, C.gold, 0.15);
        g.strokeCircle(W / 2, 112, 176);
        g.strokeCircle(W / 2, 112, 238);
        g.fillStyle(C.gold, 0.12);
        g.fillRect(W / 2 - 168, 153, 336, 1);
        g.fillRect(W / 2 - 52, 164, 104, 1);

        g.lineStyle(2, C.blue, 0.09);
        g.beginPath();
        g.moveTo(66, H - 92);
        g.lineTo(W - 68, H - 120);
        g.strokePath();
        g.lineStyle(2, C.red, 0.08);
        g.beginPath();
        g.moveTo(92, H - 58);
        g.lineTo(W - 96, H - 72);
        g.strokePath();
    }

    createHeroes(W, H) {
        const floorY = H - 74;
        const shadow = this.add.graphics().setDepth(1);
        shadow.fillStyle(0x000000, 0.42);
        shadow.fillEllipse(174, floorY, 230, 30);
        shadow.fillEllipse(W - 170, floorY, 230, 30);

        const saber = this.add.image(172, floorY - 166, 'saber_lobby')
            .setDisplaySize(248, 326)
            .setAlpha(0.94)
            .setDepth(2);
        const archer = this.add.image(W - 170, floorY - 165, 'archer_lobby')
            .setDisplaySize(246, 318)
            .setAlpha(0.92)
            .setFlipX(true)
            .setDepth(2);

        this.tweens.add({ targets: saber, y: saber.y - 6, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: archer, y: archer.y - 7, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 420 });

        this.add.text(72, H - 54, 'SABER', {
            fontSize: '13px',
            fill: colorHex(C.blue),
            fontFamily: TITLE_FONT,
            letterSpacing: 5
        }).setAlpha(0.48);

        this.add.text(W - 72, H - 54, 'ARCHER', {
            fontSize: '13px',
            fill: colorHex(C.red),
            fontFamily: TITLE_FONT,
            letterSpacing: 5
        }).setOrigin(1, 0).setAlpha(0.48);
    }

    createCommandDeck(CX, H) {
        const deckX = CX - 212;
        const deckY = 58;
        const deckW = 424;
        const deckH = 392;

        const panel = createPanel(this, deckX, deckY, deckW, deckH, {
            fill: C.panel,
            alpha: 0.76,
            strokeAlpha: 0.22,
            accentAlpha: 0.08,
            radius: 8
        });
        panel.setDepth(3);

        addTitleRings(this, CX, 122);

        this.add.text(CX, 94, 'FATE', {
            fontSize: '56px',
            fill: colorHex(C.gold2),
            fontStyle: 'bold',
            fontFamily: TITLE_FONT,
            stroke: '#120b04',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(4);

        this.add.text(CX, 130, 'BATTLE', {
            fontSize: '20px',
            fill: colorHex(C.red),
            fontFamily: TITLE_FONT,
            letterSpacing: 13
        }).setOrigin(0.5).setDepth(4);

        this.add.text(CX, 154, '命 运 对 决', {
            fontSize: '12px',
            fill: colorHex(C.fg2),
            fontFamily: UI_FONT,
            letterSpacing: 12
        }).setOrigin(0.5).setAlpha(0.72).setDepth(4);

        const g = this.add.graphics().setDepth(4);
        g.fillStyle(C.gold, 0.46);
        g.fillRect(CX - 132, 173, 96, 1);
        g.fillRect(CX + 36, 173, 96, 1);
        g.fillStyle(C.gold2, 0.9);
        g.fillRect(CX - 3, 170, 6, 6);

        createBtn(this, CX, 220, 332, 48, '本地双人对战', C.blue,
            () => this.scene.start('CharacterSelectScene', { mode: 'local' }),
            { fontSize: 15, icon: 'VS' }
        ).setDepth(5);

        createBtn(this, CX, 282, 332, 48, '技能测试模式', C.purple,
            () => this.scene.start('CharacterSelectScene', { testMode: true }),
            { fontSize: 15, icon: 'T' }
        ).setDepth(5);

        createSmallBtn(this, CX - 87, 340, 162, 40, '创建房间', C.green,
            () => this.showCreateRoom(),
            { icon: '+', fontSize: 13 }
        ).setDepth(5);

        createSmallBtn(this, CX + 87, 340, 162, 40, '加入房间', C.orange,
            () => this.showJoinRoom(),
            { icon: '#', fontSize: 13 }
        ).setDepth(5);

        this.add.text(CX, 392, 'LOCAL  /  TRAINING  /  ONLINE ROOM', {
            fontSize: '10px',
            fill: colorHex(C.fg3),
            fontFamily: TITLE_FONT,
            letterSpacing: 4
        }).setOrigin(0.5).setAlpha(0.8).setDepth(5);

        this.statusText = this.add.text(CX, 418, '', {
            fontSize: '12px',
            fill: colorHex(C.gold2),
            fontFamily: UI_FONT
        }).setOrigin(0.5).setDepth(5);
        this.roomCodeText = this.add.text(CX, 442, '', {
            fontSize: '22px',
            fill: colorHex(C.green),
            fontFamily: '"Courier New", monospace',
            letterSpacing: 5
        }).setOrigin(0.5).setDepth(5);
        this.waitingText = this.add.text(CX, 462, '', {
            fontSize: '10px',
            fill: colorHex(C.fg2),
            fontFamily: UI_FONT
        }).setOrigin(0.5).setDepth(5);
    }

    async showCreateRoom() {
        this.statusText.setText('正在连接服务器...');
        try {
            await networkManager.connect(SERVER_URL);
            networkManager.createRoom('玩家1');
        } catch (e) {
            this.statusText.setText('连接失败，请稍后重试');
        }
    }

    async showJoinRoom() {
        const code = prompt('房间码:');
        if (!code || code.length !== 6) return;
        this.statusText.setText('正在连接服务器...');
        try {
            await networkManager.connect(SERVER_URL);
            networkManager.joinRoom(code, '玩家2');
        } catch (e) {
            this.statusText.setText('连接失败，请稍后重试');
        }
    }

    setupNetworkCallbacks() {
        const s = this;
        networkManager.onRoomCreated = (code) => {
            if (!s.scene.isActive('LobbyScene')) return;
            s.statusText.setText('房间创建成功');
            s.roomCodeText.setText(code);
            s.waitingText.setText('等待对手加入...');
        };
        networkManager.onJoinError = (m) => {
            if (s.scene.isActive('LobbyScene')) s.statusText.setText(m);
        };
        networkManager.onStartCharacterSelect = () => {
            if (!s.scene.isActive('LobbyScene')) return;
            s.statusText.setText('对手已加入');
            s.time.delayedCall(800, () => s.scene.start('CharacterSelectScene', { mode: 'online' }));
        };
    }
}
