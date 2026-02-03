// 初始化游戏
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + 250,
    height: GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize + 150,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [LobbyScene, CharacterSelectScene, TestScene, GameScene]
};

const game = new Phaser.Game(config);
