class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
        this.player1Char = null;
        this.player2Char = null;
        this.currentPlayer = 1;
        this.testMode = false;
        this.onlineMode = false;
        this.mySelection = null;
        this.opponentSelection = null;
    }

    init(data) {
        this.testMode = data && data.testMode;
        this.onlineMode = data && data.mode === 'online';
        this.player1Char = null;
        this.player2Char = null;
        this.currentPlayer = 1;
        this.mySelection = null;
        this.opponentSelection = null;
    }

    preload() {
        for (const charId in CHARACTERS) {
            const char = CHARACTERS[charId];
            if (char.avatar) {
                this.load.image(charId, char.avatar);
            }
        }
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        
        this.add.rectangle(centerX, 300, 1100, 600, 0x1a1a2e);
        
        // 标题
        let title = '选择角色';
        if (this.testMode) title = '测试模式 - 选择角色';
        else if (this.onlineMode) title = '在线对战 - 选择你的角色';
        
        this.add.text(centerX, 30, title, { 
            fontSize: '32px', fill: '#f1c40f', fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        // 玩家选择提示
        if (this.onlineMode) {
            const teamText = networkManager.myTeam === 'player' ? '你是玩家1（红方）' : '你是玩家2（蓝方）';
            this.playerText = this.add.text(centerX, 70, teamText, { 
                fontSize: '24px', fill: networkManager.myTeam === 'player' ? '#3498db' : '#e74c3c'
            }).setOrigin(0.5);
        } else {
            this.playerText = this.add.text(centerX, 70, '玩家1 选择角色', { 
                fontSize: '24px', fill: '#3498db' 
            }).setOrigin(0.5);
        }
        
        this.createCharacterList();
        this.createSelectedDisplay();
        
        // 开始按钮
        this.startBtn = this.add.text(centerX, 550, this.onlineMode ? '[ 等待对手选择... ]' : '[ 开始战斗 ]', { 
            fontSize: '24px', fill: '#555' 
        }).setOrigin(0.5).setInteractive();
        
        this.startBtn.on('pointerdown', () => this.startGame());
        this.startBtn.on('pointerover', () => {
            if (this.canStart()) this.startBtn.setStyle({ fill: '#58d68d' });
        });
        this.startBtn.on('pointerout', () => {
            this.startBtn.setStyle({ fill: this.canStart() ? '#2ecc71' : '#555' });
        });
        
        // 返回按钮
        this.add.text(50, 550, '[ 返回 ]', { 
            fontSize: '18px', fill: '#e74c3c' 
        }).setInteractive().on('pointerdown', () => {
            this.scene.start('LobbyScene');
        });
        
        // 设置在线模式回调
        if (this.onlineMode) {
            this.setupOnlineCallbacks();
        }
    }

    setupOnlineCallbacks() {
        networkManager.onOpponentSelected = (data) => {
            this.opponentSelection = data.character;
            this.updateOpponentDisplay();
            this.checkBothReady();
        };
        
        networkManager.onGameStart = (data) => {
            this.scene.start('GameScene', { 
                mode: 'online',
                players: data.players,
                currentTurn: data.currentTurn
            });
        };
    }

    updateOpponentDisplay() {
        if (this.opponentSelection) {
            const char = CHARACTERS[this.opponentSelection];
            if (networkManager.myTeam === 'player') {
                this.p2Text.setText(char.name);
                this.p2Text.setStyle({ fill: '#fff' });
            } else {
                this.p1Text.setText(char.name);
                this.p1Text.setStyle({ fill: '#fff' });
            }
        }
    }

    checkBothReady() {
        if (this.mySelection && this.opponentSelection) {
            this.startBtn.setText('[ 双方已准备，开始游戏! ]');
            this.startBtn.setStyle({ fill: '#2ecc71' });
        }
    }

    canStart() {
        if (this.testMode) return this.player1Char !== null;
        if (this.onlineMode) return false; // 在线模式由服务器控制开始
        return this.player1Char !== null && this.player2Char !== null;
    }

    createCharacterList() {
        const characters = Object.keys(CHARACTERS);
        const startX = 100;
        const startY = 130;
        const cardWidth = 160;
        const cardHeight = 180;
        const cols = 5;
        
        this.charCards = [];
        
        characters.forEach((charId, index) => {
            const char = CHARACTERS[charId];
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardWidth + 20);
            const y = startY + row * (cardHeight + 20);
            
            const card = this.add.rectangle(x + cardWidth/2, y + cardHeight/2, cardWidth, cardHeight, 0x2a2a3e)
                .setStrokeStyle(2, 0x4a4a6a)
                .setInteractive();
            
            let avatar;
            if (this.textures.exists(charId)) {
                avatar = this.add.image(x + cardWidth/2, y + 50, charId).setDisplaySize(70, 70);
            } else {
                const classData = CLASS_CONFIG[char.class];
                avatar = this.add.circle(x + cardWidth/2, y + 50, 30, classData.color);
            }
            
            const nameText = this.add.text(x + cardWidth/2, y + 100, char.name, { 
                fontSize: '11px', fill: '#fff', wordWrap: { width: cardWidth - 10 }
            }).setOrigin(0.5);
            
            const classData = CLASS_CONFIG[char.class];
            this.add.text(x + cardWidth/2, y + 120, classData.name, { 
                fontSize: '14px', fill: '#f1c40f' 
            }).setOrigin(0.5);
            
            this.add.text(x + cardWidth/2, y + 145, 
                `移动:${classData.moveRange} 射程:${classData.attackRange} 骰子:${classData.diceCount}d6`, { 
                fontSize: '9px', fill: '#aaa' 
            }).setOrigin(0.5);
            
            card.on('pointerover', () => {
                card.setStrokeStyle(3, 0xf1c40f);
                this.showCharacterDetail(char);
            });
            
            card.on('pointerout', () => {
                if (this.player1Char !== charId && this.player2Char !== charId && this.mySelection !== charId) {
                    card.setStrokeStyle(2, 0x4a4a6a);
                }
                this.hideCharacterDetail();
            });
            
            card.on('pointerdown', () => {
                this.selectCharacter(charId, card);
            });
            
            this.charCards.push({ charId, card, avatar, nameText });
        });
    }

    createSelectedDisplay() {
        if (this.testMode) {
            this.add.text(400, 380, '已选角色', { fontSize: '18px', fill: '#3498db' }).setOrigin(0.5);
            this.p1Box = this.add.rectangle(400, 430, 150, 50, 0x2a2a3e).setStrokeStyle(2, 0x3498db);
            this.p1Text = this.add.text(400, 430, '未选择', { fontSize: '14px', fill: '#666' }).setOrigin(0.5);
        } else {
            this.add.text(200, 380, '玩家1', { fontSize: '18px', fill: '#3498db' }).setOrigin(0.5);
            this.p1Box = this.add.rectangle(200, 430, 150, 50, 0x2a2a3e).setStrokeStyle(2, 0x3498db);
            this.p1Text = this.add.text(200, 430, '未选择', { fontSize: '14px', fill: '#666' }).setOrigin(0.5);
            
            this.add.text(400, 420, 'VS', { fontSize: '36px', fill: '#e74c3c', fontStyle: 'bold' }).setOrigin(0.5);
            
            this.add.text(600, 380, '玩家2', { fontSize: '18px', fill: '#e74c3c' }).setOrigin(0.5);
            this.p2Box = this.add.rectangle(600, 430, 150, 50, 0x2a2a3e).setStrokeStyle(2, 0xe74c3c);
            this.p2Text = this.add.text(600, 430, '未选择', { fontSize: '14px', fill: '#666' }).setOrigin(0.5);
        }
        
        this.detailPanel = this.add.container(850, 130).setVisible(false);
        this.detailBg = this.add.rectangle(0, 0, 200, 300, 0x1a1a2e, 0.95).setStrokeStyle(2, 0xf1c40f).setOrigin(0, 0);
        this.detailText = this.add.text(10, 10, '', { fontSize: '11px', fill: '#fff', wordWrap: { width: 180 }, lineSpacing: 3 });
        this.detailPanel.add([this.detailBg, this.detailText]);
    }

    showCharacterDetail(char) {
        let text = `【${char.name}】\n`;
        text += `职阶: ${CLASS_CONFIG[char.class].name}\n\n`;
        text += `═══ 技能 ═══\n`;
        char.skills.forEach((skill, i) => {
            text += `${i+1}. ${skill.name}\n   ${skill.desc}\n`;
        });
        text += `\n═══ 宝具 ═══\n`;
        text += `${char.noble.name}\n${char.noble.desc}`;
        
        this.detailText.setText(text);
        this.detailPanel.setVisible(true);
    }

    hideCharacterDetail() {
        this.detailPanel.setVisible(false);
    }

    selectCharacter(charId, card) {
        if (this.testMode) {
            this.charCards.forEach(c => c.card.setStrokeStyle(2, 0x4a4a6a));
            this.player1Char = charId;
            card.setStrokeStyle(3, 0x2ecc71);
            this.p1Text.setText(CHARACTERS[charId].name);
            this.p1Text.setStyle({ fill: '#fff' });
            this.startBtn.setStyle({ fill: '#2ecc71' });
            return;
        }
        
        if (this.onlineMode) {
            // 在线模式：只能选一次
            if (this.mySelection) return;
            
            this.charCards.forEach(c => c.card.setStrokeStyle(2, 0x4a4a6a));
            this.mySelection = charId;
            card.setStrokeStyle(3, 0x2ecc71);
            
            // 更新显示
            if (networkManager.myTeam === 'player') {
                this.p1Text.setText(CHARACTERS[charId].name);
                this.p1Text.setStyle({ fill: '#fff' });
            } else {
                this.p2Text.setText(CHARACTERS[charId].name);
                this.p2Text.setStyle({ fill: '#fff' });
            }
            
            // 发送选择到服务器
            networkManager.selectCharacter(charId);
            this.startBtn.setText('[ 等待对手选择... ]');
            this.checkBothReady();
            return;
        }
        
        // 本地双人模式
        if (this.currentPlayer === 1) {
            this.charCards.forEach(c => {
                if (this.player2Char !== c.charId) {
                    c.card.setStrokeStyle(2, 0x4a4a6a);
                }
            });
            this.player1Char = charId;
            card.setStrokeStyle(3, 0x3498db);
            this.p1Text.setText(CHARACTERS[charId].name);
            this.p1Text.setStyle({ fill: '#fff' });
            this.currentPlayer = 2;
            this.playerText.setText('玩家2 选择角色');
            this.playerText.setStyle({ fill: '#e74c3c' });
        } else {
            this.charCards.forEach(c => {
                if (this.player1Char !== c.charId && this.player2Char === c.charId) {
                    c.card.setStrokeStyle(2, 0x4a4a6a);
                }
            });
            this.player2Char = charId;
            card.setStrokeStyle(3, 0xe74c3c);
            this.p2Text.setText(CHARACTERS[charId].name);
            this.p2Text.setStyle({ fill: '#fff' });
            this.startBtn.setStyle({ fill: '#2ecc71' });
            this.playerText.setText('双方已选择完毕');
            this.playerText.setStyle({ fill: '#2ecc71' });
        }
    }

    startGame() {
        if (!this.canStart()) return;
        
        if (this.testMode) {
            this.scene.start('TestScene', { character: this.player1Char });
        } else {
            this.scene.start('GameScene', { 
                mode: 'local',
                player1: this.player1Char,
                player2: this.player2Char
            });
        }
    }
}
