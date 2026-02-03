class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    create() {
        const centerX = this.cameras.main.width / 2;

        // 标题
        this.add.text(centerX, 80, 'Fate Battle', { 
            fontSize: '48px', 
            fill: '#f1c40f',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 130, '命运对决', { 
            fontSize: '24px', 
            fill: '#fff'
        }).setOrigin(0.5);

        // 模式选择
        this.add.text(centerX, 200, '选择游戏模式', { 
            fontSize: '20px', 
            fill: '#aaa'
        }).setOrigin(0.5);

        // 本地对战按钮
        this.createButton(centerX, 270, '本地双人对战', () => {
            this.scene.start('CharacterSelectScene', { mode: 'local' });
        });

        // 测试模式按钮
        this.createButton(centerX, 340, '测试模式', () => {
            this.scene.start('CharacterSelectScene', { testMode: true });
        });

        // 创建房间按钮
        this.createButton(centerX, 410, '创建在线房间', () => {
            this.showCreateRoom();
        });

        // 加入房间按钮
        this.createButton(centerX, 480, '加入在线房间', () => {
            this.showJoinRoom();
        });

        // 状态文本
        this.statusText = this.add.text(centerX, 550, '', { 
            fontSize: '16px', 
            fill: '#e74c3c'
        }).setOrigin(0.5);

        // 房间码显示
        this.roomCodeText = this.add.text(centerX, 590, '', { 
            fontSize: '32px', 
            fill: '#2ecc71',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 等待文本
        this.waitingText = this.add.text(centerX, 630, '', { 
            fontSize: '16px', 
            fill: '#fff'
        }).setOrigin(0.5);

        // 设置网络回调
        this.setupNetworkCallbacks();
    }

    createButton(x, y, text, callback) {
        const btn = this.add.text(x, y, `[ ${text} ]`, { 
            fontSize: '22px', 
            fill: '#3498db'
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', callback)
        .on('pointerover', () => btn.setStyle({ fill: '#5dade2' }))
        .on('pointerout', () => btn.setStyle({ fill: '#3498db' }));
        
        return btn;
    }

    async showCreateRoom() {
        this.statusText.setText('正在连接服务器...');
        
        try {
            await networkManager.connect(SERVER_URL);
            networkManager.createRoom('玩家1');
        } catch (err) {
            this.statusText.setText('连接失败，请检查网络');
        }
    }

    async showJoinRoom() {
        const roomCode = prompt('请输入6位房间码:');
        if (!roomCode || roomCode.length !== 6) {
            this.statusText.setText('请输入有效的6位房间码');
            return;
        }

        this.statusText.setText('正在连接服务器...');
        
        try {
            await networkManager.connect(SERVER_URL);
            networkManager.joinRoom(roomCode, '玩家2');
        } catch (err) {
            this.statusText.setText('连接失败，请检查网络');
        }
    }

    setupNetworkCallbacks() {
        networkManager.onRoomCreated = (roomCode) => {
            this.statusText.setText('房间创建成功！分享房间码给好友:');
            this.roomCodeText.setText(roomCode);
            this.waitingText.setText('等待对手加入...');
        };

        networkManager.onJoinError = (msg) => {
            this.statusText.setText(msg);
        };

        // 对手加入后，进入角色选择界面
        networkManager.onStartCharacterSelect = (data) => {
            this.statusText.setText('对手已加入，进入角色选择...');
            this.time.delayedCall(500, () => {
                this.scene.start('CharacterSelectScene', { mode: 'online' });
            });
        };
    }
}
