// 检测是否为移动设备
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;

// 根据设备调整配置
if (isMobile) {
    GAME_CONFIG.tileSize = 32;
    GAME_CONFIG.mapHeight = 6; // 手机上减少地图高度
}

// 计算游戏尺寸
const gameWidth = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize + (isMobile ? 10 : 250);
const gameHeight = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize + (isMobile ? 140 : 150);

// 初始化游戏
const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [LobbyScene, CharacterSelectScene, TestScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameWidth,
        height: gameHeight
    }
};

const game = new Phaser.Game(config);
