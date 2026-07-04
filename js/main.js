// 检测是否为移动设备
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;

// 固定设计尺寸（横屏 16:9）
const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 540;

// 根据设备调整配置
if (isMobile) {
    GAME_CONFIG.tileSize = 48;  // 稍微缩小格子
}

// 初始化游戏
const config = {
    type: Phaser.AUTO,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [LobbyScene, CharacterSelectScene, TestScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
        min: {
            width: 480,
            height: 270
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    input: {
        activePointers: 3  // 支持多点触控
    }
};

const game = new Phaser.Game(config);

// 强制横屏提示
function checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    let overlay = document.getElementById('rotate-overlay');
    
    if (isMobile && isPortrait) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'rotate-overlay';
            overlay.innerHTML = `
                <div style="text-align:center;">
                    <div style="font-size:60px;margin-bottom:20px;">📱↻</div>
                    <div style="font-size:20px;">请旋转手机至横屏模式</div>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #1a1a2e;
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    } else if (overlay) {
        overlay.style.display = 'none';
    }
}

// 监听屏幕旋转
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
checkOrientation();
