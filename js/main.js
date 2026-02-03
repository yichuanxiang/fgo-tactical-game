// 检测是否为移动设备
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;

// 根据设备调整配置
if (isMobile) {
    GAME_CONFIG.tileSize = 40;
}

// 初始化游戏
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + (isMobile ? 50 : 250),
    height: GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize + (isMobile ? 200 : 150),
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [LobbyScene, CharacterSelectScene, TestScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
