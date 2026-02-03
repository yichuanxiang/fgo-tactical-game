// 音效管理器 - 使用 Web Audio API 合成音效
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.3;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API 不支持');
            this.enabled = false;
        }
    }

    // 确保音频上下文已启动（需要用户交互后调用）
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 播放音符
    playTone(frequency, duration, type = 'sine', volume = this.volume) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // 骰子滚动音效
    playDiceRoll() {
        if (!this.enabled) return;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(200 + Math.random() * 300, 0.05, 'square', 0.1);
            }, i * 80);
        }
    }

    // 骰子结果音效
    playDiceResult() {
        this.playTone(523, 0.1, 'sine');
        setTimeout(() => this.playTone(659, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(784, 0.2, 'sine'), 200);
    }

    // 移动音效
    playMove() {
        this.playTone(330, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(440, 0.1, 'sine', 0.2), 50);
    }

    // 攻击音效
    playAttack() {
        this.playTone(150, 0.1, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(100, 0.15, 'sawtooth', 0.4), 50);
    }

    // 受伤音效
    playHit() {
        this.playTone(200, 0.1, 'square', 0.2);
        this.playTone(150, 0.15, 'square', 0.15);
    }

    // 治疗音效
    playHeal() {
        this.playTone(523, 0.15, 'sine', 0.2);
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.25), 200);
    }

    // 护盾音效
    playShield() {
        this.playTone(400, 0.2, 'triangle', 0.2);
        setTimeout(() => this.playTone(600, 0.3, 'triangle', 0.15), 100);
    }

    // 充能音效
    playCharge() {
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playTone(300 + i * 100, 0.1, 'sine', 0.15);
            }, i * 80);
        }
    }

    // 宝具音效
    playNoble() {
        // 蓄力
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.playTone(200 + i * 50, 0.1, 'sawtooth', 0.1 + i * 0.02);
            }, i * 60);
        }
        // 爆发
        setTimeout(() => {
            this.playTone(100, 0.3, 'sawtooth', 0.4);
            this.playTone(150, 0.3, 'square', 0.3);
            this.playTone(200, 0.4, 'sawtooth', 0.3);
        }, 500);
    }

    // 技能音效
    playSkill() {
        this.playTone(440, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(550, 0.1, 'sine', 0.2), 80);
        setTimeout(() => this.playTone(660, 0.15, 'sine', 0.25), 160);
    }

    // 回合切换音效
    playTurnChange() {
        this.playTone(392, 0.15, 'sine', 0.2);
        setTimeout(() => this.playTone(523, 0.2, 'sine', 0.25), 150);
    }

    // 胜利音效
    playVictory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.3), i * 150);
        });
    }

    // 失败音效
    playDefeat() {
        const notes = [392, 330, 262, 196];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.3), i * 200);
        });
    }

    // 按钮点击音效
    playClick() {
        this.playTone(600, 0.05, 'sine', 0.15);
    }

    // 错误音效
    playError() {
        this.playTone(200, 0.1, 'square', 0.2);
        setTimeout(() => this.playTone(150, 0.15, 'square', 0.2), 100);
    }

    // 死亡音效
    playDeath() {
        this.playTone(300, 0.2, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.25), 150);
        setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.2), 300);
    }
}

// 全局音效管理器
const audioManager = new AudioManager();
