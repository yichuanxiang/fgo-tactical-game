/* ═══════════════════════════════════════════════════════
   Fate Battle — Visual Effects Mixin
   Extracted from GameScene to reduce file size.
   Methods are assigned to GameScene.prototype after class
   definition so they behave identically to inline methods.
   ═══════════════════════════════════════════════════════ */

Object.assign(GameScene.prototype, {

    createFxSystem() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.screenFlash = this.add.rectangle(W / 2, H / 2, W + 8, H + 8, 0xffffff, 0);
        this.screenFlash.setDepth(1900);
        this.screenFlash.setScrollFactor(0);
        this.screenFlash.setVisible(false);
    },

    getTeamFxColor(team) {
        return team === 'player' ? 0x4fc3f7 : 0xff6b6b;
    },

    getCharAnim() {
        const cid = this.currentUnit ? this.currentUnit.data.charId : null;
        if (!cid) return this._defaultAnim;
        if (!this._charAnimCache) this._charAnimCache = {};
        if (this._charAnimCache[cid]) return this._charAnimCache[cid];

        const anim = {
            saber_artoria:    { atkColor: 0xffd700, skillColor: 0x00bfff, nobleColor: 0xffd700, atkShape: 'slash', nobleFx: 'beam', particle: 'gold' },
            archer_emiya:     { atkColor: 0x00ff88, skillColor: 0x00ffcc, nobleColor: 0xff4444, atkShape: 'arrow', nobleFx: 'realityMarble', particle: 'spark' },
            caster_helewei:   { atkColor: 0xff69b4, skillColor: 0xff1493, nobleColor: 0xff0066, atkShape: 'orb', nobleFx: 'burst', particle: 'heart' },
            berserker_lancelot:{ atkColor: 0x8b0000, skillColor: 0x4a00e0, nobleColor: 0xff0000, atkShape: 'heavy', nobleFx: 'overload', particle: 'ember' },
            lancer_hanxin:    { atkColor: 0x9370db, skillColor: 0x7b68ee, nobleColor: 0x9400d3, atkShape: 'thrust', nobleFx: 'storm', particle: 'void' },
            mooncell_mizuki:  { atkColor: 0xbb99dd, skillColor: 0xb8a9d4, nobleColor: 0xd4b8f0, atkShape: 'orb', nobleFx: 'moonFlower', particle: 'moon' },
        };
        const cfg = anim[cid] || { atkColor: 0xff6b6b, skillColor: 0xc56cf0, nobleColor: 0xf1c40f, atkShape: 'slash', nobleFx: 'burst', particle: 'spark' };
        this._charAnimCache[cid] = cfg;
        this._defaultAnim = cfg;
        return cfg;
    },

    getDamageFxColor(damageType = 'attack') {
        const anim = this.currentUnit ? this.getCharAnim() : this._defaultAnim || { atkColor: 0xff6b6b, skillColor: 0xc56cf0, nobleColor: 0xf1c40f };
        switch (damageType) {
            case 'noble': return anim.nobleColor;
            case 'skill': return anim.skillColor;
            default: return anim.atkColor;
        }
    },

    playCharAttackEffect(attacker, target) {
        const anim = this.getCharAnim();
        const ax = attacker.x, ay = attacker.y;
        const tx = target ? target.x : ax + 40, ty = target ? target.y : ay;

        const flashColor = anim.atkColor;
        const flash = this.add.circle(ax, ay, GAME_CONFIG.tileSize * 0.6, flashColor, 0.35).setDepth(1100);
        this.tweens.add({ targets: flash, scale: 1.5, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

        switch (anim.atkShape) {
            case 'slash': {
                const slash = this.add.rectangle(ax, ay, 4, GAME_CONFIG.tileSize, flashColor, 0.8).setDepth(1101);
                slash.setRotation(Phaser.Math.Angle.Between(ax, ay, tx, ty));
                if (target) {
                    this.tweens.add({ targets: slash, x: tx, y: ty, alpha: 0, scaleX: 0.3, duration: 200, ease: 'Power2', onComplete: () => slash.destroy() });
                } else {
                    this.tweens.add({ targets: slash, scaleX: 1.5, alpha: 0, duration: 350, onComplete: () => slash.destroy() });
                }
                break;
            }
            case 'arrow': {
                for (let i = 0; i < 5; i++) {
                    const t = i / 5;
                    this.time.delayedCall(t * 200, () => {
                        const arrow = this.add.circle(ax + (tx - ax) * t, ay + (ty - ay) * t, 5, flashColor, 0.7).setDepth(1101);
                        this.tweens.add({ targets: arrow, scale: 1.5, alpha: 0, duration: 200, onComplete: () => arrow.destroy() });
                    });
                }
                break;
            }
            case 'orb': {
                const orb = this.add.circle(ax, ay, 8, flashColor, 0.8).setDepth(1101);
                if (target) {
                    this.tweens.add({ targets: orb, x: tx, y: ty, scale: 2, alpha: 0, duration: 350, ease: 'Power2', onComplete: () => orb.destroy() });
                } else {
                    this.tweens.add({ targets: orb, scale: 3, alpha: 0, duration: 400, onComplete: () => orb.destroy() });
                }
                break;
            }
            case 'heavy': {
                const heavy = this.add.circle(tx || ax, ty || ay, 5, flashColor, 0.6).setDepth(1101);
                this.tweens.add({ targets: heavy, scale: 8, alpha: 0, duration: 350, ease: 'Power3', onComplete: () => heavy.destroy() });
                this.cameras.main.shake(80, 0.003);
                break;
            }
            case 'thrust': {
                const line = this.add.rectangle(ax, ay, 8, 2, flashColor, 0.9).setDepth(1101);
                line.setRotation(Phaser.Math.Angle.Between(ax, ay, tx, ty));
                this.tweens.add({ targets: line, scaleX: 3, alpha: 0, duration: 250, onComplete: () => line.destroy() });
                break;
            }
            default:
                this.tweens.add({ targets: this.add.circle(ax, ay, 20, flashColor, 0.4).setDepth(1100), scale: 2, alpha: 0, duration: 300, onComplete: (t, o) => { if (o && o[0] && o[0].target) o[0].target.destroy(); } });
        }
    },

    playNobleScreenFx() {
        const anim = this.getCharAnim();
        const W = this.cameras.main.width, H = this.cameras.main.height;

        switch (anim.nobleFx) {
            case 'beam': {
                const beam = this.add.rectangle(0, H / 2, W * 2, H, anim.nobleColor, 0.15).setDepth(1400).setOrigin(0, 0.5);
                this.tweens.add({ targets: beam, x: -W, duration: 600, ease: 'Power2', onComplete: () => beam.destroy() });
                const flare = this.add.circle(W / 2, H / 2, 200, 0xffffff, 0.2).setDepth(1401);
                this.tweens.add({ targets: flare, scale: 3, alpha: 0, duration: 500, onComplete: () => flare.destroy() });
                this.cameras.main.flash(400, 255, 215, 0);
                break;
            }
            case 'realityMarble': {
                const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x330000, 0.4).setDepth(1399);
                this.tweens.add({ targets: overlay, alpha: 0.15, duration: 2000, yoyo: true, onComplete: () => overlay.destroy() });
                for (let i = 0; i < 8; i++) {
                    this.time.delayedCall(i * 80, () => {
                        const spark = this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 3, anim.nobleColor, 0.7).setDepth(1400);
                        this.tweens.add({ targets: spark, alpha: 0, scale: 3, duration: 600, onComplete: () => spark.destroy() });
                    });
                }
                this.cameras.main.flash(300, 255, 100, 100);
                break;
            }
            case 'burst': {
                const center = this.add.circle(W / 2, H / 2, 50, anim.nobleColor, 0.3).setDepth(1400);
                this.tweens.add({ targets: center, scale: 10, alpha: 0, duration: 500, ease: 'Power3', onComplete: () => center.destroy() });
                for (let i = 0; i < 20; i++) {
                    const p = this.add.circle(W / 2, H / 2, Phaser.Math.Between(3, 8), anim.nobleColor, 0.6).setDepth(1401);
                    const a = Math.random() * Math.PI * 2, d = Phaser.Math.Between(50, 200);
                    this.tweens.add({ targets: p, x: W / 2 + Math.cos(a) * d, y: H / 2 + Math.sin(a) * d, alpha: 0, duration: 500, onComplete: () => p.destroy() });
                }
                this.cameras.main.flash(400, 255, 100, 150);
                break;
            }
            case 'overload': {
                const pulse = this.add.circle(W / 2, H / 2, W, 0xff0000, 0.2).setDepth(1399);
                this.tweens.add({ targets: pulse, scale: 1.2, alpha: 0, duration: 800, onComplete: () => pulse.destroy() });
                this.cameras.main.shake(200, 0.008);
                this.cameras.main.flash(600, 255, 0, 0);
                break;
            }
            case 'storm': {
                for (let i = 0; i < 25; i++) {
                    const p = this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(2, 5), Phaser.Math.Between(10, 30), anim.nobleColor, 0.5).setDepth(1400);
                    this.tweens.add({ targets: p, rotation: Math.random() * 4, x: p.x + Phaser.Math.Between(-100, 100), alpha: 0, duration: 600, onComplete: () => p.destroy() });
                }
                this.cameras.main.flash(300, 150, 0, 200);
                break;
            }
            case 'moonFlower': {
                const cx = W / 2, cy = H / 2;
                const overlay = this.add.rectangle(cx, cy, W, H, 0x1a0a2e, 0.55).setDepth(1399);
                this.tweens.add({ targets: overlay, alpha: 0.2, duration: 2500, yoyo: true, onComplete: () => overlay.destroy() });
                for (let i = 0; i < 5; i++) {
                    this.time.delayedCall(i * 160, () => {
                        const ring = this.add.circle(cx, cy, 30, 0xb8a9d4, 0.35).setDepth(1400);
                        this.tweens.add({ targets: ring, scale: 8, alpha: 0, duration: 1300, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
                    });
                }
                for (let i = 0; i < 35; i++) {
                    this.time.delayedCall(i * 25, () => {
                        const px = Phaser.Math.Between(0, W);
                        const p = this.add.circle(px, -10, Phaser.Math.Between(2, 5), 0xd4b8f0, 0.65).setDepth(1401);
                        this.tweens.add({ targets: p, y: H + 10, alpha: 0, duration: Phaser.Math.Between(1200, 2200), ease: 'Sine.easeIn', onComplete: () => p.destroy() });
                    });
                }
                this.cameras.main.flash(500, 180, 150, 220);
                this.cameras.main.shake(400, 0.004);
                break;
            }
        }
    },

    playScreenPulse(color = 0xffffff, alpha = 0.18, duration = 140) {
        if (!this.screenFlash) return;

        this.tweens.killTweensOf(this.screenFlash);
        this.screenFlash.setFillStyle(color, 1);
        this.screenFlash.setAlpha(alpha);
        this.screenFlash.setVisible(true);

        this.tweens.add({
            targets: this.screenFlash,
            alpha: 0,
            duration,
            ease: 'Quad.easeOut',
            onComplete: () => {
                if (this.screenFlash) {
                    this.screenFlash.setVisible(false);
                }
            }
        });
    },

    shakeCamera(duration = 90, intensity = 0.0035) {
        if (this.cameras && this.cameras.main) {
            this.cameras.main.shake(duration, intensity);
        }
    },

    createPulseHighlight(x, y, fillColor, fillAlpha = 0.35, strokeColor = null, depth = 12, width = GAME_CONFIG.tileSize - 4, height = GAME_CONFIG.tileSize - 4) {
        const highlight = this.add.rectangle(
            x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2,
            width,
            height,
            fillColor,
            fillAlpha
        );

        highlight.setDepth(depth);
        if (strokeColor !== null) {
            highlight.setStrokeStyle(2, strokeColor, 0.9);
        }

        this.tweens.add({
            targets: highlight,
            alpha: { from: fillAlpha, to: Math.min(fillAlpha + 0.22, 0.95) },
            scaleX: { from: 0.96, to: 1.06 },
            scaleY: { from: 0.96, to: 1.06 },
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return highlight;
    },

    createRadialBurstAt(x, y, color = 0xffffff, radius = 70, sparkCount = 8, depth = 1250) {
        const ring = this.add.circle(x, y, 12, color, 0.08).setDepth(depth);
        ring.setStrokeStyle(4, color, 0.95);

        const core = this.add.circle(x, y, 10, color, 0.35).setDepth(depth + 1);

        this.tweens.add({
            targets: ring,
            scaleX: radius / 12,
            scaleY: radius / 12,
            alpha: 0,
            duration: 240,
            ease: 'Quad.easeOut',
            onComplete: () => ring.destroy()
        });

        this.tweens.add({
            targets: core,
            scale: 2.4,
            alpha: 0,
            duration: 180,
            ease: 'Quad.easeOut',
            onComplete: () => core.destroy()
        });

        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkCount + Phaser.Math.FloatBetween(-0.18, 0.18);
            const distance = Phaser.Math.Between(Math.floor(radius * 0.45), radius);
            const spark = this.add.rectangle(x, y, Phaser.Math.Between(4, 8), Phaser.Math.Between(10, 18), color, 0.95);
            spark.setDepth(depth + 2);
            spark.setRotation(angle);

            this.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scaleY: 0.4,
                duration: Phaser.Math.Between(180, 280),
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }
    },

    createImpactEffect(target, color, options = {}) {
        if (!target) return;

        const {
            radius = 72,
            shake = false,
            shakeDuration = 90,
            shakeIntensity = 0.0035,
            pulseAlpha = 0.14
        } = options;

        this.createRadialBurstAt(target.x, target.y, color, radius, options.sparkCount || 10);

        const aura = this.add.circle(target.x, target.y, GAME_CONFIG.tileSize * 0.36, color, 0.22).setDepth(1240);
        this.tweens.add({
            targets: aura,
            scale: 1.75,
            alpha: 0,
            duration: 220,
            ease: 'Quad.easeOut',
            onComplete: () => aura.destroy()
        });

        if (target.data && target.data.border) {
            this.tweens.add({
                targets: target.data.border,
                scaleX: 1.14,
                scaleY: 1.14,
                duration: 90,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
        }

        this.playScreenPulse(color, pulseAlpha, 120);

        if (shake) {
            this.shakeCamera(shakeDuration, shakeIntensity);
        }
    },

    createSlashTrail(fromX, fromY, toX, toY, color = 0xffffff, width = 16) {
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
        const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);

        const glow = this.add.rectangle(midX, midY, Math.max(48, distance * 0.82), width * 1.8, color, 0.18);
        glow.setRotation(angle);
        glow.setDepth(1230);

        const slash = this.add.rectangle(midX, midY, Math.max(36, distance * 0.76), width, color, 0.92);
        slash.setRotation(angle);
        slash.setDepth(1232);

        this.tweens.add({
            targets: [glow, slash],
            scaleX: 1.12,
            scaleY: 0.72,
            alpha: 0,
            duration: 160,
            ease: 'Quad.easeOut',
            onComplete: () => {
                glow.destroy();
                slash.destroy();
            }
        });
    },

    createMoveTrail(fromX, fromY, toX, toY, color) {
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
        const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);

        const trail = this.add.rectangle(midX, midY, Math.max(24, distance), 8, color, 0.18);
        trail.setRotation(angle);
        trail.setDepth(1180);

        const startPulse = this.add.circle(fromX, fromY, 10, color, 0.24).setDepth(1181);
        const endPulse = this.add.circle(toX, toY, 10, color, 0.2).setDepth(1181);

        this.tweens.add({
            targets: trail,
            alpha: 0,
            scaleY: 0.3,
            duration: 260,
            ease: 'Quad.easeOut',
            onComplete: () => trail.destroy()
        });

        this.tweens.add({
            targets: [startPulse, endPulse],
            scale: 1.8,
            alpha: 0,
            duration: 220,
            ease: 'Quad.easeOut',
            onComplete: () => {
                startPulse.destroy();
                endPulse.destroy();
            }
        });
    },

    showCombatText(target, text, color = '#ffffff', fontSize = '18px') {
        const combatText = this.add.text(target.x, target.y - 56, text, {
            fontSize,
            fill: color,
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(1305).setScale(0.7);

        this.tweens.add({
            targets: combatText,
            y: combatText.y - 28,
            alpha: 0,
            scale: 1.08,
            duration: 650,
            ease: 'Quad.easeOut',
            onComplete: () => combatText.destroy()
        });
    },

    createFormationSigilAt(x, y, primaryColor = 0x63e6be, accentColor = 0xf6d365, size = 26, depth = 1238, duration = 320) {
        const sigil = this.add.container(x, y).setDepth(depth);
        const diamond = this.add.rectangle(0, 0, size, size, primaryColor, 0.08);
        diamond.setRotation(Math.PI / 4);
        diamond.setStrokeStyle(2, primaryColor, 0.95);

        const horizontal = this.add.rectangle(0, 0, size * 1.35, 2, accentColor, 0.85);
        const vertical = this.add.rectangle(0, 0, 2, size * 1.35, accentColor, 0.62);
        const core = this.add.circle(0, 0, Math.max(3, size * 0.16), accentColor, 0.92);

        sigil.add([diamond, horizontal, vertical, core]);

        this.tweens.add({
            targets: [diamond, horizontal, vertical, core],
            alpha: 0,
            scaleX: 1.24,
            scaleY: 1.24,
            duration,
            ease: 'Quad.easeOut',
            onComplete: () => sigil.destroy()
        });

        return sigil;
    },

    createTacticalPathEffect(fromX, fromY, toX, toY, primaryColor = 0x63e6be, accentColor = 0xf6d365) {
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
        const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
        const depth = 1184;

        const glow = this.add.rectangle(midX, midY, Math.max(40, distance), 12, primaryColor, 0.14).setDepth(depth);
        glow.setRotation(angle);

        const lane = this.add.rectangle(midX, midY, Math.max(32, distance * 0.94), 4, accentColor, 0.75).setDepth(depth + 1);
        lane.setRotation(angle);

        this.tweens.add({
            targets: [glow, lane],
            alpha: 0,
            scaleY: 0.35,
            duration: 280,
            ease: 'Quad.easeOut',
            onComplete: () => {
                glow.destroy();
                lane.destroy();
            }
        });

        const dashCount = Math.max(4, Math.min(7, Math.round(distance / 72)));
        for (let i = 0; i < dashCount; i++) {
            const t = dashCount === 1 ? 0.5 : i / (dashCount - 1);
            const dash = this.add.rectangle(
                Phaser.Math.Linear(fromX, toX, t),
                Phaser.Math.Linear(fromY, toY, t),
                18,
                6,
                primaryColor,
                0.22
            ).setDepth(depth + 2);
            dash.setRotation(angle);

            this.tweens.add({
                targets: dash,
                alpha: { from: 0.18, to: 0.82 },
                scaleX: { from: 0.6, to: 1.35 },
                scaleY: { from: 0.8, to: 1.15 },
                duration: 220,
                delay: i * 35,
                yoyo: true,
                onComplete: () => dash.destroy()
            });
        }

        this.createFormationSigilAt(fromX, fromY, primaryColor, accentColor, 20, depth + 3, 260);
        this.createFormationSigilAt(toX, toY, primaryColor, accentColor, 26, depth + 3, 320);
    },

    createAmbushTrapSprite(tileX, tileY, ownerTeam) {
        const x = tileX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const y = tileY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const primaryColor = ownerTeam === 'player' ? 0x63e6be : 0xf39c12;
        const accentColor = 0xf6d365;
        const trap = this.add.container(x, y).setDepth(5);

        const base = this.add.rectangle(0, 0, GAME_CONFIG.tileSize - 8, GAME_CONFIG.tileSize - 8, 0x2b1112, 0.22);
        base.setStrokeStyle(2, 0x6b2f17, 0.58);
        const diamond = this.add.rectangle(0, 0, GAME_CONFIG.tileSize - 18, GAME_CONFIG.tileSize - 18, primaryColor, 0.08);
        diamond.setRotation(Math.PI / 4);
        diamond.setStrokeStyle(2, primaryColor, 0.74);
        const horizontal = this.add.rectangle(0, 0, GAME_CONFIG.tileSize - 18, 2, accentColor, 0.62);
        const vertical = this.add.rectangle(0, 0, 2, GAME_CONFIG.tileSize - 18, primaryColor, 0.46);
        const core = this.add.circle(0, 0, 5, accentColor, 0.86);

        trap.add([base, diamond, horizontal, vertical, core]);

        this.tweens.add({
            targets: [diamond, horizontal, vertical, core],
            alpha: { from: 0.24, to: 0.84 },
            scaleX: { from: 0.95, to: 1.08 },
            scaleY: { from: 0.95, to: 1.08 },
            duration: 560,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return trap;
    },

    showDamageNumber(target, damage) {
        const isHeavy = damage >= 2000;
        const label = typeof fmtNum === 'function' ? fmtNum(damage) : String(damage);
        const damageText = this.add.text(target.x, target.y - 50, `-${label}`, {
            fontSize: isHeavy ? '34px' : '28px',
            fill: '#e74c3c',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(1300).setScale(0.68);

        this.tweens.add({
            targets: damageText,
            x: damageText.x + Phaser.Math.Between(-8, 8),
            y: target.y - 100,
            alpha: 0,
            scale: isHeavy ? 1.18 : 1.04,
            duration: isHeavy ? 900 : 760,
            ease: 'Back.easeOut',
            onComplete: () => damageText.destroy()
        });
    },

    showHealNumber(target, amount) {
        this.createRadialBurstAt(target.x, target.y, 0x2ecc71, 56, 7, 1245);
        const healLabel = typeof fmtNum === 'function' ? fmtNum(amount) : String(amount);
        const healText = this.add.text(target.x, target.y - 50, `+${healLabel}`, {
            fontSize: '24px',
            fill: '#2ecc71',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(1300).setScale(0.72);

        this.tweens.add({
            targets: healText,
            x: healText.x + Phaser.Math.Between(-6, 6),
            y: target.y - 100,
            alpha: 0,
            scale: 1.08,
            duration: 760,
            ease: 'Back.easeOut',
            onComplete: () => healText.destroy()
        });
    },

    showTurnBanner(text) {
        audioManager.playTurnChange();

        const centerX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize / 2;
        const centerY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize / 2;

        const container = this.add.container(0, 0).setDepth(150);
        const backdrop = this.add.rectangle(centerX, centerY, 440, 86, 0x050814, 0);
        backdrop.setStrokeStyle(2, 0xf1c40f, 0.65);

        const glow = this.add.circle(centerX, centerY, 120, 0xf1c40f, 0.08);
        glow.setScale(0.7);

        const leftBar = this.add.rectangle(centerX - 260, centerY, 0, 4, 0xf1c40f, 0.9);
        const rightBar = this.add.rectangle(centerX + 260, centerY, 0, 4, 0xf1c40f, 0.9);

        const banner = this.add.text(centerX, centerY, text, {
            fontSize: '46px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0).setScale(0.82);

        container.add([glow, backdrop, leftBar, rightBar, banner]);

        this.tweens.add({
            targets: backdrop,
            alpha: 0.92,
            duration: 180,
            ease: 'Quad.easeOut'
        });

        this.tweens.add({
            targets: glow,
            alpha: 0.18,
            scale: 1.25,
            duration: 260,
            ease: 'Quad.easeOut'
        });

        this.tweens.add({
            targets: leftBar,
            width: 180,
            duration: 220,
            ease: 'Quad.easeOut'
        });

        this.tweens.add({
            targets: rightBar,
            width: 180,
            duration: 220,
            ease: 'Quad.easeOut'
        });

        this.tweens.add({
            targets: banner,
            alpha: 1,
            scale: 1,
            duration: 240,
            ease: 'Back.easeOut'
        });

        this.time.delayedCall(900, () => {
            this.tweens.add({
                targets: container.list,
                alpha: 0,
                duration: 220,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    if (container && container.active) {
                        container.destroy();
                    }
                }
            });
        });
    }

});
