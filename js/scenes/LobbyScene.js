class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        const isMobile = height < 500;

        // 背景渐变效果
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, width, height);

        // 装饰性粒子/星星效果
        for (let i = 0; i < 30; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0xffffff,
                Phaser.Math.FloatBetween(0.1, 0.4)
            );
            // 闪烁动画
            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: star.alpha * 0.3 },
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1
            });
        }

        // 装饰线条
        const lineY = isMobile ? 50 : 70;
        this.add.rectangle(centerX, lineY, width * 0.6, 2, 0xf1c40f, 0.3);

        // 主标题 - 带发光效果
        const titleY = isMobile ? 80 : 100;
        
        // 标题阴影
        this.add.text(centerX + 2, titleY + 2, 'Fate Battle', { 
            fontSize: isMobile ? '36px' : '56px', 
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.3);
        
        // 主标题
        const title = this.add.text(centerX, titleY, 'Fate Battle', { 
            fontSize: isMobile ? '36px' : '56px', 
            fill: '#f1c40f',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 标题发光动画
        this.tweens.add({
            targets: title,
            alpha: { from: 1, to: 0.8 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // 副标题
        this.add.text(centerX, titleY + (isMobile ? 35 : 50), '— 命运对决 —', { 
            fontSize: isMobile ? '18px' : '26px', 
            fill: '#ecf0f1'
        }).setOrigin(0.5);

        // 装饰线条
        this.add.rectangle(centerX, titleY + (isMobile ? 60 : 85), width * 0.6, 2, 0xf1c40f, 0.3);

        // 模式选择提示
        const menuStartY = titleY + (isMobile ? 90 : 130);
        this.add.text(centerX, menuStartY, '选择游戏模式', { 
            fontSize: isMobile ? '14px' : '18px', 
            fill: '#7f8c8d'
        }).setOrigin(0.5);

        // 按钮区域
        const btnGap = isMobile ? 45 : 55;
        const btnStartY = menuStartY + (isMobile ? 35 : 45);
        const fontSize = isMobile ? '18px' : '24px';

        // 本地对战按钮
        this.createFancyButton(centerX, btnStartY, '⚔️ 本地双人对战', fontSize, 0x3498db, () => {
            this.scene.start('CharacterSelectScene', { mode: 'local' });
        });

        // 测试模式按钮
        this.createFancyButton(centerX, btnStartY + btnGap, '🎯 测试模式', fontSize, 0x9b59b6, () => {
            this.scene.start('CharacterSelectScene', { testMode: true });
        });

        // 创建房间按钮
        this.createFancyButton(centerX, btnStartY + btnGap * 2, '🌐 创建在线房间', fontSize, 0x2ecc71, () => {
            this.showCreateRoom();
        });

        // 加入房间按钮
        this.createFancyButton(centerX, btnStartY + btnGap * 3, '🔗 加入在线房间', fontSize, 0xe67e22, () => {
            this.showJoinRoom();
        });

        // 状态文本区域
        const statusY = btnStartY + btnGap * 4 + 10;
        
        this.statusText = this.add.text(centerX, statusY, '', { 
            fontSize: isMobile ? '14px' : '16px', 
            fill: '#e74c3c'
        }).setOrigin(0.5);

        // 房间码显示 - 带边框
        this.roomCodeText = this.add.text(centerX, statusY + 35, '', { 
            fontSize: isMobile ? '28px' : '36px', 
            fill: '#2ecc71',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 等待文本
        this.waitingText = this.add.text(centerX, statusY + 70, '', { 
            fontSize: isMobile ? '12px' : '14px', 
            fill: '#bdc3c7'
        }).setOrigin(0.5);

        // 底部版本信息
        this.add.text(centerX, height - 20, 'v1.0 | Phaser 3', { 
            fontSize: '12px', 
            fill: '#555'
        }).setOrigin(0.5);

        // 设置网络回调
        this.setupNetworkCallbacks();
    }

    createFancyButton(x, y, text, fontSize, color, callback) {
        const isMobile = this.cameras.main.height < 500;
        const btnWidth = isMobile ? 200 : 280;
        const btnHeight = isMobile ? 36 : 44;
        
        // 按钮背景
        const bg = this.add.rectangle(x, y, btnWidth, btnHeight, color, 0.15);
        bg.setStrokeStyle(2, color, 0.5);
        
        // 按钮文字
        const btn = this.add.text(x, y, text, { 
            fontSize: fontSize,
            fill: '#' + color.toString(16).padStart(6, '0')
        }).setOrigin(0.5);
        
        // 交互区域
        bg.setInteractive({ useHandCursor: true });
        
        bg.on('pointerover', () => {
            bg.setFillStyle(color, 0.3);
            bg.setStrokeStyle(2, color, 1);
            btn.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(color, 0.15);
            bg.setStrokeStyle(2, color, 0.5);
            btn.setScale(1);
        });
        
        bg.on('pointerdown', () => {
            bg.setFillStyle(color, 0.5);
            this.time.delayedCall(100, callback);
        });
        
        return { bg, btn };
    }

    async showCreateRoom() {
        this.statusText.setText('正在连接服务器...');
        this.statusText.setStyle({ fill: '#f39c12' });
        
        try {
            await networkManager.connect(SERVER_URL);
            networkManager.createRoom('玩家1');
        } catch (err) {
            this.statusText.setText('连接失败，请检查网络');
            this.statusText.setStyle({ fill: '#e74c3c' });
        }
    }

    async showJoinRoom() {
        const roomCode = prompt('请输入6位房间码:');
        if (!roomCode || roomCode.length !== 6) {
            this.statusText.setText('请输入有效的6位房间码');
            this.statusText.setStyle({ fill: '#e74c3c' });
            return;
        }

        this.statusText.setText('正在连接服务器...');
        this.statusText.setStyle({ fill: '#f39c12' });
        
        try {
            await networkManager.connect(SERVER_URL);
            networkManager.joinRoom(roomCode, '玩家2');
        } catch (err) {
            this.statusText.setText('连接失败，请检查网络');
            this.statusText.setStyle({ fill: '#e74c3c' });
        }
    }

    setupNetworkCallbacks() {
        const scene = this;
        
        networkManager.onRoomCreated = (roomCode) => {
            if (scene.scene.isActive('LobbyScene')) {
                scene.statusText.setText('房间创建成功！分享房间码给好友:');
                scene.statusText.setStyle({ fill: '#2ecc71' });
                scene.roomCodeText.setText(roomCode);
                scene.waitingText.setText('⏳ 等待对手加入...');
                
                // 房间码闪烁效果
                scene.tweens.add({
                    targets: scene.roomCodeText,
                    alpha: { from: 1, to: 0.6 },
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        };

        networkManager.onJoinError = (msg) => {
            if (scene.scene.isActive('LobbyScene')) {
                scene.statusText.setText(msg);
                scene.statusText.setStyle({ fill: '#e74c3c' });
            }
        };

        networkManager.onStartCharacterSelect = (data) => {
            if (scene.scene.isActive('LobbyScene')) {
                scene.statusText.setText('✓ 对手已加入，进入角色选择...');
                scene.statusText.setStyle({ fill: '#2ecc71' });
                scene.waitingText.setText('');
                scene.time.delayedCall(500, () => {
                    scene.scene.start('CharacterSelectScene', { mode: 'online' });
                });
            }
        };
    }
}
