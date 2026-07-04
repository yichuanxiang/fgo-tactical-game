const assert = require('node:assert/strict');
const test = require('node:test');

const BattleCore = require('../www/js/battleCore');

test('rollFate uses the configured continuous random range', () => {
    assert.equal(BattleCore.rollFate(3, () => 0), 3);
    assert.equal(BattleCore.rollFate(3, () => 0.999), 18);
    assert.throws(() => BattleCore.rollFate(0), /positive integer/);
});

test('room codes use readable six character codes by default', () => {
    const code = BattleCore.generateRoomCode(6, () => 0);

    assert.equal(code, 'AAAAAA');
    assert.match(BattleCore.generateRoomCode(), /^[A-Z2-9]{6}$/);
});

test('initial battle state places players on opposite sides', () => {
    const state = BattleCore.generateInitialBattleState(
        { mapWidth: 4, mapHeight: 2, grassColor: 1, dirtColor: 2 },
        () => 0.5
    );

    assert.equal(state.mapWidth, 4);
    assert.equal(state.mapHeight, 2);
    assert.equal(state.mapTiles.length, 2);
    assert.equal(state.mapTiles[0].length, 4);
    assert.deepEqual(state.units.player, { x: 1, y: 1 });
    assert.deepEqual(state.units.enemy, { x: 3, y: 1 });
});

test('nextTurn rejects unknown turn ids', () => {
    assert.equal(BattleCore.nextTurn('player'), 'enemy');
    assert.equal(BattleCore.nextTurn('enemy'), 'player');
    assert.throws(() => BattleCore.nextTurn('neutral'), /Unknown turn/);
});

test('move targets ignore occupied and blocked tiles', () => {
    const player = { x: 1, y: 1, team: 'player' };
    const units = [
        player,
        { x: 2, y: 1, team: 'enemy' }
    ];
    const fieldEffects = [{ x: 1, y: 0, effect: 'block' }];
    const targets = BattleCore.getMoveTargets(
        player,
        units,
        fieldEffects,
        { mapWidth: 4, mapHeight: 3 },
        1
    );

    assert.deepEqual(targets, [
        { x: 0, y: 1 },
        { x: 1, y: 2 }
    ]);
});

test('attack targets include only opposing units in range', () => {
    const player = { x: 1, y: 1, team: 'player' };
    const nearEnemy = { x: 3, y: 1, team: 'enemy' };
    const farEnemy = { x: 3, y: 2, team: 'enemy' };
    const ally = { x: 0, y: 1, team: 'player' };
    const targets = BattleCore.getAttackTargets(
        player,
        [player, nearEnemy, farEnemy, ally],
        2,
        { mapWidth: 4, mapHeight: 3 }
    );

    assert.deepEqual(targets, [nearEnemy]);
});

test('normal attack damage calculation returns damage and consumed attacker state', () => {
    const result = BattleCore.calculateAttackDamage(
        {
            diceCount: 3,
            extraDice: 1,
            atkBuff: 5,
            burstMode: 1,
            burstAtkBonus: 7,
            burstRangeBonus: 1,
            projectedWeapon: true,
            projectionBonus: 4,
            doubleDamage: true
        },
        () => 10
    );

    assert.equal(result.randomStrength, 4);
    assert.equal(result.randomDamage, 10);
    assert.equal(result.damage, 52);
    assert.deepEqual(result.attackerPatch, {
        atkBuff: 0,
        extraDice: 0,
        burstMode: 0,
        burstAtkBonus: 0,
        burstRangeBonus: 0,
        projectedWeapon: false,
        projectionBonus: 0,
        doubleDamage: false
    });
    assert.deepEqual(result.events.map((event) => event.type), [
        'randomDamage',
        'burstBonus',
        'burstExpired',
        'projectionBonus',
        'doubleDamage'
    ]);
});

// ═══════════════════════════════════════════
// Additional rollFate edge cases
// ═══════════════════════════════════════════

test('rollFate rejects non-integer randomStrength', () => {
    assert.throws(() => BattleCore.rollFate(1.5), /positive integer/);
});

test('rollSingleFate returns 1-6', () => {
    assert.equal(BattleCore.rollSingleFate(() => 0), 1);
    assert.equal(BattleCore.rollSingleFate(() => 0.999), 6);
});

// ═══════════════════════════════════════════
// manhattanDistance
// ═══════════════════════════════════════════

test('manhattanDistance same position is 0', () => {
    assert.equal(BattleCore.manhattanDistance({ x: 3, y: 4 }, { x: 3, y: 4 }), 0);
});

test('manhattanDistance horizontal', () => {
    assert.equal(BattleCore.manhattanDistance({ x: 0, y: 0 }, { x: 5, y: 0 }), 5);
});

test('manhattanDistance diagonal', () => {
    assert.equal(BattleCore.manhattanDistance({ x: 1, y: 1 }, { x: 4, y: 5 }), 7);
});

// ═══════════════════════════════════════════
// isInsideMap
// ═══════════════════════════════════════════

test('isInsideMap accepts valid coordinates', () => {
    assert.ok(BattleCore.isInsideMap(0, 0));
    assert.ok(BattleCore.isInsideMap(11, 7));
    assert.ok(BattleCore.isInsideMap(6, 4));
});

test('isInsideMap rejects out-of-bounds coordinates', () => {
    assert.ok(!BattleCore.isInsideMap(-1, 0));
    assert.ok(!BattleCore.isInsideMap(0, -1));
    assert.ok(!BattleCore.isInsideMap(12, 0));
    assert.ok(!BattleCore.isInsideMap(0, 8));
});

test('isInsideMap respects custom config', () => {
    assert.ok(BattleCore.isInsideMap(3, 3, { mapWidth: 4, mapHeight: 4 }));
    assert.ok(!BattleCore.isInsideMap(4, 3, { mapWidth: 4, mapHeight: 4 }));
});

// ═══════════════════════════════════════════
// isTileBlocked
// ═══════════════════════════════════════════

test('isTileBlocked only matches block effects at exact position', () => {
    const effects = [
        { x: 3, y: 3, effect: 'block' },
        { x: 5, y: 5, effect: 'damage' }
    ];
    assert.ok(BattleCore.isTileBlocked(effects, 3, 3));
    assert.ok(!BattleCore.isTileBlocked(effects, 5, 5));
    assert.ok(!BattleCore.isTileBlocked(effects, 0, 0));
    assert.ok(!BattleCore.isTileBlocked([], 3, 3));
});

// ═══════════════════════════════════════════
// getUnitAt
// ═══════════════════════════════════════════

test('getUnitAt finds unit and respects ignoreUnit', () => {
    const u1 = { x: 3, y: 4 };
    const u2 = { x: 5, y: 6 };
    assert.equal(BattleCore.getUnitAt([u1, u2], 3, 4), u1);
    assert.equal(BattleCore.getUnitAt([u1, u2], 3, 4, u1), null);
    assert.equal(BattleCore.getUnitAt([u1, u2], 9, 9), null);
});

// ═══════════════════════════════════════════
// getMoveTargets — additional cases
// ═══════════════════════════════════════════

test('getMoveTargets range 0 returns empty', () => {
    const unit = { x: 5, y: 5 };
    assert.equal(BattleCore.getMoveTargets(unit, [unit], [], undefined, 0).length, 0);
});

test('getMoveTargets corner has fewer options', () => {
    const unit = { x: 0, y: 0 };
    const targets = BattleCore.getMoveTargets(unit, [unit], [], undefined, 1);
    assert.equal(targets.length, 2);
});

test('getMoveTargets range 2 returns diamond pattern', () => {
    const unit = { x: 5, y: 4 };
    const targets = BattleCore.getMoveTargets(unit, [unit], [], undefined, 2);
    assert.equal(targets.length, 12);
    assert.ok(targets.every(t => BattleCore.manhattanDistance(unit, t) <= 2));
    assert.ok(targets.every(t => BattleCore.manhattanDistance(unit, t) > 0));
});

// ═══════════════════════════════════════════
// calculateAttackDamage — additional cases
// ═══════════════════════════════════════════

test('calculateAttackDamage basic: atkBuff + rollFate', () => {
    const result = BattleCore.calculateAttackDamage(
        { diceCount: 2, atkBuff: 5 },
        () => 6
    );
    assert.equal(result.damage, 5 + 6);
    assert.equal(result.randomDamage, 6);
    assert.equal(result.attackerPatch.atkBuff, 0);
    assert.equal(result.attackerPatch.extraDice, 0);
});

test('calculateAttackDamage burst not expiring keeps range bonus', () => {
    const result = BattleCore.calculateAttackDamage(
        { diceCount: 2, burstMode: 3, burstAtkBonus: 8, burstRangeBonus: 2 },
        () => 2
    );
    assert.equal(result.damage, 2 + 8);
    assert.equal(result.attackerPatch.burstMode, 2);
    assert.equal(result.attackerPatch.burstRangeBonus, undefined);
});

test('calculateAttackDamage no projection bonus when no weapon', () => {
    const result = BattleCore.calculateAttackDamage(
        { diceCount: 1, projectedWeapon: false, projectionBonus: 15 },
        () => 1
    );
    assert.equal(result.damage, 1);
    assert.ok(!result.events.some(e => e.type === 'projectionBonus'));
});

test('calculateAttackDamage throws on null attacker', () => {
    assert.throws(() => BattleCore.calculateAttackDamage(null), /attacker is required/);
});

test('calculateAttackDamage zero dice throws via rollFate', () => {
    assert.throws(() => BattleCore.calculateAttackDamage({ diceCount: 0, extraDice: 0 }));
});

// ═══════════════════════════════════════════
// generateInitialBattleState — additional
// ═══════════════════════════════════════════

test('all generated tiles are walkable', () => {
    const state = BattleCore.generateInitialBattleState();
    for (const row of state.mapTiles) {
        for (const tile of row) {
            assert.equal(tile.walkable, true);
        }
    }
});

test('player and enemy never overlap across many runs', () => {
    for (let i = 0; i < 50; i++) {
        const state = BattleCore.generateInitialBattleState();
        const same = state.units.player.x === state.units.enemy.x &&
                     state.units.player.y === state.units.enemy.y;
        assert.ok(!same, `overlap at run ${i}`);
    }
});

// ═══════════════════════════════════════════
// generateRoomCode — additional
// ═══════════════════════════════════════════

test('generateRoomCode custom length', () => {
    assert.equal(BattleCore.generateRoomCode(4).length, 4);
    assert.equal(BattleCore.generateRoomCode(8).length, 8);
});

test('generateRoomCode is deterministic with seeded random', () => {
    let c1 = 0, c2 = 0;
    const r1 = () => { c1++; return (c1 * 0.13) % 1; };
    const r2 = () => { c2++; return (c2 * 0.13) % 1; };
    assert.equal(BattleCore.generateRoomCode(6, r1), BattleCore.generateRoomCode(6, r2));
});
