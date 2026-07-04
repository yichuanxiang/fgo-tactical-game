/* ═══════════════════════════════════════════════════════
   Fate Battle — 宝具 cinematic 动画系统
   每个宝具分四阶段：蓄力 / 解放 / 爆发 / 收尾
   ═══════════════════════════════════════════════════════ */

const NobleCinematics = {

    /* ── 通用：镜头拉近到发动者 ── */
    zoomToCaster(scene, duration, callback) {
        const cam = scene.cameras.main;
        const u = scene.currentUnit;
        if (!u) { if (callback) callback(); return; }
        cam.stopFollow();
        cam.pan(u.x, u.y, duration, 'Power2', false, (cam, prog) => {
            cam.setZoom(1 + prog * 0.25);
        });
        scene.time.delayedCall(duration, () => { if (callback) callback(); });
    },

    /* ── 通用：镜头复位 ── */
    resetCamera(scene, duration) {
        const cam = scene.cameras.main;
        cam.pan(cam.width / 2, cam.height / 2, duration, 'Power2');
        cam.zoomTo(1, duration);
    },

    /* ── 屏幕文字 ── */
    showNobleName(scene, name, subtext) {
        const cx = scene.cameras.main.width / 2;
        const cy = scene.cameras.main.height / 2;
        const txt = scene.add.text(cx, cy - 30, name, {
            fontSize: '32px', fill: '#ffd700', fontStyle: 'bold',
            fontFamily: 'Georgia, serif', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0).setDepth(2000).setScale(0.5);

        scene.tweens.add({
            targets: txt, alpha: 1, scale: 1, duration: 500, ease: 'Back.easeOut',
            onComplete: () => {
                scene.tweens.add({
                    targets: txt, alpha: 0, y: cy - 50, duration: 600, delay: 600,
                    onComplete: () => txt.destroy()
                });
            }
        });

        if (subtext) {
            const sub = scene.add.text(cx, cy + 10, subtext, {
                fontSize: '14px', fill: '#c8aa50', letterSpacing: 6,
                fontFamily: 'Georgia, serif', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0).setDepth(2000);
            scene.tweens.add({ targets: sub, alpha: 0.8, duration: 400, delay: 200 });
            scene.tweens.add({ targets: sub, alpha: 0, duration: 500, delay: 1000, onComplete: () => sub.destroy() });
        }
    },

    /* ── 蓄力粒子聚集 ── */
    chargeParticles(scene, color, duration) {
        const u = scene.currentUnit;
        if (!u) return;
        const particles = [];
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(60, 150);
            const p = scene.add.circle(
                u.x + Math.cos(angle) * dist,
                u.y + Math.sin(angle) * dist,
                Phaser.Math.Between(2, 5), color, 0.7
            ).setDepth(1500).setAlpha(0);
            particles.push(p);

            scene.tweens.add({
                targets: p,
                x: u.x, y: u.y, alpha: 0.9, scale: 0.5,
                duration: duration - 200 + Math.random() * 200,
                delay: Math.random() * 200,
                ease: 'Power2'
            });
        }
        // 清理
        scene.time.delayedCall(duration + 300, () => {
            particles.forEach(p => p.destroy());
        });
        return particles;
    },

    /* ── 屏幕暗化 ── */
    screenDarken(scene, alpha, duration) {
        const W = scene.cameras.main.width, H = scene.cameras.main.height;
        const overlay = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(1499);
        scene.tweens.add({ targets: overlay, fillAlpha: alpha, duration: duration, ease: 'Power2' });
        return overlay;
    },

    /* ── 圆形冲击波 ── */
    shockwave(scene, x, y, color, maxRadius) {
        const wave = scene.add.circle(x, y, 10, color, 0).setDepth(1600);
        wave.setStrokeStyle(3, color, 0.8);
        scene.tweens.add({
            targets: wave, scaleX: maxRadius / 10, scaleY: maxRadius / 10,
            alpha: 0, duration: 500, ease: 'Power2',
            onComplete: () => wave.destroy()
        });
        return wave;
    },

    /* ══════════════════════════════════════════════════
       SABER — 誓约胜利之剑 (Excalibur)
       ══════════════════════════════════════════════════ */
    playExcalibur(scene, onComplete) {
        const u = scene.currentUnit;
        const W = scene.cameras.main.width, H = scene.cameras.main.height;
        if (!u) { if (onComplete) onComplete(); return; }

        // 阶段1: 蓄力 (1.2s)
        this.showNobleName(scene, '誓约胜利之剑', 'E X C A L I B U R');
        const overlay = this.screenDarken(scene, 0.5, 800);
        this.chargeParticles(scene, 0xffd700, 1200);
        this.zoomToCaster(scene, 800);

        // 阶段2: 解放 — 光柱冲天 (0.8s)
        scene.time.delayedCall(1000, () => {
            scene.cameras.main.flash(300, 255, 215, 0);
            // 光柱
            const beam = scene.add.rectangle(u.x, u.y, 30, H * 2, 0xffd700, 0.4).setDepth(1550);
            const beamInner = scene.add.rectangle(u.x, u.y, 10, H * 2, 0xffffff, 0.6).setDepth(1551);
            scene.tweens.add({ targets: [beam, beamInner], scaleX: 3, alpha: 0, duration: 600, onComplete: () => { beam.destroy(); beamInner.destroy(); } });

            // 金色粒子爆散
            for (let i = 0; i < 40; i++) {
                const p = scene.add.circle(u.x, u.y, Phaser.Math.Between(2, 6), 0xffd700, 0.8).setDepth(1600);
                const a = Math.random() * Math.PI * 2, d = Phaser.Math.Between(40, 200);
                scene.tweens.add({
                    targets: p, x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d,
                    alpha: 0, duration: 500, onComplete: () => p.destroy()
                });
            }
            scene.shockwave(scene, u.x, u.y, 0xffd700, 200);
            scene.cameras.main.shake(300, 0.008);
        });

        // 阶段3: 爆发 — 光束横扫 (1.0s)
        scene.time.delayedCall(1800, () => {
            // 从左到右的金色光束
            for (let i = 0; i < 5; i++) {
                scene.time.delayedCall(i * 100, () => {
                    const swipe = scene.add.rectangle(0, H * (0.3 + i * 0.1), W * 1.5, 3, 0xffd700, 0.8).setDepth(1600).setOrigin(0, 0.5);
                    scene.tweens.add({
                        targets: swipe, x: W + 200, alpha: 0, duration: 600, ease: 'Power3',
                        onComplete: () => swipe.destroy()
                    });
                });
            }
            // 全屏金色粒子
            for (let i = 0; i < 50; i++) {
                scene.time.delayedCall(Math.random() * 400, () => {
                    const p = scene.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(1, 4), 0xffd700, 0.6).setDepth(1600);
                    scene.tweens.add({ targets: p, alpha: 0, scale: 3, duration: 400, onComplete: () => p.destroy() });
                });
            }
            scene.cameras.main.flash(500, 255, 240, 100);
        });

        // 阶段4: 收尾
        scene.time.delayedCall(2800, () => {
            this.resetCamera(scene, 500);
            scene.tweens.add({ targets: overlay, fillAlpha: 0, duration: 400, onComplete: () => overlay.destroy() });
            if (onComplete) onComplete();
        });
    },

    /* ══════════════════════════════════════════════════
       ARCHER — 无限剑制 (Unlimited Blade Works)
       ══════════════════════════════════════════════════ */
    playUBW(scene, onComplete) {
        const u = scene.currentUnit;
        const W = scene.cameras.main.width, H = scene.cameras.main.height;
        if (!u) { if (onComplete) onComplete(); return; }

        // 阶段1: 结界咏唱
        this.showNobleName(scene, '无限剑制', 'Unlimited Blade Works');
        const overlay = this.screenDarken(scene, 0.6, 600);

        // 火焰粒子从边缘涌入
        scene.time.delayedCall(400, () => {
            for (let i = 0; i < 60; i++) {
                const fromEdge = Math.random() < 0.5;
                const x = fromEdge ? (Math.random() < 0.5 ? 0 : W) : Phaser.Math.Between(0, W);
                const y = fromEdge ? Phaser.Math.Between(0, H) : (Math.random() < 0.5 ? 0 : H);
                const p = scene.add.circle(x, y, Phaser.Math.Between(2, 4), 0xff4422, 0.5).setDepth(1550);
                scene.tweens.add({
                    targets: p, x: W / 2 + Phaser.Math.Between(-100, 100), y: H / 2 + Phaser.Math.Between(-80, 80),
                    alpha: 0, duration: 1000, delay: Math.random() * 500, onComplete: () => p.destroy()
                });
            }
        });

        // 阶段2: 结界展开 — 齿轮旋转
        scene.time.delayedCall(1000, () => {
            scene.cameras.main.flash(400, 255, 60, 30);
            scene.cameras.main.shake(200, 0.005);

            // 大齿轮
            for (let i = 0; i < 3; i++) {
                const gear = scene.add.circle(W / 2 + (i - 1) * 150, H / 2, 80 + i * 20, 0xff4422, 0).setDepth(1580);
                gear.setStrokeStyle(2, 0xff6644, 0.3);
                scene.tweens.add({ targets: gear, rotation: Math.PI * 2 * (i % 2 ? 1 : -1), scale: 0.5, alpha: 0, duration: 1500, ease: 'Power2', onComplete: () => gear.destroy() });
            }

            // 剑雨落下
            for (let i = 0; i < 30; i++) {
                scene.time.delayedCall(i * 40, () => {
                    const sword = scene.add.rectangle(Phaser.Math.Between(0, W), -20, 2, Phaser.Math.Between(20, 50), 0xcccccc, 0.6).setDepth(1600);
                    sword.setRotation(Phaser.Math.FloatBetween(-0.3, 0.3));
                    scene.tweens.add({
                        targets: sword, y: H + 20, rotation: sword.rotation + 0.5,
                        duration: Phaser.Math.Between(600, 1000), ease: 'Power1',
                        onComplete: () => sword.destroy()
                    });
                });
            }
        });

        // 阶段3: 红色天空
        scene.time.delayedCall(2000, () => {
            const redSky = scene.add.rectangle(W / 2, H / 2, W, H, 0x330000, 0.25).setDepth(1550);
            for (let i = 0; i < 40; i++) {
                const spark = scene.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 2, 0xff6644, 0.5).setDepth(1560);
                scene.tweens.add({ targets: spark, alpha: 0, scale: 4, duration: Phaser.Math.Between(400, 800), onComplete: () => spark.destroy() });
            }
            scene.time.delayedCall(800, () => {
                scene.tweens.add({ targets: redSky, alpha: 0, duration: 400, onComplete: () => redSky.destroy() });
            });
        });

        // 收尾
        scene.time.delayedCall(3000, () => {
            scene.tweens.add({ targets: overlay, fillAlpha: 0, duration: 400, onComplete: () => overlay.destroy() });
            this.resetCamera(scene, 500);
            if (onComplete) onComplete();
        });
    },

    /* ══════════════════════════════════════════════════
       BERSERKER — 缚锁全开·过载 (Arondight Overload)
       ══════════════════════════════════════════════════ */
    playArondightOverload(scene, onComplete) {
        const u = scene.currentUnit;
        const W = scene.cameras.main.width, H = scene.cameras.main.height;
        if (!u) { if (onComplete) onComplete(); return; }

        this.showNobleName(scene, '缚锁全开·过载', 'Arondight Overload');
        const overlay = this.screenDarken(scene, 0.55, 400);

        // 蓄力: 暗红色粒子聚集
        this.chargeParticles(scene, 0x8b0000, 1000);
        this.zoomToCaster(scene, 700);

        // 解放: 暗红爆发 + 锁链碎裂
        scene.time.delayedCall(1000, () => {
            scene.cameras.main.flash(300, 255, 0, 0);
            scene.cameras.main.shake(400, 0.01);
            scene.shockwave(scene, u.x, u.y, 0xff0000, 250);

            // 锁链断裂粒子
            for (let i = 0; i < 50; i++) {
                const p = scene.add.circle(u.x, u.y, Phaser.Math.Between(3, 8), Phaser.Math.Between(0) > 0.5 ? 0x8b0000 : 0xff4400, 0.8).setDepth(1600);
                const a = Math.random() * Math.PI * 2, d = Phaser.Math.Between(50, 250);
                scene.tweens.add({
                    targets: p, x: u.x + Math.cos(a) * d, y: u.y + Math.sin(a) * d,
                    scale: 0.2, alpha: 0, duration: 500, onComplete: () => p.destroy()
                });
            }

            // 向上迸发的火焰柱
            for (let i = 0; i < 8; i++) {
                const flame = scene.add.rectangle(u.x + Phaser.Math.Between(-20, 20), u.y, Phaser.Math.Between(4, 10), Phaser.Math.Between(30, 80), 0xff4400, 0.6).setDepth(1590);
                scene.tweens.add({
                    targets: flame, y: u.y - Phaser.Math.Between(100, 250), alpha: 0, scaleX: 2,
                    duration: 600, delay: i * 60, onComplete: () => flame.destroy()
                });
            }
        });

        // 过载脉冲
        scene.time.delayedCall(1800, () => {
            for (let i = 0; i < 3; i++) {
                scene.time.delayedCall(i * 200, () => {
                    const pulse = scene.add.circle(u.x, u.y, 20, 0xff0000, 0.2).setDepth(1580);
                    scene.tweens.add({ targets: pulse, scale: 6, alpha: 0, duration: 500, onComplete: () => pulse.destroy() });
                    scene.cameras.main.shake(100, 0.004);
                });
            }
        });

        scene.time.delayedCall(2600, () => {
            this.resetCamera(scene, 500);
            scene.tweens.add({ targets: overlay, fillAlpha: 0, duration: 400, onComplete: () => overlay.destroy() });
            if (onComplete) onComplete();
        });
    },

    /* ══════════════════════════════════════════════════
       CASTER — 何乐不为·有何不为
       ══════════════════════════════════════════════════ */
    playHeleweiNoble(scene, onComplete) {
        const u = scene.currentUnit;
        const W = scene.cameras.main.width, H = scene.cameras.main.height;
        if (!u) { if (onComplete) onComplete(); return; }

        this.showNobleName(scene, '何乐不为·有何不为', 'Caster Noble Phantasm');
        const overlay = this.screenDarken(scene, 0.4, 500);

        // 粉色魔法阵
        scene.time.delayedCall(500, () => {
            const magicCircle = scene.add.circle(u.x, u.y, 40, 0xff1493, 0).setDepth(1580);
            magicCircle.setStrokeStyle(2, 0xff69b4, 0.5);
            scene.tweens.add({ targets: magicCircle, scale: 3, alpha: 0, duration: 1200, onComplete: () => magicCircle.destroy() });

            // 心形粒子
            for (let i = 0; i < 25; i++) {
                scene.time.delayedCall(Math.random() * 800, () => {
                    const h = scene.add.circle(u.x + Phaser.Math.Between(-60, 60), u.y + Phaser.Math.Between(-60, 60), Phaser.Math.Between(2, 5), 0xff69b4, 0.7).setDepth(1590);
                    scene.tweens.add({
                        targets: h, y: h.y - Phaser.Math.Between(40, 120), alpha: 0, scale: 1.5,
                        duration: 600, onComplete: () => h.destroy()
                    });
                });
            }
        });

        // 瓷器碎裂声效模拟
        scene.time.delayedCall(1500, () => {
            for (let i = 0; i < 35; i++) {
                const shard = scene.add.rectangle(u.x + Phaser.Math.Between(-80, 80), u.y + Phaser.Math.Between(-80, 80), Phaser.Math.Between(3, 10), Phaser.Math.Between(3, 10), 0xffffff, 0.5).setDepth(1590);
                shard.setRotation(Math.random() * Math.PI);
                scene.tweens.add({
                    targets: shard, x: shard.x + Phaser.Math.Between(-60, 60), y: shard.y + Phaser.Math.Between(-60, 60),
                    rotation: shard.rotation + Phaser.Math.FloatBetween(-2, 2), alpha: 0, duration: 500,
                    onComplete: () => shard.destroy()
                });
            }
            scene.cameras.main.flash(300, 255, 100, 200);
        });

        scene.time.delayedCall(2500, () => {
            this.resetCamera(scene, 500);
            scene.tweens.add({ targets: overlay, fillAlpha: 0, duration: 400, onComplete: () => overlay.destroy() });
            if (onComplete) onComplete();
        });
    },

    /* ══════════════════════════════════════════════════
       LANCER — 国士无双 (韩信)
       ══════════════════════════════════════════════════ */
    playUnrivaledGeneral(scene, onComplete) {
        const u = scene.currentUnit;
        const W = scene.cameras.main.width, H = scene.cameras.main.height;
        if (!u) { if (onComplete) onComplete(); return; }

        this.showNobleName(scene, '国士无双', 'Unrivaled General');
        const overlay = this.screenDarken(scene, 0.5, 600);

        // 军队虚影 — 紫色旗阵
        scene.time.delayedCall(600, () => {
            for (let i = 0; i < 20; i++) {
                const flag = scene.add.rectangle(u.x + Phaser.Math.Between(-180, 180), u.y + Phaser.Math.Between(-120, 120), 1, Phaser.Math.Between(30, 60), 0x9370db, 0.3).setDepth(1570);
                scene.tweens.add({
                    targets: flag, y: flag.y - Phaser.Math.Between(20, 50), alpha: 0,
                    duration: 800, delay: i * 50, onComplete: () => flag.destroy()
                });
            }
        });

        // 十面埋伏 — 陷阱展开
        scene.time.delayedCall(1400, () => {
            scene.cameras.main.shake(300, 0.006);
            for (let i = 0; i < 10; i++) {
                const tx = u.x + Phaser.Math.Between(-150, 150), ty = u.y + Phaser.Math.Between(-100, 100);
                const trap = scene.add.circle(tx, ty, 5, 0x9400d3, 0.5).setDepth(1580);
                scene.tweens.add({
                    targets: trap, scale: Phaser.Math.Between(3, 6), alpha: 0,
                    duration: 500, delay: i * 80, onComplete: () => trap.destroy()
                });
            }
            // 紫色冲击波
            scene.shockwave(scene, u.x, u.y, 0x9400d3, 200);
            scene.cameras.main.flash(400, 150, 0, 255);
        });

        scene.time.delayedCall(2500, () => {
            this.resetCamera(scene, 500);
            scene.tweens.add({ targets: overlay, fillAlpha: 0, duration: 400, onComplete: () => overlay.destroy() });
            if (onComplete) onComplete();
        });
    },

    /* ── 视频播放（原生 HTML5 video 元素，覆盖在 canvas 上） ── */
    playVideo(scene, charId, onComplete) {
        const videoKey = 'noble_' + charId;
        const hasVideo = scene.cache && scene.cache.video && scene.cache.video.exists(videoKey);
        if (!hasVideo) return false;

        try {
            const gameCanvas = scene.sys.game.canvas;
            const rect = gameCanvas.getBoundingClientRect();

            // 原生 video 元素
            const el = document.createElement('video');
            el.src = 'assets/nobles/' + charId + '.mp4';
            el.style.position = 'fixed';
            el.style.left = rect.left + 'px';
            el.style.top = rect.top + 'px';
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.style.objectFit = 'contain';
            el.style.zIndex = '99999';
            el.style.background = '#000';
            el.muted = true;             // 静音绕过自动播放限制
            el.setAttribute('muted', '');
            el.setAttribute('playsinline', '');
            document.body.appendChild(el);

            // 跳过提示
            const hint = document.createElement('div');
            hint.textContent = '点击跳过 ▶';
            hint.style.position = 'fixed';
            hint.style.right = (window.innerWidth - rect.right + 16) + 'px';
            hint.style.bottom = (window.innerHeight - rect.bottom + 14) + 'px';
            hint.style.zIndex = '100000';
            hint.style.color = '#ffd700';
            hint.style.font = 'bold 14px Arial, sans-serif';
            hint.style.textShadow = '0 0 4px #000, 0 0 4px #000';
            hint.style.cursor = 'pointer';
            hint.style.pointerEvents = 'none';
            document.body.appendChild(hint);

            let finished = false;
            let hardTimer = null;
            let startTimer = null;
            const skip = () => {
                if (finished) return;
                finished = true;
                if (hardTimer) clearTimeout(hardTimer);
                if (startTimer) clearTimeout(startTimer);
                try { el.pause(); } catch (e) {}
                if (el.parentNode) el.parentNode.removeChild(el);
                if (hint.parentNode) hint.parentNode.removeChild(hint);
                if (onComplete) onComplete();
            };

            el.addEventListener('ended', skip);
            el.addEventListener('error', () => { console.log('noble video error:', charId); skip(); });
            el.addEventListener('click', skip);

            // 硬超时（视频约16s，给25s上限）
            hardTimer = setTimeout(() => { if (!finished) { console.log('noble video hard timeout'); skip(); } }, 25000);
            // 2.5秒未开始播放则跳过（自动播放被拦截/解码失败）
            startTimer = setTimeout(() => {
                if (!finished && (el.paused || el.currentTime === 0)) {
                    console.log('noble video did not start, skipping');
                    skip();
                }
            }, 2500);

            const p = el.play();
            if (p && typeof p.catch === 'function') {
                p.catch((err) => { console.log('noble video play rejected:', err); skip(); });
            }

            return true;
        } catch (e) {
            console.log('Video playback failed for ' + charId + ':', e);
            return false;
        }
    },

    /* ══════════════════════════════════════════════════
       水月无影 — 月淮泉·花影 (Moon Spring: Flower Shadow)
       ══════════════════════════════════════════════════ */
    playMoonSpringFlowers(scene, onComplete) {
        const u = scene.currentUnit;
        const W = scene.cameras.main.width, H = scene.cameras.main.height;
        const CX = W / 2, CY = H / 2;
        if (!u) { if (onComplete) onComplete(); return; }

        // 阶段1: 宝具名显现 (0→1.5s)
        this.showNobleName(scene, '月淮泉·花影', 'M O O N   S P R I N G');
        const overlay = this.screenDarken(scene, 0.6, 600);
        this.zoomToCaster(scene, 600);

        // 角色立绘弹窗
        const charId = u.data.charId;
        if (charId && scene.textures.exists(charId)) {
            const portrait = scene.add.image(CX, CY, charId).setDepth(2000).setAlpha(0);
            portrait.setDisplaySize(88, 116);
            scene.tweens.add({ targets: portrait, alpha: 0.85, duration: 400, ease: 'Quad.easeOut' });
            scene.tweens.add({ targets: portrait, alpha: 0, duration: 500, delay: 1000, onComplete: () => portrait.destroy() });
        }

        // 粒子向中心聚集
        this.chargeParticles(scene, 0xb8a9d4, 1000);
        scene.time.delayedCall(300, () => {
            this.chargeParticles(scene, 0xd4b8f0, 800);
        });

        // 阶段2: 月华绽放 (0.6→1.5s)
        scene.time.delayedCall(600, () => {
            // 闪光
            scene.cameras.main.flash(400, 180, 150, 220);
            scene.cameras.main.shake(300, 0.005);

            // 中心大爆炸
            const burst = scene.add.circle(u.x, u.y, 20, 0xb8a9d4, 0.7).setDepth(1550);
            scene.tweens.add({ targets: burst, scale: 15, alpha: 0, duration: 800, ease: 'Power3', onComplete: () => burst.destroy() });
            const burst2 = scene.add.circle(u.x, u.y, 10, 0xd4b8f0, 0.8).setDepth(1551);
            scene.tweens.add({ targets: burst2, scale: 10, alpha: 0, duration: 500, delay: 150, onComplete: () => burst2.destroy() });

            // 三环冲击波
            for (let i = 0; i < 3; i++) {
                scene.time.delayedCall(i * 120, () => {
                    this.shockwave(scene, u.x, u.y, 0xb8a9d4, 300 + i * 80);
                });
            }

            // 大量粒子向外爆散
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Phaser.Math.Between(50, 280);
                const size = Phaser.Math.Between(3, 8);
                const p = scene.add.circle(u.x, u.y, size, i % 3 === 0 ? 0xd4b8f0 : 0xb8a9d4, 0.8).setDepth(1560);
                scene.tweens.add({
                    targets: p,
                    x: u.x + Math.cos(angle) * dist,
                    y: u.y + Math.sin(angle) * dist,
                    alpha: 0, scale: 0.2,
                    duration: Phaser.Math.Between(600, 1200),
                    ease: 'Power2',
                    onComplete: () => p.destroy()
                });
            }

            // 全屏花瓣粒子飘落
            for (let i = 0; i < 25; i++) {
                scene.time.delayedCall(i * 40, () => {
                    const px = Phaser.Math.Between(0, W);
                    const petal = scene.add.circle(px, -20, Phaser.Math.Between(3, 7), 0xd4b8f0, 0.5).setDepth(1570);
                    scene.tweens.add({
                        targets: petal,
                        y: H + 30,
                        x: px + Phaser.Math.Between(-60, 60),
                        alpha: 0, rotation: Math.random() * 4,
                        duration: Phaser.Math.Between(2000, 3500),
                        ease: 'Sine.easeIn',
                        onComplete: () => petal.destroy()
                    });
                });
            }
        });

        // 阶段3: 分身虚影闪现 (0.9→1.6s)
        scene.time.delayedCall(900, () => {
            for (let i = 0; i < 7; i++) {
                scene.time.delayedCall(i * 70, () => {
                    const dx = Phaser.Math.Between(-4, 4);
                    const dy = Phaser.Math.Between(-3, 3);
                    const gx = u.x + dx * GAME_CONFIG.tileSize;
                    const gy = u.y + dy * GAME_CONFIG.tileSize;
                    const sil = scene.add.circle(gx, gy, GAME_CONFIG.tileSize / 3, 0xb8a9d4, 0.35).setDepth(1540);
                    scene.tweens.add({
                        targets: sil, alpha: 0, scale: 0.4,
                        duration: 600, delay: 400, ease: 'Quad.easeOut',
                        onComplete: () => sil.destroy()
                    });
                    // 闪光标记
                    const mark = scene.add.rectangle(gx, gy, 6, 6, 0xd4b8f0, 0.7).setDepth(1541);
                    scene.tweens.add({
                        targets: mark, scale: 4, alpha: 0, rotation: Math.PI / 4,
                        duration: 400, onComplete: () => mark.destroy()
                    });
                });
            }
        });

        // 阶段4: 镜头复位
        scene.time.delayedCall(1300, () => {
            this.resetCamera(scene, 500);
        });

        scene.time.delayedCall(1800, () => {
            if (overlay && overlay.active) overlay.destroy();
            if (onComplete) onComplete();
        });
    },

    /* ── 主入口 ── */
    play(scene, unit, onComplete) {
        if (!unit || !unit.data) { if (onComplete) onComplete(); return; }
        const charId = unit.data.charId;

        // 优先尝试播视频
        if (this.playVideo(scene, charId, onComplete)) return;

        // 无视频则走脚本动画
        switch (charId) {
            case 'saber_artoria':
                this.playExcalibur(scene, onComplete);
                break;
            case 'archer_emiya':
                this.playUBW(scene, onComplete);
                break;
            case 'berserker_lancelot':
                this.playArondightOverload(scene, onComplete);
                break;
            case 'caster_helewei':
                this.playHeleweiNoble(scene, onComplete);
                break;
            case 'lancer_hanxin':
                this.playUnrivaledGeneral(scene, onComplete);
                break;
            case 'mooncell_mizuki':
                this.playMoonSpringFlowers(scene, onComplete);
                break;
            default:
                this.showNobleName(scene, unit.data.noble ? unit.data.noble.name : '宝具解放', 'Noble Phantasm');
                scene.time.delayedCall(1500, () => { if (onComplete) onComplete(); });
                break;
        }
    }
};

console.log('Noble Cinematics loaded');
