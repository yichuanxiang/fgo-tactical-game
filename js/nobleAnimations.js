// 宝具动画系统
const NOBLE_ANIMATION_VERSION = '2026-04-04-npfx-4';

const NobleAnimations = {
    play(scene, unit, noble, onComplete) {
        const charId = unit.data.charId;
        console.log('[NobleAnimations]', NOBLE_ANIMATION_VERSION, charId, noble && noble.name);
        const finish = () => {
            let burstColor = 0xf1c40f;
            switch (charId) {
                case 'archer_emiya':
                    burstColor = 0xe74c3c;
                    break;
                case 'caster_helewei':
                    burstColor = 0xc56cf0;
                    break;
                case 'berserker_lancelot':
                    burstColor = 0xff6b6b;
                    break;
                case 'lancer_hanxin':
                    burstColor = 0x63e6be;
                    break;
                case 'lancer_cu':
                    burstColor = 0xc0392b;
                    break;
                case 'caster_medea':
                    burstColor = 0x8e44ad;
                    break;
                case 'berserker_herc':
                    burstColor = 0xd35400;
                    break;
                case 'assassin_hassan':
                    burstColor = 0x6c5ce7;
                    break;
                default:
                    burstColor = 0xf1c40f;
                    break;
            }

            if (scene.createRadialBurstAt) {
                scene.createRadialBurstAt(unit.x, unit.y, burstColor, 84, 10, 1310);
            }
            if (scene.playScreenPulse) {
                scene.playScreenPulse(burstColor, 0.18, 180);
            }
            if (scene.shakeCamera) {
                scene.shakeCamera(150, 0.0045);
            }

            onComplete();
        };

        switch(charId) {
            case 'saber_artoria':
                this.playExcaliburCinematic(scene, unit, noble, finish);
                break;
            case 'archer_emiya':
                this.playUBW(scene, unit, noble, finish);
                break;
            case 'caster_helewei':
                this.playHelewei(scene, unit, noble, finish);
                break;
            case 'berserker_lancelot':
                this.playArondight(scene, unit, noble, finish);
                break;
            case 'lancer_hanxin':
                this.playHanxin(scene, unit, noble, finish);
                break;
            case 'lancer_cu':
                this.playGaeBolg(scene, unit, noble, finish);
                break;
            case 'caster_medea':
                this.playRuleBreaker(scene, unit, noble, finish);
                break;
            case 'berserker_herc':
                this.playNineLives(scene, unit, noble, finish);
                break;
            case 'assassin_hassan':
                this.playZabaniya(scene, unit, noble, finish);
                break;
            case 'mooncell_mizuki':
                this.playMoonFlowers(scene, unit, noble, finish);
                break;
            default:
                this.playDefault(scene, unit, noble, finish);
                break;
        }
    },

    // 阿尔托莉雅 - 誓约胜利之剑
    playExcalibur(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2;
        const animContainer = scene.add.container(0, 0).setDepth(2000);
        
        // 深蓝黑幕
        const overlay = scene.add.rectangle(centerX, centerY, W + 100, H + 100, 0x000520, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.95, duration: 300 });
        
        // 头像
        let portrait = scene.textures.exists('saber_artoria') 
            ? scene.add.image(centerX - 180, centerY, 'saber_artoria').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 70, 0x3498db);
        portrait.setAlpha(0).setScale(0.5);
        animContainer.add(portrait);
        
        // 文字
        const charName = scene.add.text(centerX + 30, centerY - 60, '阿尔托莉雅', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, { fontSize: '28px', fill: '#ffd700', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 50, '— 約束された勝利の剣 —', { fontSize: '14px', fill: '#87ceeb' }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);

        // 金色光柱从下方升起
        const pillars = [];
        for (let i = 0; i < 8; i++) {
            const x = 50 + i * 95;
            const pillar = scene.add.rectangle(x, H + 100, 30, 0, 0xffd700, 0.8);
            pillar.setStrokeStyle(2, 0xffffff);
            animContainer.add(pillar);
            pillars.push(pillar);
        }
        
        // 金色星星粒子
        const stars = [];
        for (let i = 0; i < 50; i++) {
            const star = scene.add.star(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 5, 3, 8, 0xffd700, 0);
            animContainer.add(star);
            stars.push(star);
        }
        
        // 圣剑形状 - 在中央显示
        const swordGlow = scene.add.rectangle(centerX, centerY + 150, 15, 200, 0xffd700, 0);
        swordGlow.setStrokeStyle(3, 0xffffff);
        animContainer.add(swordGlow);
        
        // 能量聚集粒子
        const energyParticles = [];
        for (let i = 0; i < 25; i++) {
            const angle = (i / 25) * Math.PI * 2;
            const dist = 200;
            const p = scene.add.circle(centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist, 6, 0xffd700, 0);
            animContainer.add(p);
            energyParticles.push(p);
        }

        const haloRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(centerX, centerY + 150, 42 + i * 28, 0xffffff, 0);
            ring.setStrokeStyle(3 - i * 0.5, i === 1 ? 0xfff0b3 : 0xffd700);
            ring.setAlpha(0);
            animContainer.add(ring);
            haloRings.push(ring);
        }

        const crestLines = [];
        for (let i = 0; i < 12; i++) {
            const line = scene.add.rectangle(centerX, centerY + 150, 190, 3, i % 2 === 0 ? 0xfff0b3 : 0xffd700, 0);
            line.setRotation((i / 12) * Math.PI * 2);
            animContainer.add(line);
            crestLines.push(line);
        }

        const lightShards = [];
        for (let i = 0; i < 18; i++) {
            const shard = scene.add.rectangle(
                centerX + Phaser.Math.Between(-40, 40),
                centerY + 150 + Phaser.Math.Between(-40, 40),
                Phaser.Math.Between(5, 10),
                Phaser.Math.Between(28, 80),
                i % 2 === 0 ? 0xffd700 : 0xfff6cc,
                0
            );
            shard.setRotation(Phaser.Math.FloatBetween(-0.8, 0.8));
            animContainer.add(shard);
            lightShards.push(shard);
        }
        
        if (typeof audioManager !== 'undefined') audioManager.playNoble();
        
        scene.time.delayedCall(200, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 300 });
        });
        
        scene.time.delayedCall(500, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 300 });
            
            // 圣剑发光
            scene.tweens.add({ targets: swordGlow, fillAlpha: 0.9, duration: 300 });
            scene.tweens.add({ targets: swordGlow, scaleX: 1.5, scaleY: 1.2, duration: 600, yoyo: true, repeat: 2 });
            haloRings.forEach((ring, i) => {
                scene.tweens.add({
                    targets: ring,
                    alpha: 0.72 - i * 0.12,
                    scaleX: { from: 0.62, to: 1.08 + i * 0.1 },
                    scaleY: { from: 0.62, to: 1.08 + i * 0.1 },
                    duration: 780 + i * 120,
                    yoyo: true,
                    repeat: 1
                });
            });

            crestLines.forEach((line, i) => {
                scene.tweens.add({
                    targets: line,
                    alpha: 0.42,
                    rotation: line.rotation + (i % 2 === 0 ? 0.22 : -0.22),
                    duration: 520,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: 1
                });
            });

            lightShards.forEach((shard, i) => {
                scene.tweens.add({
                    targets: shard,
                    alpha: 0.78,
                    x: centerX + Phaser.Math.Between(-180, 180),
                    y: centerY + 150 + Phaser.Math.Between(-120, 120),
                    duration: 620,
                    delay: i * 18,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Quad.easeOut'
                });
            });
            
            // 能量粒子向中心聚集
            energyParticles.forEach((p, i) => {
                scene.tweens.add({
                    targets: p,
                    alpha: 1,
                    x: centerX,
                    y: centerY + 150,
                    scale: 0.5,
                    duration: 800,
                    delay: i * 30,
                    ease: 'Power2'
                });
            });
            
            // 光柱升起
            pillars.forEach((p, i) => {
                scene.tweens.add({ targets: p, height: H + 200, y: centerY, duration: 600, delay: i * 60, ease: 'Power2' });
            });
            
            // 星星闪烁
            stars.forEach((s, i) => {
                scene.tweens.add({ targets: s, alpha: 0.9, scale: { from: 0.5, to: 1.5 }, rotation: Math.PI, duration: 400, delay: i * 15, yoyo: true, repeat: 2 });
            });
        });
        
        scene.time.delayedCall(1500, () => {
            // 圣剑光束 - 金色横扫，更大更亮
            const beam = scene.add.rectangle(-100, centerY, 120, 80, 0xffd700, 1);
            beam.setStrokeStyle(6, 0xffffff);
            animContainer.add(beam);

            const beamCore = scene.add.rectangle(-120, centerY, 160, 30, 0xffffff, 0.95);
            animContainer.add(beamCore);

            const beamHalo = scene.add.rectangle(-120, centerY, 240, 110, 0xffd700, 0.22);
            beamHalo.setStrokeStyle(3, 0xfff6cc, 0.65);
            animContainer.add(beamHalo);
            
            // 光束拖尾
            const trail = scene.add.rectangle(-100, centerY, 200, 60, 0xffaa00, 0.6);
            animContainer.add(trail);
            
            scene.tweens.add({ targets: trail, x: W + 100, duration: 350, ease: 'Power2' });
            scene.tweens.add({ targets: beamCore, x: W + 120, width: 520, duration: 260, ease: 'Power3' });
            scene.tweens.add({ targets: beamHalo, x: W + 120, width: 680, alpha: 0, duration: 320, ease: 'Power3' });
            scene.tweens.add({
                targets: beam, x: W + 100, width: 400, duration: 300, ease: 'Power3',
                onComplete: () => {
                    const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, 0xffd700, 0);
                    animContainer.add(flash);
                    scene.tweens.add({
                        targets: flash, fillAlpha: 1, duration: 100, yoyo: true,
                        onComplete: () => {
                            // 先瞬间变色（动画效果），然后设置持续灼烧（按回合计算）
                            if (scene.map && unit.data) this.applyBurnEffect(scene, unit.data.x, unit.data.y);
                            scene.tweens.add({ targets: animContainer.list, alpha: 0, duration: 300, onComplete: () => { animContainer.destroy(); onComplete(); } });
                        }
                    });
                }
            });
        });
    },

    // 灼烧效果 - 瞬间变色后持续按回合计算
    applyBurnEffect(scene, startX, startY) {
        if (!scene.map) return;
        
        // 先做瞬间闪烁效果
        for (let x = startX; x < GAME_CONFIG.mapWidth; x++) {
            for (let dy = -1; dy <= 1; dy++) {
                const y = startY + dy;
                if (y >= 0 && y < GAME_CONFIG.mapHeight && scene.map[y] && scene.map[y][x]) {
                    const tile = scene.map[y][x].tile;
                    // 瞬间变白金色
                    scene.tweens.add({ 
                        targets: tile, 
                        fillColor: 0xfffacd, 
                        duration: 100, 
                        delay: (x - startX) * 20,
                        onComplete: () => {
                            // 然后变成橙红色灼烧
                            scene.tweens.add({ targets: tile, fillColor: 0xff4500, duration: 200 });
                        }
                    });
                    
                    // 标记为灼烧状态（按回合计算）
                    if (!scene.map[y][x].burnTurns) {
                        scene.map[y][x].burnTurns = 3;  // 持续3回合
                        scene.map[y][x].originalColor = scene.map[y][x].originalColor || tile.fillColor;
                    }
                }
            }
        }
    },

    // 卫宫 - 无限剑制
    playUBW(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2 - 50;
        const animContainer = scene.add.container(0, 0).setDepth(2000);
        
        // 红黑背景
        const overlay = scene.add.rectangle(centerX, centerY, W + 100, H + 100, 0x1a0505, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.95, duration: 300 });
        
        // 头像
        let portrait = scene.textures.exists('archer_emiya')
            ? scene.add.image(centerX - 180, centerY, 'archer_emiya').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 70, 0xe74c3c);
        portrait.setAlpha(0).setScale(0.5);
        animContainer.add(portrait);
        
        // 文字
        const charName = scene.add.text(centerX + 30, centerY - 60, '卫宫', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, { fontSize: '28px', fill: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 50, '— I am the bone of my sword —', { fontSize: '12px', fill: '#aaa' }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);
        
        // 齿轮
        const gears = [];
        const gearPositions = [{x: 100, y: 100, r: 60}, {x: W-120, y: 150, r: 50}, {x: 150, y: H-100, r: 45}, {x: W-100, y: H-80, r: 55}, {x: centerX, y: 80, r: 40}];
        gearPositions.forEach(pos => {
            const outer = scene.add.circle(pos.x, pos.y, pos.r, 0x8b4513, 0);
            outer.setStrokeStyle(4, 0xcd853f);
            const inner = scene.add.circle(pos.x, pos.y, pos.r * 0.4, 0x1a0505, 0);
            inner.setStrokeStyle(3, 0xcd853f);
            const teeth = [];
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const tooth = scene.add.rectangle(pos.x + Math.cos(angle) * pos.r, pos.y + Math.sin(angle) * pos.r, 12, 20, 0xcd853f, 0);
                tooth.setRotation(angle + Math.PI/2);
                teeth.push(tooth);
                animContainer.add(tooth);
            }
            animContainer.add(outer);
            animContainer.add(inner);
            gears.push({ outer, inner, teeth });
        });
        
        // 武器图片做剑雨 - 使用抠好图的武器
        const weaponKeys = ['weapon_nobg_1', 'weapon_nobg_2', 'weapon_nobg_3'];
        const swords = [];
        for (let i = 0; i < 45; i++) {
            const x = Phaser.Math.Between(20, W - 20);
            const weaponKey = weaponKeys[i % 3];
            let sword;
            
            if (scene.textures.exists(weaponKey)) {
                sword = scene.add.image(x, -100 - Phaser.Math.Between(0, 250), weaponKey);
                sword.setDisplaySize(70, 70);  // 更大的武器
                // 武器图片是斜的（刀尖朝左），旋转约90度（顺时针）让刀尖朝下
                // Math.PI/2 = 90度顺时针
                sword.setRotation(Math.PI / 2 + Phaser.Math.FloatBetween(-0.2, 0.2));
            } else {
                // 备用：矩形剑
                sword = scene.add.rectangle(x, -100, 8, 70, 0xc0c0c0, 0);
                sword.setStrokeStyle(1, 0xffffff);
                sword.setRotation(0);
            }
            sword.setAlpha(0);
            animContainer.add(sword);
            swords.push(sword);
        }

        const horizonBands = [];
        for (let i = 0; i < 6; i++) {
            const band = scene.add.rectangle(centerX, 90 + i * 68, W + 120, 10, i % 2 === 0 ? 0x8b2e1f : 0xd35400, 0);
            band.setDepth(1995);
            animContainer.add(band);
            horizonBands.push(band);
        }

        const embers = [];
        for (let i = 0; i < 32; i++) {
            const ember = scene.add.circle(
                Phaser.Math.Between(40, W - 40),
                H + Phaser.Math.Between(10, 80),
                Phaser.Math.Between(3, 7),
                i % 2 === 0 ? 0xe67e22 : 0xf1c40f,
                0
            );
            animContainer.add(ember);
            embers.push(ember);
        }

        const forgeSlashes = [];
        [-0.78, 0.78].forEach(angle => {
            const slash = scene.add.rectangle(centerX, centerY + 20, W * 0.7, 16, 0xfff1c1, 0);
            slash.setRotation(angle);
            animContainer.add(slash);
            forgeSlashes.push(slash);
        });
        
        if (typeof audioManager !== 'undefined') audioManager.playNoble();
        
        scene.time.delayedCall(200, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 300 });
            
            // 齿轮出现并旋转
            gears.forEach((g, i) => {
                scene.tweens.add({ targets: [g.outer, g.inner], fillAlpha: 0.5, duration: 400, delay: i * 100 });
                g.teeth.forEach(t => scene.tweens.add({ targets: t, fillAlpha: 0.8, duration: 400, delay: i * 100 }));
                scene.tweens.add({ targets: g.outer, rotation: Math.PI * 2, duration: 4000, repeat: -1 });
                scene.tweens.add({ targets: g.inner, rotation: -Math.PI * 2, duration: 3000, repeat: -1 });
            });

            horizonBands.forEach((band, i) => {
                scene.tweens.add({
                    targets: band,
                    alpha: 0.3,
                    scaleX: { from: 0.92, to: 1.05 },
                    duration: 900,
                    delay: i * 60,
                    yoyo: true,
                    repeat: 1
                });
            });

            embers.forEach((ember, i) => {
                scene.tweens.add({
                    targets: ember,
                    alpha: 0.85,
                    y: Phaser.Math.Between(60, H - 120),
                    x: ember.x + Phaser.Math.Between(-60, 60),
                    scale: { from: 0.7, to: 1.8 },
                    duration: 1200 + Phaser.Math.Between(0, 400),
                    delay: i * 25,
                    ease: 'Sine.easeOut'
                });
            });

        });
        
        scene.time.delayedCall(600, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 300 });

            forgeSlashes.forEach((slash, i) => {
                scene.tweens.add({
                    targets: slash,
                    alpha: 0.42,
                    scaleX: { from: 0.45, to: 1 },
                    duration: 420,
                    delay: i * 90,
                    yoyo: true,
                    repeat: 1
                });
            });
        });
        
        scene.time.delayedCall(900, () => {
            // 漫天剑雨缓慢落下
            swords.forEach((sword, i) => {
                const delay = Phaser.Math.Between(0, 1000);  // 更长的延迟分散
                const duration = Phaser.Math.Between(1200, 1800);  // 更慢的下落
                scene.tweens.add({ 
                    targets: sword, 
                    alpha: 1, 
                    y: H + 120,
                    rotation: sword.rotation + Phaser.Math.FloatBetween(-0.05, 0.05),  // 轻微摆动
                    duration: duration, 
                    delay: delay, 
                    ease: 'Sine.easeIn'  // 更自然的加速
                });
            });
        });
        
        scene.time.delayedCall(2800, () => {
            const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, 0xe74c3c, 0);
            animContainer.add(flash);
            scene.tweens.add({
                targets: flash, fillAlpha: 0.8, duration: 100, yoyo: true,
                onComplete: () => {
                    scene.tweens.add({ targets: animContainer.list, alpha: 0, duration: 300, onComplete: () => { animContainer.destroy(); onComplete(); } });
                }
            });
        });
    },

    // 何乐为 - 何乐不为
    playHelewei(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2;
        const animContainer = scene.add.container(0, 0).setDepth(2000);
        
        // 紫色背景
        const overlay = scene.add.rectangle(centerX, centerY, W + 100, H + 100, 0x150520, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.95, duration: 300 });
        
        // 头像
        let portrait = scene.textures.exists('caster_helewei')
            ? scene.add.image(centerX - 180, centerY, 'caster_helewei').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 70, 0x9b59b6);
        portrait.setAlpha(0).setScale(0.5);
        animContainer.add(portrait);
        
        // 文字
        const charName = scene.add.text(centerX + 30, centerY - 60, '何乐为', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, { fontSize: '24px', fill: '#9b59b6', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 50, '— 有何不为 —', { fontSize: '16px', fill: '#e91e63' }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);
        
        // 魔法阵 - 多层旋转圆环
        const magicCircles = [];
        const circleColors = [0x9b59b6, 0xe91e63, 0xff69b4];
        for (let i = 0; i < 3; i++) {
            const radius = 80 + i * 50;
            const circle = scene.add.circle(centerX, centerY + 30, radius, 0x000000, 0);
            circle.setStrokeStyle(3, circleColors[i]);
            circle.setAlpha(0);
            animContainer.add(circle);
            magicCircles.push(circle);
        }
        
        // 五角星
        const star = scene.add.star(centerX, centerY + 30, 5, 40, 100, 0xe91e63, 0);
        star.setStrokeStyle(2, 0xff69b4);
        star.setAlpha(0);
        animContainer.add(star);
        
        // 能量粒子
        const particles = [];
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            const dist = 150;
            const p = scene.add.circle(
                centerX + Math.cos(angle) * dist, 
                centerY + 30 + Math.sin(angle) * dist, 
                Phaser.Math.Between(4, 10), 
                Phaser.Math.Between(0, 1) ? 0x9b59b6 : 0xe91e63, 0
            );
            animContainer.add(p);
            particles.push(p);
        }
        
        // 玫瑰花瓣
        const petals = [];
        for (let i = 0; i < 40; i++) {
            const petal = scene.add.ellipse(Phaser.Math.Between(0, W), -30, 14, 22, 0xe91e63, 0);
            petal.setStrokeStyle(1, 0xff69b4);
            animContainer.add(petal);
            petals.push(petal);
        }

        const poisonMists = [];
        for (let i = 0; i < 6; i++) {
            const mist = scene.add.ellipse(
                centerX + Phaser.Math.Between(-120, 120),
                centerY + 40 + Phaser.Math.Between(-60, 60),
                Phaser.Math.Between(120, 180),
                Phaser.Math.Between(46, 70),
                i % 2 === 0 ? 0x9b59b6 : 0xe91e63,
                0
            );
            mist.setRotation(Phaser.Math.FloatBetween(-0.4, 0.4));
            animContainer.add(mist);
            poisonMists.push(mist);
        }

        const thornChains = [];
        const chainSources = [
            { x: -80, y: centerY - 80, angle: 0.24 },
            { x: W + 80, y: centerY - 20, angle: Math.PI - 0.18 },
            { x: centerX - 30, y: H + 80, angle: -Math.PI / 2 }
        ];
        chainSources.forEach((source, i) => {
            const chain = scene.add.rectangle(source.x, source.y, 220, 6, 0xff69b4, 0);
            chain.setRotation(source.angle);
            chain.setStrokeStyle(2, i % 2 === 0 ? 0x9b59b6 : 0xe91e63, 0.9);
            animContainer.add(chain);
            thornChains.push(chain);
        });
        
        if (typeof audioManager !== 'undefined') audioManager.playNoble();
        
        scene.time.delayedCall(200, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 300 });
        });
        
        scene.time.delayedCall(500, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 300 });
            
            // 魔法阵出现并旋转
            magicCircles.forEach((c, i) => {
                scene.tweens.add({ targets: c, alpha: 0.8, duration: 400, delay: i * 100 });
                scene.tweens.add({ 
                    targets: c, 
                    rotation: (i % 2 === 0 ? 1 : -1) * Math.PI * 2, 
                    duration: 3000 - i * 500, 
                    repeat: -1 
                });
            });
            
            // 五角星出现并旋转
            scene.tweens.add({ targets: star, alpha: 0.9, scale: { from: 0.5, to: 1 }, duration: 500 });
            scene.tweens.add({ targets: star, rotation: -Math.PI * 2, duration: 4000, repeat: -1 });
            poisonMists.forEach((mist, i) => {
                scene.tweens.add({
                    targets: mist,
                    alpha: 0.2 + i * 0.04,
                    scaleX: { from: 0.86, to: 1.16 },
                    scaleY: { from: 0.7, to: 1.08 },
                    duration: 1200,
                    delay: i * 70,
                    yoyo: true,
                    repeat: 1
                });
            });

            thornChains.forEach((chain, i) => {
                scene.tweens.add({
                    targets: chain,
                    alpha: 0.72,
                    scaleX: { from: 0.2, to: 1 },
                    duration: 460,
                    delay: i * 90,
                    ease: 'Cubic.easeOut'
                });
            });
        });
        
        scene.time.delayedCall(900, () => {
            // 能量粒子向中心聚集
            particles.forEach((p, i) => {
                scene.tweens.add({
                    targets: p,
                    alpha: 1,
                    x: centerX,
                    y: centerY + 30,
                    scale: 2,
                    duration: 600,
                    delay: i * 15,
                    ease: 'Power2'
                });
            });

            poisonMists.forEach((mist, i) => {
                scene.tweens.add({
                    targets: mist,
                    x: centerX + Phaser.Math.Between(-30, 30),
                    y: centerY + 30 + Phaser.Math.Between(-20, 20),
                    alpha: 0.12,
                    duration: 720,
                    delay: i * 40,
                    ease: 'Sine.easeInOut'
                });
            });
        });
        
        scene.time.delayedCall(1300, () => {
            // 能量爆发
            particles.forEach((p, i) => {
                const angle = (i / 40) * Math.PI * 2;
                const dist = Phaser.Math.Between(200, 350);
                scene.tweens.add({
                    targets: p,
                    x: centerX + Math.cos(angle) * dist,
                    y: centerY + 30 + Math.sin(angle) * dist,
                    scale: 0.3,
                    alpha: 0,
                    duration: 500,
                    delay: i * 10,
                    ease: 'Power3'
                });
            });
            
            // 玫瑰花瓣飘落
            petals.forEach((petal, i) => {
                scene.tweens.add({
                    targets: petal,
                    alpha: 0.9,
                    y: H + 30,
                    x: petal.x + Phaser.Math.Between(-100, 100),
                    rotation: Phaser.Math.FloatBetween(0, Math.PI * 4),
                    duration: 1800,
                    delay: i * 30,
                    ease: 'Sine.easeIn'
                });
            });

            thornChains.forEach((chain, i) => {
                scene.tweens.add({
                    targets: chain,
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.3,
                    duration: 480,
                    delay: i * 80,
                    ease: 'Cubic.easeOut'
                });
            });
        });
        
        scene.time.delayedCall(2000, () => {
            const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, 0x9b59b6, 0);
            animContainer.add(flash);
            scene.tweens.add({
                targets: flash, fillAlpha: 0.8, duration: 100, yoyo: true,
                onComplete: () => {
                    scene.tweens.add({ targets: animContainer.list, alpha: 0, duration: 300, onComplete: () => { animContainer.destroy(); onComplete(); } });
                }
            });
        });
    },

    // 兰斯洛特 - 缚锁全开
    playArondight(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2 + 20;  // 往下移一点
        const animContainer = scene.add.container(0, 0).setDepth(2000);
        
        // 黑红背景
        const overlay = scene.add.rectangle(centerX, centerY, W + 100, H + 100, 0x0a0000, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.95, duration: 300 });
        
        // 头像 - 位置往下调整
        let portrait = scene.textures.exists('berserker_lancelot')
            ? scene.add.image(centerX - 180, centerY, 'berserker_lancelot').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 70, 0x2c3e50);
        portrait.setAlpha(0).setScale(0.5);
        animContainer.add(portrait);
        
        // 文字
        const charName = scene.add.text(centerX + 30, centerY - 60, '兰斯洛特', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, { fontSize: '24px', fill: '#e74c3c', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 50, '— AAAARTHURRR!! —', { fontSize: '16px', fill: '#c0392b' }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);
        
        // 狂暴粒子 - 红黑色圆形
        const rageParticles = [];
        for (let i = 0; i < 40; i++) {
            const color = Phaser.Math.Between(0, 1) ? 0xe74c3c : 0x2c3e50;
            const p = scene.add.circle(centerX, centerY, Phaser.Math.Between(5, 15), color, 0);
            animContainer.add(p);
            rageParticles.push(p);
        }
        
        // 黑色闪电 - 锯齿状线条
        const lightnings = [];
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(50, W - 50);
            const lightning = scene.add.rectangle(x, centerY, 4, H, 0xe74c3c, 0);
            animContainer.add(lightning);
            lightnings.push(lightning);
        }
        
        // 阿隆戴特剑 - 大剑形状
        const swordBlade = scene.add.rectangle(centerX - 250, centerY, 300, 25, 0x4a0000, 0);
        swordBlade.setStrokeStyle(3, 0xe74c3c);
        const swordTip = scene.add.triangle(centerX - 400, centerY, 0, -15, 0, 15, -40, 0, 0x4a0000, 0);
        swordTip.setStrokeStyle(3, 0xe74c3c);
        animContainer.add(swordBlade);
        animContainer.add(swordTip);

        const abyssRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(centerX, centerY, 60 + i * 42, 0x000000, 0);
            ring.setStrokeStyle(3, i === 0 ? 0xe74c3c : 0x2c3e50, 0.95);
            ring.setAlpha(0);
            animContainer.add(ring);
            abyssRings.push(ring);
        }

        const blackFlames = [];
        for (let i = 0; i < 9; i++) {
            const flame = scene.add.triangle(
                70 + i * ((W - 140) / 8),
                H + 20,
                0,
                34,
                12,
                -34,
                -12,
                -10,
                i % 2 === 0 ? 0x2c3e50 : 0xe74c3c,
                0
            );
            animContainer.add(flame);
            blackFlames.push(flame);
        }

        const slashWaves = [];
        for (let i = 0; i < 5; i++) {
            const slash = scene.add.rectangle(centerX - 220 + i * 110, centerY + 10, 180, 8, 0xff6b6b, 0);
            slash.setRotation(-0.6 + i * 0.08);
            animContainer.add(slash);
            slashWaves.push(slash);
        }
        
        if (typeof audioManager !== 'undefined') audioManager.playNoble();
        
        scene.time.delayedCall(200, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 300 });
            
            // 狂暴粒子扩散
            rageParticles.forEach((p, i) => {
                const angle = (i / 40) * Math.PI * 2;
                const dist = Phaser.Math.Between(80, 250);
                scene.tweens.add({
                    targets: p,
                    alpha: 0.8,
                    x: centerX + Math.cos(angle) * dist,
                    y: centerY + Math.sin(angle) * dist,
                    scale: { from: 0.5, to: 2 },
                    duration: 800,
                    delay: i * 15,
                    yoyo: true,
                    repeat: 1
                });
            });
        });
        
        scene.time.delayedCall(600, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 300 });
            
            // 闪电闪烁
            lightnings.forEach((l, i) => {
                scene.tweens.add({
                    targets: l,
                    alpha: { from: 0, to: 1 },
                    duration: 50,
                    delay: i * 120,
                    yoyo: true,
                    repeat: 4
                });
            });

            blackFlames.forEach((flame, i) => {
                scene.tweens.add({
                    targets: flame,
                    alpha: 0.82,
                    y: H - 80,
                    scaleY: { from: 0.6, to: 1.5 },
                    duration: 520,
                    delay: i * 45,
                    yoyo: true,
                    repeat: 1
                });
            });

            abyssRings.forEach((ring, i) => {
                scene.tweens.add({
                    targets: ring,
                    alpha: 0.7 - i * 0.14,
                    scaleX: { from: 0.7, to: 1.18 + i * 0.08 },
                    scaleY: { from: 0.7, to: 1.18 + i * 0.08 },
                    duration: 620 + i * 100,
                    yoyo: true,
                    repeat: 1
                });
            });
        });
        
        scene.time.delayedCall(1300, () => {
            // 阿隆戴特剑光斜劈
            scene.tweens.add({ targets: [swordBlade, swordTip], alpha: 1, duration: 100 });
            slashWaves.forEach((slash, i) => {
                scene.tweens.add({
                    targets: slash,
                    alpha: 0.82,
                    x: slash.x + 170,
                    scaleX: 1.5,
                    duration: 260,
                    delay: i * 35,
                    ease: 'Cubic.easeOut',
                    yoyo: true,
                    repeat: 1
                });
            });
            scene.tweens.add({
                targets: swordBlade,
                x: centerX + 250,
                rotation: -0.5,
                duration: 200,
                ease: 'Power3'
            });
            scene.tweens.add({
                targets: swordTip,
                x: centerX - 100,
                rotation: -0.5,
                duration: 200,
                ease: 'Power3',
                onComplete: () => {
                    // 红色闪光
                    const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, 0xe74c3c, 0);
                    animContainer.add(flash);
                    scene.tweens.add({
                        targets: flash, fillAlpha: 0.9, duration: 100, yoyo: true,
                        onComplete: () => {
                            scene.tweens.add({ targets: animContainer.list, alpha: 0, duration: 300, onComplete: () => { animContainer.destroy(); onComplete(); } });
                        }
                    });
                }
            });
        });
    },

    // 默认宝具动画
    playHanxin(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2;
        const primaryColor = 0x63e6be;
        const accentColor = 0xf6d365;
        const animContainer = scene.add.container(0, 0).setDepth(2000);

        const overlay = scene.add.rectangle(centerX, centerY, W + 100, H + 100, 0x04151a, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.94, duration: 320 });

        let portrait = scene.textures.exists('lancer_hanxin')
            ? scene.add.image(centerX - 180, centerY, 'lancer_hanxin').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 70, primaryColor);
        portrait.setAlpha(0).setScale(0.5);
        animContainer.add(portrait);

        const charName = scene.add.text(centerX + 30, centerY - 62, unit.data.name, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, {
            fontSize: '28px',
            fill: '#63e6be',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 50, 'Array the ranks.', {
            fontSize: '14px',
            fill: '#f6d365'
        }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);

        const lanes = [];
        for (let i = 0; i < 5; i++) {
            const lane = scene.add.rectangle(centerX, centerY - 120 + i * 60, W - 90, 6, primaryColor, 0.18).setAlpha(0);
            lane.setStrokeStyle(2, accentColor, 0.72);
            animContainer.add(lane);
            lanes.push(lane);
        }

        const sigils = [];
        [
            { x: centerX - 30, y: centerY - 120, size: 32 },
            { x: centerX + 140, y: centerY - 90, size: 26 },
            { x: centerX - 110, y: centerY - 10, size: 22 },
            { x: centerX + 80, y: centerY + 36, size: 28 },
            { x: centerX - 40, y: centerY + 110, size: 34 }
        ].forEach(({ x, y, size }) => {
            const diamond = scene.add.rectangle(x, y, size, size, primaryColor, 0.08).setRotation(Math.PI / 4).setAlpha(0);
            diamond.setStrokeStyle(2, primaryColor, 0.9);
            const horizontal = scene.add.rectangle(x, y, size * 1.35, 2, accentColor, 0.8).setAlpha(0);
            const vertical = scene.add.rectangle(x, y, 2, size * 1.35, accentColor, 0.58).setAlpha(0);
            const core = scene.add.circle(x, y, 4, accentColor, 0.92).setAlpha(0);
            animContainer.add([diamond, horizontal, vertical, core]);
            sigils.push(diamond, horizontal, vertical, core);
        });

        const banners = [];
        for (let i = 0; i < 4; i++) {
            const baseX = 70 + i * ((W - 140) / 3);
            const pole = scene.add.rectangle(baseX, H + 80, 4, 130, 0xc39b4a, 0).setAlpha(0);
            const flag = scene.add.triangle(baseX + 26, H + 20, 0, 0, 54, 16, 0, 32, primaryColor, 0).setAlpha(0);
            flag.setStrokeStyle(2, accentColor, 0.85);
            animContainer.add([pole, flag]);
            banners.push({ pole, flag });
        }

        const spears = [];
        for (let i = 0; i < 9; i++) {
            const x = 36 + i * ((W - 72) / 8);
            const shaft = scene.add.rectangle(x, H + 120, 6, 150, accentColor, 0).setAlpha(0);
            const blade = scene.add.triangle(x, H + 32, 0, 0, 9, 28, -9, 28, primaryColor, 0).setAlpha(0);
            animContainer.add([shaft, blade]);
            spears.push({ shaft, blade });
        }

        const commandRings = [];
        for (let i = 0; i < 2; i++) {
            const ring = scene.add.circle(centerX, centerY + 10, 90 + i * 36, 0x000000, 0);
            ring.setStrokeStyle(3, i === 0 ? primaryColor : accentColor, 0.85);
            ring.setAlpha(0);
            animContainer.add(ring);
            commandRings.push(ring);
        }

        const arrowFlights = [];
        for (let i = 0; i < 14; i++) {
            const arrow = scene.add.container(-120 - i * 26, centerY - 120 + (i % 7) * 34).setDepth(2011);
            const shaft = scene.add.rectangle(0, 0, 44, 3, accentColor, 0.9);
            const tip = scene.add.triangle(24, 0, 0, -6, 0, 6, 12, 0, primaryColor, 0.95);
            arrow.add([shaft, tip]);
            arrow.setAlpha(0);
            animContainer.add(arrow);
            arrowFlights.push(arrow);
        }

        if (typeof audioManager !== 'undefined') audioManager.playNoble();

        scene.time.delayedCall(200, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 320 });

            lanes.forEach((lane, i) => {
                lane.setScaleX(0.22);
                scene.tweens.add({
                    targets: lane,
                    alpha: 0.72,
                    scaleX: 1,
                    duration: 520,
                    delay: i * 60,
                    ease: 'Cubic.easeOut'
                });
            });
        });

        scene.time.delayedCall(560, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 260 });

            commandRings.forEach((ring, i) => {
                scene.tweens.add({
                    targets: ring,
                    alpha: 0.78 - i * 0.12,
                    scaleX: { from: 0.7, to: 1.08 + i * 0.08 },
                    scaleY: { from: 0.7, to: 1.08 + i * 0.08 },
                    duration: 760 + i * 120,
                    yoyo: true,
                    repeat: 1
                });
            });

            sigils.forEach((part, i) => {
                scene.tweens.add({
                    targets: part,
                    alpha: 0.95,
                    scaleX: { from: 0.7, to: 1.15 },
                    scaleY: { from: 0.7, to: 1.15 },
                    duration: 360,
                    delay: i * 28,
                    yoyo: true,
                    repeat: 1
                });
            });

        });

        scene.time.delayedCall(960, () => {
            banners.forEach((banner, i) => {
                scene.tweens.add({
                    targets: banner.pole,
                    alpha: 0.95,
                    y: H - 150,
                    duration: 440,
                    delay: i * 70,
                    ease: 'Cubic.easeOut'
                });
                scene.tweens.add({
                    targets: banner.flag,
                    alpha: 0.92,
                    y: H - 190,
                    duration: 440,
                    delay: i * 70,
                    ease: 'Cubic.easeOut'
                });
            });

            spears.forEach((spear, i) => {
                scene.tweens.add({
                    targets: spear.shaft,
                    alpha: 0.9,
                    y: H - 100,
                    duration: 320,
                    delay: i * 36,
                    ease: 'Cubic.easeOut'
                });
                scene.tweens.add({
                    targets: spear.blade,
                    alpha: 0.92,
                    y: H - 172,
                    duration: 320,
                    delay: i * 36,
                    ease: 'Cubic.easeOut'
                });
            });
        });

        scene.time.delayedCall(1460, () => {
            lanes.forEach((lane, i) => {
                const wave = scene.add.rectangle(-120, lane.y, 160, 16, accentColor, 0.26);
                wave.setStrokeStyle(2, primaryColor, 0.88);
                wave.setDepth(2010);
                animContainer.add(wave);

                scene.tweens.add({
                    targets: wave,
                    x: W + 120,
                    scaleX: 2.4,
                    alpha: 0,
                    duration: 360,
                    delay: i * 55,
                    ease: 'Cubic.easeOut',
                    onComplete: () => wave.destroy()
                });
            });

            arrowFlights.forEach((arrow, i) => {
                scene.tweens.add({
                    targets: arrow,
                    alpha: 1,
                    x: W + 140,
                    duration: 260,
                    delay: i * 26,
                    ease: 'Cubic.easeIn',
                    onComplete: () => arrow.destroy()
                });
            });

            const thrust = scene.add.rectangle(-140, centerY, 220, 26, primaryColor, 0.3);
            thrust.setStrokeStyle(3, accentColor, 0.95);
            thrust.setDepth(2012);
            animContainer.add(thrust);

            scene.tweens.add({
                targets: thrust,
                x: W + 160,
                scaleX: 3.2,
                alpha: 0,
                duration: 380,
                ease: 'Cubic.easeIn',
                onComplete: () => thrust.destroy()
            });
        });

        scene.time.delayedCall(1860, () => {
            const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, accentColor, 0);
            animContainer.add(flash);
            scene.tweens.add({
                targets: flash,
                fillAlpha: 0.88,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    scene.tweens.add({
                        targets: animContainer.list,
                        alpha: 0,
                        duration: 320,
                        onComplete: () => {
                            animContainer.destroy();
                            onComplete();
                        }
                    });
                }
            });
        });
    },

    playExcaliburCinematic(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2;
        const bladeX = centerX + 84;
        const bladeY = centerY + 24;
        const sigilY = centerY + 150;
        const gold = 0xffd700;
        const warmGold = 0xffefb0;
        const blueGold = 0x9ad9ff;
        const animContainer = scene.add.container(0, 0).setDepth(2000);

        const overlay = scene.add.rectangle(centerX, centerY, W + 160, H + 160, 0x02081d, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.97, duration: 260 });

        const topBar = scene.add.rectangle(centerX, -34, W + 160, 68, 0x04112d, 0.98);
        const bottomBar = scene.add.rectangle(centerX, H + 34, W + 160, 68, 0x04112d, 0.98);
        animContainer.add([topBar, bottomBar]);

        const sideVeil = scene.add.rectangle(-180, centerY, W * 0.58, H + 120, 0x09193e, 0.72);
        sideVeil.setRotation(-0.2);
        animContainer.add(sideVeil);

        const slashBands = [];
        for (let i = 0; i < 4; i++) {
            const band = scene.add.rectangle(
                centerX - 260 + i * 160,
                centerY - 110 + i * 72,
                W + 220,
                34 + i * 6,
                i % 2 === 0 ? gold : blueGold,
                0
            );
            band.setRotation(-0.42);
            animContainer.add(band);
            slashBands.push(band);
        }

        const portraitHalo = scene.add.circle(centerX - 190, centerY - 6, 116, 0xfff2b3, 0);
        portraitHalo.setStrokeStyle(4, gold, 0.86);
        const portraitFrame = scene.add.circle(centerX - 190, centerY - 6, 98, 0x0e183d, 0.92);
        portraitFrame.setStrokeStyle(3, warmGold, 0.92);
        let portrait = scene.textures.exists('saber_artoria')
            ? scene.add.image(centerX - 190, centerY - 6, 'saber_artoria').setDisplaySize(188, 188)
            : scene.add.circle(centerX - 190, centerY - 6, 76, 0x3c6eea);
        portraitHalo.setAlpha(0).setScale(0.72);
        portraitFrame.setAlpha(0).setScale(0.72);
        portrait.setAlpha(0).setScale(0.7);
        animContainer.add([portraitHalo, portraitFrame, portrait]);

        const charName = scene.add.text(centerX + 28, centerY - 76, unit.data.name, {
            fontSize: '26px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 28, centerY - 20, noble.name, {
            fontSize: '30px',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setAlpha(0).setScale(0.72);
        const releaseText = scene.add.text(centerX + 28, centerY + 36, 'The promised victory.', {
            fontSize: '16px',
            fill: '#9ad9ff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);

        const pillars = [];
        for (let i = 0; i < 6; i++) {
            const x = 70 + i * ((W - 140) / 5);
            const pillar = scene.add.rectangle(x, H + 140, 42, 0, i % 2 === 0 ? gold : warmGold, 0.26);
            pillar.setStrokeStyle(2, 0xffffff, 0.75);
            animContainer.add(pillar);
            pillars.push(pillar);
        }

        const floorRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(bladeX, sigilY, 42 + i * 30, 0x000000, 0);
            ring.setStrokeStyle(4 - i, i === 1 ? warmGold : gold, 0.88);
            ring.setAlpha(0);
            animContainer.add(ring);
            floorRings.push(ring);
        }

        const sigilSpokes = [];
        for (let i = 0; i < 16; i++) {
            const spoke = scene.add.rectangle(bladeX, sigilY, 210, 4, i % 2 === 0 ? gold : warmGold, 0);
            spoke.setRotation((i / 16) * Math.PI * 2);
            animContainer.add(spoke);
            sigilSpokes.push(spoke);
        }

        const convergenceLines = [];
        for (let i = 0; i < 14; i++) {
            const line = scene.add.rectangle(
                Phaser.Math.Between(20, W - 20),
                Phaser.Math.Between(20, H - 20),
                Phaser.Math.Between(120, 240),
                3,
                i % 3 === 0 ? blueGold : gold,
                0
            );
            line.setRotation(Phaser.Math.Angle.Between(line.x, line.y, bladeX, bladeY));
            animContainer.add(line);
            convergenceLines.push(line);
        }

        const motes = [];
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const dist = 170 + (i % 5) * 18;
            const mote = scene.add.circle(
                bladeX + Math.cos(angle) * dist,
                sigilY + Math.sin(angle) * dist,
                4 + (i % 3),
                i % 2 === 0 ? gold : warmGold,
                0
            );
            animContainer.add(mote);
            motes.push(mote);
        }

        const crownShards = [];
        for (let i = 0; i < 14; i++) {
            const shard = scene.add.rectangle(
                bladeX + Phaser.Math.Between(-30, 30),
                bladeY - 220 + Phaser.Math.Between(-18, 18),
                Phaser.Math.Between(5, 10),
                Phaser.Math.Between(28, 90),
                i % 2 === 0 ? gold : 0xffffff,
                0
            );
            shard.setRotation(Phaser.Math.FloatBetween(-0.9, 0.9));
            animContainer.add(shard);
            crownShards.push(shard);
        }

        const sword = scene.add.container(bladeX, H + 240).setDepth(2010).setAlpha(0);
        const swordHalo = scene.add.rectangle(0, 0, 132, 454, gold, 0.12);
        const swordAura = scene.add.rectangle(0, 0, 74, 430, gold, 0.36);
        const swordCore = scene.add.rectangle(0, 0, 16, 420, 0xffffff, 0.95);
        const swordEdgeL = scene.add.rectangle(-12, 0, 4, 410, warmGold, 0.88);
        const swordEdgeR = scene.add.rectangle(12, 0, 4, 410, warmGold, 0.88);
        const swordGuard = scene.add.rectangle(0, 112, 136, 14, warmGold, 0.96);
        const swordGrip = scene.add.rectangle(0, 162, 24, 92, 0xb67a2a, 1);
        const swordPommel = scene.add.circle(0, 214, 14, warmGold, 0.96);
        const swordTip = scene.add.triangle(0, -226, 0, -42, 15, 0, -15, 0, 0xffffff, 1);
        sword.add([swordHalo, swordAura, swordCore, swordEdgeL, swordEdgeR, swordGuard, swordGrip, swordPommel, swordTip]);
        animContainer.add(sword);

        if (typeof audioManager !== 'undefined') audioManager.playNoble();

        scene.time.delayedCall(140, () => {
            scene.tweens.add({ targets: topBar, y: 24, duration: 240, ease: 'Cubic.easeOut' });
            scene.tweens.add({ targets: bottomBar, y: H - 24, duration: 240, ease: 'Cubic.easeOut' });
            scene.tweens.add({ targets: sideVeil, x: 92, duration: 300, ease: 'Cubic.easeOut' });

            slashBands.forEach((band, i) => {
                scene.tweens.add({
                    targets: band,
                    alpha: 0.18 - i * 0.03,
                    x: band.x + 140,
                    duration: 260,
                    delay: i * 40,
                    yoyo: true,
                    repeat: 1
                });
            });

            scene.tweens.add({ targets: portraitHalo, alpha: 0.72, scale: 1, duration: 420, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: portraitFrame, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 440, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, x: charName.x + 8, duration: 280, ease: 'Quad.easeOut' });
        });

        scene.time.delayedCall(420, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, x: nobleName.x + 8, duration: 360, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, x: releaseText.x + 8, duration: 320, ease: 'Quad.easeOut' });

            scene.tweens.add({
                targets: sword,
                alpha: 1,
                y: bladeY + 8,
                duration: 520,
                ease: 'Back.easeOut'
            });
            scene.tweens.add({
                targets: [swordHalo, swordAura],
                scaleX: 1.45,
                scaleY: 1.08,
                duration: 420,
                yoyo: true,
                repeat: 2
            });

            floorRings.forEach((ring, i) => {
                scene.tweens.add({
                    targets: ring,
                    alpha: 0.86 - i * 0.12,
                    scaleX: { from: 0.58, to: 1.2 + i * 0.08 },
                    scaleY: { from: 0.58, to: 1.2 + i * 0.08 },
                    duration: 760 + i * 120,
                    yoyo: true,
                    repeat: 1
                });
            });

            sigilSpokes.forEach((spoke, i) => {
                scene.tweens.add({
                    targets: spoke,
                    alpha: 0.42,
                    rotation: spoke.rotation + (i % 2 === 0 ? 0.3 : -0.3),
                    duration: 560,
                    yoyo: true,
                    repeat: 1
                });
            });

            convergenceLines.forEach((line, i) => {
                scene.tweens.add({
                    targets: line,
                    alpha: 0.52,
                    x: bladeX,
                    y: bladeY - 30,
                    duration: 360,
                    delay: i * 18,
                    ease: 'Cubic.easeIn',
                    onComplete: () => line.destroy()
                });
            });

            motes.forEach((mote, i) => {
                scene.tweens.add({
                    targets: mote,
                    alpha: 1,
                    x: bladeX + Phaser.Math.Between(-20, 20),
                    y: bladeY + Phaser.Math.Between(-40, 100),
                    scale: 0.45,
                    duration: 620,
                    delay: i * 16,
                    ease: 'Cubic.easeIn'
                });
            });

            pillars.forEach((pillar, i) => {
                scene.tweens.add({
                    targets: pillar,
                    height: H + 180,
                    y: centerY,
                    alpha: 0.42,
                    duration: 520,
                    delay: i * 55,
                    ease: 'Cubic.easeOut'
                });
            });
        });

        scene.time.delayedCall(1120, () => {
            crownShards.forEach((shard, i) => {
                scene.tweens.add({
                    targets: shard,
                    alpha: 0.86,
                    x: bladeX + Phaser.Math.Between(-180, 180),
                    y: bladeY - 230 + Phaser.Math.Between(-100, 60),
                    duration: 420,
                    delay: i * 16,
                    ease: 'Quad.easeOut',
                    yoyo: true,
                    repeat: 1
                });
            });

            const focusFlash = scene.add.rectangle(bladeX, centerY + 10, 240, H + 180, 0xffffff, 0);
            focusFlash.setStrokeStyle(3, warmGold, 0.8);
            animContainer.add(focusFlash);
            scene.tweens.add({
                targets: focusFlash,
                fillAlpha: 0.16,
                scaleX: 1.2,
                duration: 140,
                yoyo: true,
                onComplete: () => focusFlash.destroy()
            });
        });

        scene.time.delayedCall(1540, () => {
            const beam = scene.add.container(-260, bladeY).setDepth(2016);
            const beamHalo = scene.add.rectangle(0, 0, 500, 220, gold, 0.18);
            const beamBody = scene.add.rectangle(0, 0, 430, 116, gold, 0.94);
            const beamCore = scene.add.rectangle(0, 0, 470, 40, 0xffffff, 0.98);
            const beamTop = scene.add.rectangle(0, -72, 450, 6, warmGold, 0.72);
            const beamBottom = scene.add.rectangle(0, 72, 450, 6, warmGold, 0.72);
            const beamWakeA = scene.add.rectangle(-40, -34, 430, 24, gold, 0.24);
            const beamWakeB = scene.add.rectangle(-40, 34, 430, 24, gold, 0.24);
            beam.add([beamHalo, beamBody, beamCore, beamTop, beamBottom, beamWakeA, beamWakeB]);
            animContainer.add(beam);

            const beamTrails = [];
            for (let i = 0; i < 6; i++) {
                const trail = scene.add.rectangle(
                    -240,
                    bladeY - 90 + i * 36,
                    320,
                    10 + i * 2,
                    i % 2 === 0 ? warmGold : gold,
                    0.22
                );
                animContainer.add(trail);
                beamTrails.push(trail);
            }

            scene.tweens.add({
                targets: beam,
                x: W + 300,
                scaleX: 2.25,
                duration: 270,
                ease: 'Cubic.easeOut'
            });
            scene.tweens.add({
                targets: beamHalo,
                alpha: 0,
                scaleY: 1.45,
                duration: 270,
                ease: 'Cubic.easeOut'
            });

            beamTrails.forEach((trail, i) => {
                scene.tweens.add({
                    targets: trail,
                    x: W + 200,
                    scaleX: 2.1,
                    alpha: 0,
                    duration: 300,
                    delay: i * 14,
                    ease: 'Cubic.easeOut',
                    onComplete: () => trail.destroy()
                });
            });

            const worldFlash = scene.add.rectangle(centerX, centerY, W + 240, H + 240, 0xfff4c6, 0);
            animContainer.add(worldFlash);
            scene.tweens.add({
                targets: worldFlash,
                fillAlpha: 1,
                duration: 120,
                yoyo: true,
                onComplete: () => {
                    if (scene.map && unit.data) this.applyBurnEffect(scene, unit.data.x, unit.data.y);
                    scene.tweens.add({
                        targets: animContainer.list,
                        alpha: 0,
                        duration: 320,
                        onComplete: () => {
                            animContainer.destroy();
                            onComplete();
                        }
                    });
                }
            });
        });
    },

    playGaeBolg(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2;
        const crimson = 0xc0392b;
        const ember = 0xff7675;
        const animContainer = scene.add.container(0, 0).setDepth(2000);

        const overlay = scene.add.rectangle(centerX, centerY, W + 120, H + 120, 0x150203, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.94, duration: 260 });

        const portrait = scene.textures.exists('lancer_cu')
            ? scene.add.image(centerX - 180, centerY, 'lancer_cu').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 72, crimson);
        portrait.setAlpha(0).setScale(0.55);
        animContainer.add(portrait);

        const charName = scene.add.text(centerX + 30, centerY - 60, unit.data.name, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, {
            fontSize: '28px',
            fill: '#ff8a80',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 52, 'Gae Bolg.', {
            fontSize: '15px',
            fill: '#ffd0d0'
        }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);

        const runeRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(centerX + 120, centerY, 50 + i * 28, 0x000000, 0);
            ring.setStrokeStyle(3 - i * 0.5, i === 0 ? ember : crimson, 0.88);
            ring.setAlpha(0);
            animContainer.add(ring);
            runeRings.push(ring);
        }

        const runes = [];
        for (let i = 0; i < 12; i++) {
            const line = scene.add.rectangle(centerX + 120, centerY, 96, 3, i % 2 === 0 ? ember : crimson, 0);
            line.setRotation((i / 12) * Math.PI * 2);
            animContainer.add(line);
            runes.push(line);
        }

        const heartOuter = scene.add.rectangle(centerX + 120, centerY, 86, 86, crimson, 0.08).setRotation(Math.PI / 4).setAlpha(0);
        heartOuter.setStrokeStyle(4, ember, 0.9);
        const heartInner = scene.add.rectangle(centerX + 120, centerY, 44, 44, ember, 0.22).setRotation(Math.PI / 4).setAlpha(0);
        animContainer.add([heartOuter, heartInner]);

        const spear = scene.add.container(-180, centerY + 84).setDepth(2010);
        const shaft = scene.add.rectangle(0, 0, 250, 10, 0x6d1b1b, 1);
        const core = scene.add.rectangle(0, 0, 250, 2, 0xffd7d7, 0.8);
        const head = scene.add.triangle(138, 0, 0, -18, 0, 18, 42, 0, ember, 1);
        const tail = scene.add.triangle(-138, 0, 0, -10, 0, 10, -22, 0, crimson, 0.95);
        spear.add([shaft, core, head, tail]);
        spear.setRotation(-0.12).setAlpha(0);
        animContainer.add(spear);

        const streaks = [];
        for (let i = 0; i < 16; i++) {
            const streak = scene.add.rectangle(
                Phaser.Math.Between(40, W - 40),
                Phaser.Math.Between(40, H - 40),
                Phaser.Math.Between(70, 180),
                Phaser.Math.Between(2, 5),
                i % 2 === 0 ? crimson : ember,
                0
            );
            streak.setRotation(Phaser.Math.FloatBetween(-1.0, 1.0));
            animContainer.add(streak);
            streaks.push(streak);
        }

        if (typeof audioManager !== 'undefined') audioManager.playNoble();

        scene.time.delayedCall(180, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 280 });
        });

        scene.time.delayedCall(460, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 360, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 240 });

            runeRings.forEach((ring, i) => {
                scene.tweens.add({
                    targets: ring,
                    alpha: 0.76 - i * 0.12,
                    scaleX: { from: 0.72, to: 1.1 + i * 0.06 },
                    scaleY: { from: 0.72, to: 1.1 + i * 0.06 },
                    rotation: ring.rotation + (i % 2 === 0 ? 0.4 : -0.35),
                    duration: 760 + i * 120,
                    yoyo: true,
                    repeat: 1
                });
            });

            runes.forEach((line, i) => {
                scene.tweens.add({
                    targets: line,
                    alpha: 0.44,
                    rotation: line.rotation + (i % 2 === 0 ? 0.36 : -0.36),
                    duration: 520,
                    yoyo: true,
                    repeat: 1
                });
            });

            scene.tweens.add({ targets: [heartOuter, heartInner], alpha: 1, duration: 220 });
            scene.tweens.add({
                targets: heartOuter,
                scaleX: 1.24,
                scaleY: 1.24,
                duration: 260,
                yoyo: true,
                repeat: 2
            });
            scene.tweens.add({
                targets: heartInner,
                scaleX: 1.35,
                scaleY: 1.35,
                duration: 220,
                yoyo: true,
                repeat: 2
            });
        });

        scene.time.delayedCall(1120, () => {
            streaks.forEach((streak, i) => {
                scene.tweens.add({
                    targets: streak,
                    alpha: 0.8,
                    x: heartOuter.x + Phaser.Math.Between(-20, 20),
                    y: heartOuter.y + Phaser.Math.Between(-20, 20),
                    duration: 260,
                    delay: i * 16,
                    ease: 'Cubic.easeIn',
                    onComplete: () => streak.destroy()
                });
            });

            scene.tweens.add({
                targets: spear,
                alpha: 1,
                x: centerX + 60,
                y: centerY + 10,
                rotation: -0.34,
                duration: 180,
                ease: 'Cubic.easeIn'
            });

            scene.tweens.add({
                targets: spear,
                x: W + 180,
                y: centerY - 22,
                rotation: -0.42,
                duration: 140,
                delay: 170,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    const impact = scene.add.circle(heartOuter.x, heartOuter.y, 46, 0xffffff, 0);
                    impact.setStrokeStyle(6, ember, 0.9);
                    animContainer.add(impact);
                    const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, crimson, 0);
                    animContainer.add(flash);

                    scene.tweens.add({
                        targets: impact,
                        alpha: 0.95,
                        scaleX: 2.4,
                        scaleY: 2.4,
                        duration: 180,
                        onComplete: () => impact.destroy()
                    });
                    scene.tweens.add({
                        targets: flash,
                        fillAlpha: 0.92,
                        duration: 110,
                        yoyo: true,
                        onComplete: () => {
                            scene.tweens.add({
                                targets: animContainer.list,
                                alpha: 0,
                                duration: 280,
                                onComplete: () => {
                                    animContainer.destroy();
                                    onComplete();
                                }
                            });
                        }
                    });
                }
            });
        });
    },

    playRuleBreaker(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2;
        const violet = 0x8e44ad;
        const cyan = 0x74b9ff;
        const animContainer = scene.add.container(0, 0).setDepth(2000);

        const overlay = scene.add.rectangle(centerX, centerY, W + 120, H + 120, 0x090313, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.95, duration: 280 });

        const portrait = scene.textures.exists('caster_medea')
            ? scene.add.image(centerX - 180, centerY, 'caster_medea').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 72, violet);
        portrait.setAlpha(0).setScale(0.55);
        animContainer.add(portrait);

        const charName = scene.add.text(centerX + 30, centerY - 60, unit.data.name, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, {
            fontSize: '28px',
            fill: '#d6a2ff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 52, 'Rule Breaker.', {
            fontSize: '15px',
            fill: '#aee6ff'
        }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);

        const circles = [];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(centerX + 90, centerY, 52 + i * 30, 0x000000, 0);
            ring.setStrokeStyle(3 - i * 0.5, i === 1 ? cyan : violet, 0.9);
            ring.setAlpha(0);
            animContainer.add(ring);
            circles.push(ring);
        }

        const spokes = [];
        for (let i = 0; i < 16; i++) {
            const spoke = scene.add.rectangle(centerX + 90, centerY, 170, 3, i % 2 === 0 ? violet : cyan, 0);
            spoke.setRotation((i / 16) * Math.PI * 2);
            animContainer.add(spoke);
            spokes.push(spoke);
        }

        const seals = [];
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const shard = scene.add.rectangle(
                centerX + 90 + Math.cos(angle) * 118,
                centerY + Math.sin(angle) * 118,
                44,
                18,
                i % 2 === 0 ? cyan : violet,
                0
            );
            shard.setRotation(angle + 0.4);
            shard.setStrokeStyle(2, 0xffffff, 0.65);
            animContainer.add(shard);
            seals.push(shard);
        }

        const dagger = scene.add.container(W + 180, centerY - 120).setDepth(2010);
        const blade = scene.add.triangle(0, 0, 0, -24, 0, 24, 150, 0, 0xffffff, 1);
        const bladeGlow = scene.add.triangle(10, 0, 0, -34, 0, 34, 160, 0, cyan, 0.28);
        const guard = scene.add.rectangle(-8, 0, 28, 44, violet, 1);
        const grip = scene.add.rectangle(-34, 0, 38, 10, 0x2d3436, 1);
        dagger.add([bladeGlow, blade, guard, grip]);
        dagger.setRotation(-0.58).setAlpha(0);
        animContainer.add(dagger);

        const fragments = [];
        for (let i = 0; i < 20; i++) {
            const frag = scene.add.rectangle(centerX + 90, centerY, Phaser.Math.Between(8, 18), Phaser.Math.Between(4, 10), i % 2 === 0 ? cyan : violet, 0);
            frag.setRotation(Phaser.Math.FloatBetween(0, Math.PI));
            animContainer.add(frag);
            fragments.push(frag);
        }

        if (typeof audioManager !== 'undefined') audioManager.playNoble();

        scene.time.delayedCall(180, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 280 });
        });

        scene.time.delayedCall(460, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 360, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 240 });

            circles.forEach((ring, i) => {
                scene.tweens.add({
                    targets: ring,
                    alpha: 0.78 - i * 0.1,
                    rotation: ring.rotation + (i % 2 === 0 ? 0.45 : -0.4),
                    scaleX: { from: 0.78, to: 1.08 + i * 0.06 },
                    scaleY: { from: 0.78, to: 1.08 + i * 0.06 },
                    duration: 900 + i * 100,
                    yoyo: true,
                    repeat: 1
                });
            });

            spokes.forEach((spoke, i) => {
                scene.tweens.add({
                    targets: spoke,
                    alpha: 0.38,
                    rotation: spoke.rotation + (i % 2 === 0 ? 0.28 : -0.28),
                    duration: 540,
                    yoyo: true,
                    repeat: 1
                });
            });

            seals.forEach((seal, i) => {
                scene.tweens.add({
                    targets: seal,
                    alpha: 0.92,
                    scaleX: { from: 0.6, to: 1.1 },
                    scaleY: { from: 0.6, to: 1.1 },
                    duration: 280,
                    delay: i * 30,
                    ease: 'Back.easeOut'
                });
            });
        });

        scene.time.delayedCall(1160, () => {
            scene.tweens.add({
                targets: dagger,
                alpha: 1,
                x: centerX + 60,
                y: centerY + 12,
                rotation: 0.18,
                duration: 220,
                ease: 'Cubic.easeIn'
            });

            scene.tweens.add({
                targets: dagger,
                x: -180,
                y: centerY - 36,
                rotation: 0.52,
                duration: 160,
                delay: 220,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    seals.forEach((seal, i) => {
                        scene.tweens.add({
                            targets: seal,
                            alpha: 0,
                            x: seal.x + Phaser.Math.Between(-180, 180),
                            y: seal.y + Phaser.Math.Between(-140, 140),
                            rotation: seal.rotation + Phaser.Math.FloatBetween(-1.2, 1.2),
                            duration: 260,
                            delay: i * 14,
                            ease: 'Cubic.easeOut',
                            onComplete: () => seal.destroy()
                        });
                    });

                    fragments.forEach((frag, i) => {
                        scene.tweens.add({
                            targets: frag,
                            alpha: 0.9,
                            x: centerX + 90 + Phaser.Math.Between(-220, 220),
                            y: centerY + Phaser.Math.Between(-160, 160),
                            duration: 260,
                            delay: i * 10,
                            ease: 'Cubic.easeOut',
                            onComplete: () => frag.destroy()
                        });
                    });

                    const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, 0xe6f7ff, 0);
                    animContainer.add(flash);
                    scene.tweens.add({
                        targets: flash,
                        fillAlpha: 0.92,
                        duration: 100,
                        yoyo: true,
                        onComplete: () => {
                            scene.tweens.add({
                                targets: animContainer.list,
                                alpha: 0,
                                duration: 300,
                                onComplete: () => {
                                    animContainer.destroy();
                                    onComplete();
                                }
                            });
                        }
                    });
                }
            });
        });
    },

    playNineLives(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2;
        const orange = 0xd35400;
        const gold = 0xf39c12;
        const animContainer = scene.add.container(0, 0).setDepth(2000);

        const overlay = scene.add.rectangle(centerX, centerY, W + 120, H + 120, 0x090909, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.95, duration: 260 });

        const portrait = scene.textures.exists('berserker_herc')
            ? scene.add.image(centerX - 180, centerY, 'berserker_herc').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 72, orange);
        portrait.setAlpha(0).setScale(0.55);
        animContainer.add(portrait);

        const charName = scene.add.text(centerX + 30, centerY - 60, unit.data.name, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, {
            fontSize: '28px',
            fill: '#ffb86b',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 52, 'Nine Lives.', {
            fontSize: '15px',
            fill: '#ffe6bf'
        }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);

        const shockRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(centerX + 70, centerY + 12, 44 + i * 26, 0x000000, 0);
            ring.setStrokeStyle(4 - i, i === 0 ? gold : orange, 0.92);
            ring.setAlpha(0);
            animContainer.add(ring);
            shockRings.push(ring);
        }

        const embers = [];
        for (let i = 0; i < 26; i++) {
            const ember = scene.add.circle(
                Phaser.Math.Between(40, W - 40),
                H + Phaser.Math.Between(10, 120),
                Phaser.Math.Between(4, 8),
                i % 2 === 0 ? gold : orange,
                0
            );
            animContainer.add(ember);
            embers.push(ember);
        }

        const slashes = [];
        for (let i = 0; i < 9; i++) {
            const slash = scene.add.rectangle(centerX + 70, centerY + 12, 260, 14, i % 2 === 0 ? 0xffffff : gold, 0);
            slash.setRotation(-0.8 + (i % 3) * 0.3);
            slash.setScaleX(0.2);
            animContainer.add(slash);
            slashes.push(slash);
        }

        const clawMarks = [];
        for (let i = 0; i < 3; i++) {
            const mark = scene.add.rectangle(centerX + 70 + i * 20, centerY + 12, 10, 220, orange, 0);
            mark.setRotation(0.26);
            animContainer.add(mark);
            clawMarks.push(mark);
        }

        if (typeof audioManager !== 'undefined') audioManager.playNoble();

        scene.time.delayedCall(180, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 280 });
        });

        scene.time.delayedCall(460, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 360, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 240 });

            embers.forEach((ember, i) => {
                scene.tweens.add({
                    targets: ember,
                    alpha: 0.82,
                    y: Phaser.Math.Between(centerY - 140, centerY + 180),
                    x: ember.x + Phaser.Math.Between(-40, 40),
                    duration: 600 + i * 18,
                    ease: 'Sine.easeOut'
                });
            });
        });

        scene.time.delayedCall(980, () => {
            shockRings.forEach((ring, i) => {
                scene.tweens.add({
                    targets: ring,
                    alpha: 0.88 - i * 0.14,
                    scaleX: { from: 0.6, to: 1.3 + i * 0.1 },
                    scaleY: { from: 0.6, to: 1.3 + i * 0.1 },
                    duration: 420,
                    delay: i * 70,
                    yoyo: true,
                    repeat: 1
                });
            });

            slashes.forEach((slash, i) => {
                scene.time.delayedCall(i * 70, () => {
                    slash.setScaleX(0.2);
                    scene.tweens.add({
                        targets: slash,
                        alpha: 0.92,
                        scaleX: 1.55,
                        duration: 120,
                        yoyo: true,
                        onComplete: () => slash.destroy()
                    });
                });
            });

            clawMarks.forEach((mark, i) => {
                scene.tweens.add({
                    targets: mark,
                    alpha: 0.86,
                    scaleY: { from: 0.4, to: 1.25 },
                    duration: 220,
                    delay: 200 + i * 40,
                    yoyo: true,
                    repeat: 1
                });
            });
        });

        scene.time.delayedCall(1760, () => {
            const impact = scene.add.circle(centerX + 70, centerY + 12, 64, 0xffffff, 0);
            impact.setStrokeStyle(8, gold, 0.92);
            animContainer.add(impact);
            const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, orange, 0);
            animContainer.add(flash);

            scene.tweens.add({
                targets: impact,
                alpha: 0.96,
                scaleX: 2.8,
                scaleY: 2.8,
                duration: 180,
                onComplete: () => impact.destroy()
            });
            scene.tweens.add({
                targets: flash,
                fillAlpha: 0.94,
                duration: 110,
                yoyo: true,
                onComplete: () => {
                    scene.tweens.add({
                        targets: animContainer.list,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            animContainer.destroy();
                            onComplete();
                        }
                    });
                }
            });
        });
    },

    playZabaniya(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2;
        const violet = 0x6c5ce7;
        const crimson = 0x2d0b3a;
        const animContainer = scene.add.container(0, 0).setDepth(2000);

        const overlay = scene.add.rectangle(centerX, centerY, W + 120, H + 120, 0x020205, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.96, duration: 280 });

        const portrait = scene.textures.exists('assassin_hassan')
            ? scene.add.image(centerX - 180, centerY, 'assassin_hassan').setDisplaySize(180, 180)
            : scene.add.circle(centerX - 180, centerY, 72, violet);
        portrait.setAlpha(0).setScale(0.55);
        animContainer.add(portrait);

        const charName = scene.add.text(centerX + 30, centerY - 60, unit.data.name, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(centerX + 30, centerY, noble.name, {
            fontSize: '28px',
            fill: '#c8b6ff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(centerX + 30, centerY + 52, 'Delusional Heartbeat.', {
            fontSize: '15px',
            fill: '#e0d6ff'
        }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);

        const pulseRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(centerX + 110, centerY, 46 + i * 28, 0x000000, 0);
            ring.setStrokeStyle(3, i === 1 ? 0xffffff : violet, 0.85);
            ring.setAlpha(0);
            animContainer.add(ring);
            pulseRings.push(ring);
        }

        const mist = [];
        for (let i = 0; i < 18; i++) {
            const cloud = scene.add.circle(
                Phaser.Math.Between(80, W - 80),
                Phaser.Math.Between(60, H - 60),
                Phaser.Math.Between(24, 52),
                i % 2 === 0 ? violet : crimson,
                0
            );
            animContainer.add(cloud);
            mist.push(cloud);
        }

        const sigils = [];
        for (let i = 0; i < 4; i++) {
            const sigil = scene.add.container(centerX + 110 + (i - 1.5) * 70, centerY - 110 + (i % 2) * 220);
            const outer = scene.add.circle(0, 0, 22, 0x000000, 0);
            outer.setStrokeStyle(2, violet, 0.9);
            const eyeL = scene.add.circle(-7, -4, 3, 0xffffff, 0.95);
            const eyeR = scene.add.circle(7, -4, 3, 0xffffff, 0.95);
            const mouth = scene.add.rectangle(0, 8, 14, 2, violet, 0.9);
            sigil.add([outer, eyeL, eyeR, mouth]);
            sigil.setAlpha(0);
            animContainer.add(sigil);
            sigils.push(sigil);
        }

        const blades = [];
        [
            { x: -120, y: centerY - 120, rotation: 0.1 },
            { x: W + 120, y: centerY - 80, rotation: Math.PI - 0.1 },
            { x: centerX + 110, y: -120, rotation: Math.PI / 2 },
            { x: centerX + 110, y: H + 120, rotation: -Math.PI / 2 }
        ].forEach((cfg) => {
            const blade = scene.add.container(cfg.x, cfg.y).setDepth(2010);
            const shaft = scene.add.rectangle(0, 0, 160, 6, 0x1f1f1f, 1);
            const edge = scene.add.triangle(92, 0, 0, -12, 0, 12, 24, 0, 0xffffff, 0.95);
            blade.add([shaft, edge]);
            blade.setRotation(cfg.rotation).setAlpha(0);
            animContainer.add(blade);
            blades.push(blade);
        });

        if (typeof audioManager !== 'undefined') audioManager.playNoble();

        scene.time.delayedCall(180, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 280 });
        });

        scene.time.delayedCall(460, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 360, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 240 });

            mist.forEach((cloud, i) => {
                scene.tweens.add({
                    targets: cloud,
                    alpha: 0.26,
                    x: cloud.x + Phaser.Math.Between(-80, 80),
                    y: cloud.y + Phaser.Math.Between(-60, 60),
                    duration: 820 + i * 18,
                    yoyo: true,
                    repeat: 1
                });
            });

            sigils.forEach((sigil, i) => {
                scene.tweens.add({
                    targets: sigil,
                    alpha: 0.9,
                    scaleX: { from: 0.6, to: 1.12 },
                    scaleY: { from: 0.6, to: 1.12 },
                    duration: 320,
                    delay: i * 90,
                    yoyo: true,
                    repeat: 1
                });
            });
        });

        scene.time.delayedCall(1080, () => {
            pulseRings.forEach((ring, i) => {
                scene.tweens.add({
                    targets: ring,
                    alpha: 0.86 - i * 0.14,
                    scaleX: { from: 0.5, to: 1.4 + i * 0.08 },
                    scaleY: { from: 0.5, to: 1.4 + i * 0.08 },
                    duration: 360,
                    delay: i * 80,
                    yoyo: true,
                    repeat: 1
                });
            });

            blades.forEach((blade, i) => {
                scene.tweens.add({
                    targets: blade,
                    alpha: 1,
                    x: centerX + 110,
                    y: centerY,
                    duration: 180,
                    delay: i * 50,
                    ease: 'Cubic.easeIn'
                });
            });
        });

        scene.time.delayedCall(1520, () => {
            const heartbeat = scene.add.circle(centerX + 110, centerY, 26, 0xffffff, 0.95);
            animContainer.add(heartbeat);
            const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, 0xffffff, 0);
            animContainer.add(flash);

            scene.tweens.add({
                targets: heartbeat,
                scaleX: 2.8,
                scaleY: 2.8,
                alpha: 0,
                duration: 220,
                onComplete: () => heartbeat.destroy()
            });
            scene.tweens.add({
                targets: flash,
                fillAlpha: 0.9,
                duration: 90,
                yoyo: true,
                onComplete: () => {
                    scene.tweens.add({
                        targets: animContainer.list,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            animContainer.destroy();
                            onComplete();
                        }
                    });
                }
            });
        });
    },

    // 水月无影 — 月淮泉·花影
    playMoonFlowers(scene, unit, noble, onComplete) {
        var W = scene.cameras.main.width;
        var H = scene.cameras.main.height;
        var cx = W / 2, cy = H / 2;
        var container = scene.add.container(0, 0).setDepth(2000);
        var charId = unit.data.charId;
        var PW = 350;
        var px = cx - Math.floor(PW / 2);

        // 生成花瓣纹理（用 Canvas，可靠）
        if (!scene.textures.exists('petal_tex')) {
            var canvasTex = scene.textures.createCanvas('petal_tex', 18, 28);
            var ctx = canvasTex.getContext();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(9, 27);
            ctx.quadraticCurveTo(1, 14, 9, 0);
            ctx.quadraticCurveTo(17, 14, 9, 27);
            ctx.fill();
            canvasTex.refresh();
        }

        // 暗幕
        var overlay = scene.add.rectangle(cx, cy, W + 100, H + 100, 0x0a0018, 0);
        container.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.7, duration: 300 });

        // 立绘
        var targetSX = 1, targetSY = 1;
        var portrait;
        if (scene.textures.exists(charId)) {
            var tex = scene.textures.get(charId);
            targetSX = PW / tex.getSourceImage().width;
            targetSY = PW / tex.getSourceImage().width;
            portrait = scene.add.image(px, cy, charId).setOrigin(0, 0.5);
        } else {
            portrait = scene.add.circle(px, cy, Math.floor(PW / 2), 0xd4b8f0);
        }
        portrait.setAlpha(0).setScale(targetSX * 0.3, targetSY * 0.3);
        container.add(portrait);

        // 文字
        var nameTxt = scene.add.text(cx, cy + 50, noble.name, {
            fontSize: '28px', fill: '#d4b8f0', fontStyle: 'bold',
            stroke: '#1a0a2e', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);
        var subTxt = scene.add.text(cx, cy + 90, 'MOON SPRING', {
            fontSize: '14px', fill: '#b8a9d4', letterSpacing: 8
        }).setOrigin(0.5).setAlpha(0);
        container.add([nameTxt, subTxt]);

        // 花瓣：初始聚集在中心，形成花苞
        var petalTints = [0xd4b8f0, 0xb8a9d4, 0xe0c8f0, 0xcbb8e0, 0xffe8ff];
        var petals = [];
        for (var i = 0; i < 50; i++) {
            var p = scene.add.image(cx, cy, 'petal_tex');
            p.setTint(petalTints[i % 5]).setAlpha(0).setScale(0.2);
            p.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
            container.add(p);
            petals.push(p);
        }

        if (typeof audioManager !== 'undefined') audioManager.playNoble();

        // 阶段1: 花苞绽放 (0ms) — 花瓣从中心炸开
        petals.forEach(function(p, k) {
            var angle = (k / 50) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3);
            var dist = Phaser.Math.Between(120, 450);
            var tx = cx + Math.cos(angle) * dist;
            var ty = cy + Math.sin(angle) * dist;
            scene.tweens.add({
                targets: p,
                alpha: 0.9, scaleX: Phaser.Math.FloatBetween(0.5, 1.5), scaleY: Phaser.Math.FloatBetween(0.5, 1.5),
                x: tx, y: ty,
                rotation: p.rotation + Phaser.Math.FloatBetween(-3, 3),
                duration: Phaser.Math.Between(600, 1200),
                delay: k * 30,
                ease: 'Power2.easeOut'
            });
        });

        // 阶段2: 立绘弹出 (300ms)
        scene.time.delayedCall(300, function() {
            scene.tweens.add({ targets: portrait, alpha: 1, scaleX: targetSX, scaleY: targetSY, duration: 500, ease: 'Back.easeOut' });
            scene.cameras.main.flash(300, 180, 150, 220);
            scene.cameras.main.shake(200, 0.003);
        });

        // 阶段3: 文字 + 冲击波 (600ms)
        scene.time.delayedCall(600, function() {
            scene.tweens.add({ targets: nameTxt, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: subTxt, alpha: 0.8, duration: 400, delay: 150 });
            for (var j = 0; j < 3; j++) {
                scene.time.delayedCall(j * 150, function() {
                    var w = scene.add.circle(cx, cy, 20, 0xd4b8f0, 0.4).setDepth(1999);
                    container.add(w);
                    scene.tweens.add({ targets: w, scale: 8, alpha: 0, duration: 600, onComplete: function() { w.destroy(); } });
                });
            }
        });

        // 收尾
        scene.time.delayedCall(1600, function() {
            var flash = scene.add.rectangle(cx, cy, W + 200, H + 200, 0xd4b8f0, 0);
            container.add(flash);
            scene.tweens.add({
                targets: flash, fillAlpha: 0.5, duration: 80, yoyo: true,
                onComplete: function() {
                    scene.tweens.add({
                        targets: container.list, alpha: 0, duration: 300,
                        onComplete: function() { container.destroy(); onComplete(); }
                    });
                }
            });
        });
    },

    playDefault(scene, unit, noble, onComplete) {
        const W = scene.cameras.main.width;
        const H = scene.cameras.main.height;
        const centerX = W / 2, centerY = H / 2 - 50;
        const animContainer = scene.add.container(0, 0).setDepth(2000);
        
        const overlay = scene.add.rectangle(centerX, centerY, W + 100, H + 100, 0x000000, 0);
        animContainer.add(overlay);
        scene.tweens.add({ targets: overlay, fillAlpha: 0.9, duration: 300 });
        
        const charId = unit.data.charId;
        const PORTRAIT_W = 350; // 约半个屏幕宽
        const portraitX = centerX - Math.floor(PORTRAIT_W / 2);
        let portrait;
        let targetScaleX = 1, targetScaleY = 1;
        if (scene.textures.exists(charId)) {
            const tex = scene.textures.get(charId);
            const iw = tex.getSourceImage().width;
            const ih = tex.getSourceImage().height;
            targetScaleX = PORTRAIT_W / iw;
            targetScaleY = PORTRAIT_W / iw; // 等比缩放
            portrait = scene.add.image(portraitX, centerY, charId).setOrigin(0, 0.5);
        } else {
            portrait = scene.add.circle(portraitX, centerY, Math.floor(PORTRAIT_W / 2), 0xf1c40f);
        }
        portrait.setAlpha(0).setScale(targetScaleX * 0.7, targetScaleY * 0.7);
        animContainer.add(portrait);

        const textX = portraitX + PORTRAIT_W + 20;
        const charName = scene.add.text(textX, centerY - 60, unit.data.name, { fontSize: '24px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5).setAlpha(0);
        const nobleName = scene.add.text(textX, centerY, noble.name, { fontSize: '28px', fill: '#f1c40f', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5).setAlpha(0).setScale(0.5);
        const releaseText = scene.add.text(textX, centerY + 50, '— 真名解放 —', { fontSize: '16px', fill: '#e74c3c' }).setOrigin(0, 0.5).setAlpha(0);
        animContainer.add([charName, nobleName, releaseText]);
        
        const particles = [];
        for (let i = 0; i < 30; i++) {
            const p = scene.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(3, 6), Phaser.Math.Between(30, 80), 0xf1c40f, 0);
            p.setRotation(Phaser.Math.FloatBetween(-0.3, 0.3));
            animContainer.add(p);
            particles.push(p);
        }

        if (typeof audioManager !== 'undefined') audioManager.playNoble();

        scene.time.delayedCall(200, () => {
            scene.tweens.add({ targets: portrait, alpha: 1, scaleX: targetScaleX, scaleY: targetScaleY, duration: 500, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: charName, alpha: 1, duration: 300 });
        });

        scene.time.delayedCall(500, () => {
            scene.tweens.add({ targets: nobleName, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: releaseText, alpha: 1, duration: 300 });
            particles.forEach((p, i) => {
                scene.tweens.add({ targets: p, fillAlpha: 0.8, y: p.y - 250, duration: 800 + i * 25, delay: i * 15, ease: 'Power1' });
            });
        });

        scene.time.delayedCall(1300, () => {
            const flash = scene.add.rectangle(centerX, centerY, W + 200, H + 200, 0xffffff, 0);
            animContainer.add(flash);
            scene.tweens.add({
                targets: flash, fillAlpha: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    scene.tweens.add({ targets: animContainer.list, alpha: 0, duration: 300, onComplete: () => { animContainer.destroy(); onComplete(); } });
                }
            });
        });
    }
};
