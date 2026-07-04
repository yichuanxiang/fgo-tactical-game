/* Fate Battle UI Kit - visual language shared by all Phaser scenes. */
const C = {
    bg: 0x060912,
    bg2: 0x0d1320,
    bg3: 0x151d2d,
    panel: 0x101725,
    panel2: 0x182033,
    line: 0x2b3854,
    gold: 0xc9a857,
    gold2: 0xf0d384,
    goldDim: 0x57472a,
    fg: 0xf0ead8,
    fg2: 0xaaa593,
    fg3: 0x6e6b63,
    blue: 0x4f8fd7,
    red: 0xd65b55,
    green: 0x5fbf8a,
    purple: 0xa778d6,
    orange: 0xd8964c,
    cyan: 0x66c7d9,
    barBg: 0x20283a
};

const UI_FONT = '"Microsoft YaHei", "PingFang SC", Arial, sans-serif';
const TITLE_FONT = 'Georgia, "Times New Roman", serif';

function colorHex(color) {
    return '#' + color.toString(16).padStart(6, '0');
}

function shadeColor(color, amount) {
    const r = Phaser.Math.Clamp(((color >> 16) & 255) + amount, 0, 255);
    const g = Phaser.Math.Clamp(((color >> 8) & 255) + amount, 0, 255);
    const b = Phaser.Math.Clamp((color & 255) + amount, 0, 255);
    return Phaser.Display.Color.GetColor(r, g, b);
}

function drawPanel(gfx, x, y, w, h, opts) {
    opts = opts || {};
    const radius = opts.radius == null ? 6 : opts.radius;
    gfx.clear();
    gfx.fillStyle(opts.fill || C.panel, opts.alpha == null ? 0.88 : opts.alpha);
    gfx.fillRoundedRect(x, y, w, h, radius);
    gfx.fillStyle(opts.accent || C.gold, opts.accentAlpha == null ? 0.08 : opts.accentAlpha);
    gfx.fillRoundedRect(x + 1, y + 1, w - 2, Math.min(26, h - 2), radius);
    gfx.lineStyle(opts.lineWidth || 1, opts.stroke || C.gold, opts.strokeAlpha == null ? 0.22 : opts.strokeAlpha);
    gfx.strokeRoundedRect(x, y, w, h, radius);
}

function addBg(scene, W, H) {
    const gfx = scene.add.graphics().setDepth(-30);
    gfx.fillStyle(C.bg, 1);
    gfx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 6) {
        const t = y / H;
        const r = Math.floor(6 + t * 15);
        const g = Math.floor(9 + t * 15);
        const b = Math.floor(18 + t * 28);
        gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
        gfx.fillRect(0, y, W, 6);
    }

    gfx.fillStyle(0x111a2b, 0.72);
    gfx.fillRect(0, Math.floor(H * 0.56), W, H);

    gfx.lineStyle(1, C.gold, 0.08);
    for (let i = 0; i < 11; i++) {
        const y = H * 0.58 + i * 24;
        gfx.beginPath();
        gfx.moveTo(0, y);
        gfx.lineTo(W, y + i * 5);
        gfx.strokePath();
    }

    gfx.lineStyle(1, C.blue, 0.08);
    for (let i = -4; i < 14; i++) {
        const x = i * 78;
        gfx.beginPath();
        gfx.moveTo(x, H);
        gfx.lineTo(W * 0.5 + (i - 5) * 18, H * 0.55);
        gfx.strokePath();
    }

    gfx.fillStyle(C.gold, 0.04);
    gfx.fillTriangle(W * 0.08, 0, W * 0.38, 0, W * 0.24, H);
    gfx.fillStyle(C.blue, 0.04);
    gfx.fillTriangle(W * 0.68, 0, W, 0, W * 0.86, H);

    gfx.fillStyle(0x000000, 0.34);
    gfx.fillRect(0, 0, W, 34);
    gfx.fillRect(0, H - 48, W, 48);
    gfx.fillStyle(0x000000, 0.22);
    gfx.fillRect(0, 0, 110, H);
    gfx.fillRect(W - 110, 0, 110, H);

    return gfx;
}

function addParticles(scene, W, H) {
    for (let i = 0; i < 44; i++) {
        const warm = Math.random() < 0.55;
        const x = Phaser.Math.Between(0, W);
        const y = Phaser.Math.Between(Math.floor(H * 0.36), H);
        const spark = scene.add.rectangle(
            x,
            y,
            warm ? Phaser.Math.FloatBetween(1, 2) : 1,
            Phaser.Math.FloatBetween(5, 13),
            warm ? C.gold2 : C.cyan,
            warm ? Phaser.Math.FloatBetween(0.18, 0.42) : Phaser.Math.FloatBetween(0.08, 0.22)
        ).setDepth(-3);
        spark.rotation = Phaser.Math.FloatBetween(-0.45, 0.45);
        scene.tweens.add({
            targets: spark,
            y: -18,
            x: x + Phaser.Math.Between(-30, 30),
            alpha: 0,
            duration: Phaser.Math.Between(9000, 18000),
            delay: Phaser.Math.Between(0, 9000),
            repeat: -1,
            onRepeat: () => {
                spark.x = Phaser.Math.Between(0, W);
                spark.y = Phaser.Math.Between(Math.floor(H * 0.42), H);
                spark.alpha = warm ? Phaser.Math.FloatBetween(0.18, 0.42) : Phaser.Math.FloatBetween(0.08, 0.22);
            }
        });
    }
}

function addTitleRings(scene, cx, cy) {
    for (let i = 0; i < 3; i++) {
        const ring = scene.add.circle(cx, cy, 88 + i * 62, C.gold, 0).setDepth(-1);
        ring.setStrokeStyle(1, C.gold, 0.07 - i * 0.01);
        scene.tweens.add({
            targets: ring,
            scale: 1.04,
            alpha: 0.08,
            duration: 2800 + i * 540,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

function createBtn(scene, x, y, w, h, text, color, cb, opts) {
    opts = opts || {};
    const hw = w / 2;
    const hh = h / 2;
    let enabled = opts.enabled !== false;

    const glow = scene.add.rectangle(x, y, w + 8, h + 8, color || C.gold, 0.06);
    glow.setStrokeStyle(1, C.gold, 0.06);

    const bgGfx = scene.add.graphics();
    const border = scene.add.graphics();
    const bar = scene.add.rectangle(x - hw + 5, y, 3, h - 16, color || C.gold, 0.55);
    const icon = scene.add.text(x - hw + 24, y, opts.icon || '>', {
        fontSize: (opts.iconSize || 16) + 'px',
        fill: colorHex(color || C.gold),
        fontFamily: UI_FONT,
        fontStyle: 'bold'
    }).setOrigin(0.5);
    const label = scene.add.text(x - hw + 44, y, text, {
        fontSize: (opts.fontSize || 15) + 'px',
        fill: colorHex(C.fg),
        fontFamily: UI_FONT,
        fontStyle: opts.bold === false ? 'normal' : 'bold'
    }).setOrigin(0, 0.5);
    const hint = scene.add.text(x + hw - 20, y, opts.hint || '›', {
        fontSize: '22px',
        fill: colorHex(C.gold2),
        fontFamily: UI_FONT
    }).setOrigin(0.5).setAlpha(0.45);

    const hit = scene.add.rectangle(x, y, w, h, 0xffffff, 0).setInteractive({ useHandCursor: true });

    function paint(hover, down) {
        const fill = !enabled ? C.bg2 : (down ? shadeColor(color || C.gold, -72) : (hover ? C.panel2 : C.panel));
        const accent = !enabled ? C.fg3 : (color || C.gold);
        const alpha = !enabled ? 0.46 : (hover ? 0.96 : 0.88);

        bgGfx.clear();
        bgGfx.fillStyle(fill, alpha);
        bgGfx.fillRoundedRect(x - hw, y - hh, w, h, 6);
        bgGfx.fillStyle(accent, hover ? 0.16 : 0.08);
        bgGfx.fillRoundedRect(x - hw + 1, y - hh + 1, w - 2, Math.min(18, h - 2), 6);
        bgGfx.fillStyle(0xffffff, hover ? 0.035 : 0.018);
        bgGfx.fillRect(x - hw + 1, y - 1, w - 2, 1);

        border.clear();
        border.lineStyle(hover ? 1.5 : 1, enabled ? C.gold : C.line, hover ? 0.42 : 0.18);
        border.strokeRoundedRect(x - hw, y - hh, w, h, 6);

        glow.setFillStyle(accent, enabled ? (hover ? 0.12 : 0.05) : 0.02);
        bar.setFillStyle(accent, enabled ? (hover ? 0.95 : 0.55) : 0.25);
        icon.setStyle({ fill: colorHex(enabled ? accent : C.fg3) });
        label.setStyle({ fill: colorHex(enabled ? (hover ? C.gold2 : C.fg) : C.fg3) });
        hint.setAlpha(enabled ? (hover ? 0.85 : 0.45) : 0.16);
    }

    paint(false, false);

    hit.on('pointerover', () => paint(true, false));
    hit.on('pointerout', () => paint(false, false));
    hit.on('pointerdown', () => {
        if (!enabled) return;
        paint(true, true);
        scene.time.delayedCall(80, () => {
            paint(true, false);
            cb();
        });
    });

    const parts = [glow, bgGfx, border, bar, icon, label, hint, hit];
    return {
        bgGfx,
        border,
        bar,
        icon,
        label,
        arrow: hint,
        glow,
        hit,
        parts,
        setVisible(v) { parts.forEach(p => p.setVisible(v)); },
        setDepth(d) { parts.forEach(p => p.setDepth(d)); },
        setAlpha(a) { parts.forEach(p => p.setAlpha(a)); },
        setEnabled(v) {
            enabled = !!v;
            if (enabled) hit.setInteractive({ useHandCursor: true });
            else hit.disableInteractive();
            paint(false, false);
        },
        setText(v) { label.setText(v); },
        destroy() { parts.forEach(p => p.destroy()); }
    };
}

function createSmallBtn(scene, x, y, w, h, text, color, cb, opts) {
    return createBtn(scene, x, y, w, h, text, color, cb, Object.assign({ fontSize: 12, bold: false }, opts || {}));
}

function createCard(scene, cx, cy, w, h, color) {
    const hw = w / 2;
    const hh = h / 2;
    const bgGfx = scene.add.graphics();
    const border = scene.add.graphics();
    const topBar = scene.add.rectangle(cx, cy - hh + 3, w - 12, 3, color || C.gold, 0.75);

    function paint(selected) {
        bgGfx.clear();
        bgGfx.fillStyle(selected ? C.panel2 : C.panel, selected ? 0.96 : 0.86);
        bgGfx.fillRoundedRect(cx - hw, cy - hh, w, h, 6);
        bgGfx.fillStyle(color || C.gold, selected ? 0.14 : 0.06);
        bgGfx.fillRoundedRect(cx - hw + 1, cy - hh + 1, w - 2, 26, 6);
        border.clear();
        border.lineStyle(selected ? 2 : 1, selected ? C.gold2 : C.gold, selected ? 0.7 : 0.18);
        border.strokeRoundedRect(cx - hw, cy - hh, w, h, 6);
        topBar.setFillStyle(color || C.gold, selected ? 1 : 0.72);
    }

    paint(false);
    return {
        bgGfx,
        border,
        topBar,
        setSel: paint,
        setVisible(v) { [bgGfx, border, topBar].forEach(p => p.setVisible(v)); },
        destroy() { [bgGfx, border, topBar].forEach(p => p.destroy()); }
    };
}

function createPanel(scene, x, y, w, h, opts) {
    const gfx = scene.add.graphics();
    drawPanel(gfx, x, y, w, h, opts);
    return gfx;
}

function addSectionLabel(scene, x, y, text, color) {
    return scene.add.text(x, y, text, {
        fontSize: '10px',
        fill: colorHex(color || C.gold),
        fontFamily: UI_FONT,
        fontStyle: 'bold'
    }).setOrigin(0, 0.5).setAlpha(0.82);
}

console.log('UI Kit v3 loaded - Fate Battle premium front-end');
