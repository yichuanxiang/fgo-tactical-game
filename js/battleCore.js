// @ts-check
/**
 * @param {any} root
 * @param {() => any} factory
 */
(function attachBattleCore(root, factory) {
    const api = factory();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    root.BattleCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createBattleCore() {
    'use strict';

    /**
     * @typedef {'player' | 'enemy'} Team
     * @typedef {{ x: number, y: number }} Position
     * @typedef {{ baseColor: number, walkable: boolean }} MapTile
     * @typedef {{ mapWidth: number, mapHeight: number, grassColor?: number, dirtColor?: number }} BattleConfig
     * @typedef {{ mapWidth: number, mapHeight: number, grassColor: number, dirtColor: number }} NormalizedBattleConfig
     * @typedef {{ mapWidth: number, mapHeight: number, mapTiles: MapTile[][], units: { player: Position, enemy: Position } }} InitialBattleState
     * @typedef {{ x: number, y: number, team?: Team, attackRange?: number }} UnitState
     * @typedef {{ x: number, y: number, effect?: string }} FieldEffect
     * @typedef {{
     *   diceCount?: number,
     *   extraDice?: number,
     *   atkBuff?: number,
     *   burstMode?: number,
     *   burstAtkBonus?: number,
     *   burstRangeBonus?: number,
     *   projectedWeapon?: boolean,
     *   projectionBonus?: number,
     *   doubleDamage?: boolean
     * }} AttackUnitState
     * @typedef {{ type: string, amount?: number, randomStrength?: number, turnsLeft?: number }} AttackDamageEvent
     * @typedef {{
     *   damage: number,
     *   randomStrength: number,
     *   randomDamage: number,
     *   attackerPatch: Partial<AttackUnitState>,
     *   events: AttackDamageEvent[]
     * }} AttackDamageResult
     * @typedef {() => number} RandomFn
     */

    const BATTLE_CONFIG = Object.freeze({
        mapWidth: 12,
        mapHeight: 8,
        grassColor: 0x4a7c59,
        dirtColor: 0x8b7355
    });

    const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    /**
     * @param {Partial<BattleConfig>} [config]
     * @returns {NormalizedBattleConfig}
     */
    function normalizeConfig(config) {
        const source = config || {};
        return {
            mapWidth: source.mapWidth || BATTLE_CONFIG.mapWidth,
            mapHeight: source.mapHeight || BATTLE_CONFIG.mapHeight,
            grassColor: typeof source.grassColor === 'number' ? source.grassColor : BATTLE_CONFIG.grassColor,
            dirtColor: typeof source.dirtColor === 'number' ? source.dirtColor : BATTLE_CONFIG.dirtColor
        };
    }

    /**
     * @param {number} minInclusive
     * @param {number} maxExclusive
     * @param {RandomFn} [randomFn]
     * @returns {number}
     */
    function randomInt(minInclusive, maxExclusive, randomFn) {
        const random = randomFn || Math.random;
        return minInclusive + Math.floor(random() * (maxExclusive - minInclusive));
    }

    /**
     * Fate random roll: one continuous random value from n to n * 6.
     *
     * @param {number} randomStrength
     * @param {RandomFn} [randomFn]
     * @returns {number}
     */
    function rollFate(randomStrength, randomFn) {
        if (!Number.isInteger(randomStrength) || randomStrength <= 0) {
            throw new Error('randomStrength must be a positive integer');
        }

        return randomInt(randomStrength, randomStrength * 6 + 1, randomFn);
    }

    /**
     * @param {RandomFn} [randomFn]
     * @returns {number}
     */
    function rollSingleFate(randomFn) {
        return randomInt(1, 7, randomFn);
    }

    /**
     * @param {number} [length]
     * @param {RandomFn} [randomFn]
     * @returns {string}
     */
    function generateRoomCode(length, randomFn) {
        const codeLength = length || 6;
        let code = '';

        for (let i = 0; i < codeLength; i++) {
            code += ROOM_CODE_CHARS.charAt(randomInt(0, ROOM_CODE_CHARS.length, randomFn));
        }

        return code;
    }

    /**
     * @param {Partial<BattleConfig>} [config]
     * @param {RandomFn} [randomFn]
     * @returns {InitialBattleState}
     */
    function generateInitialBattleState(config, randomFn) {
        const battleConfig = normalizeConfig(config);
        const mapTiles = [];

        for (let y = 0; y < battleConfig.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < battleConfig.mapWidth; x++) {
                const isGrass = (randomFn || Math.random)() > 0.15;
                row.push({
                    baseColor: isGrass ? battleConfig.grassColor : battleConfig.dirtColor,
                    walkable: true
                });
            }
            mapTiles.push(row);
        }

        const player = {
            x: randomInt(0, Math.floor(battleConfig.mapWidth / 2), randomFn),
            y: randomInt(0, battleConfig.mapHeight, randomFn)
        };

        let enemy;
        do {
            enemy = {
                x: Math.floor(battleConfig.mapWidth / 2) + randomInt(0, Math.ceil(battleConfig.mapWidth / 2), randomFn),
                y: randomInt(0, battleConfig.mapHeight, randomFn)
            };
        } while (enemy.x === player.x && enemy.y === player.y);

        return {
            mapWidth: battleConfig.mapWidth,
            mapHeight: battleConfig.mapHeight,
            mapTiles,
            units: {
                player,
                enemy
            }
        };
    }

    /**
     * @param {Team} currentTurn
     * @returns {Team}
     */
    function nextTurn(currentTurn) {
        if (currentTurn === 'player') return 'enemy';
        if (currentTurn === 'enemy') return 'player';
        throw new Error(`Unknown turn: ${currentTurn}`);
    }

    /**
     * @param {Position} a
     * @param {Position} b
     * @returns {number}
     */
    function manhattanDistance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {Partial<BattleConfig>} [config]
     * @returns {boolean}
     */
    function isInsideMap(x, y, config) {
        const battleConfig = normalizeConfig(config);
        return x >= 0 && x < battleConfig.mapWidth && y >= 0 && y < battleConfig.mapHeight;
    }

    /**
     * @param {FieldEffect[]} fieldEffects
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    function isTileBlocked(fieldEffects, x, y) {
        return fieldEffects.some((effect) => effect.x === x && effect.y === y && effect.effect === 'block');
    }

    /**
     * @param {UnitState[]} units
     * @param {number} x
     * @param {number} y
     * @param {UnitState} [ignoreUnit]
     * @returns {UnitState | null}
     */
    function getUnitAt(units, x, y, ignoreUnit) {
        return units.find((unit) => unit !== ignoreUnit && unit.x === x && unit.y === y) || null;
    }

    /**
     * @param {UnitState} unit
     * @param {UnitState[]} units
     * @param {FieldEffect[]} fieldEffects
     * @param {Partial<BattleConfig>} [config]
     * @param {number} [rangeOverride]
     * @returns {Position[]}
     */
    function getMoveTargets(unit, units, fieldEffects, config, rangeOverride) {
        const battleConfig = normalizeConfig(config);
        const range = typeof rangeOverride === 'number' ? rangeOverride : 0;
        const targets = [];

        for (let y = 0; y < battleConfig.mapHeight; y++) {
            for (let x = 0; x < battleConfig.mapWidth; x++) {
                const distance = manhattanDistance(unit, { x, y });
                if (
                    distance <= range &&
                    distance > 0 &&
                    !getUnitAt(units, x, y, unit) &&
                    !isTileBlocked(fieldEffects, x, y)
                ) {
                    targets.push({ x, y });
                }
            }
        }

        return targets;
    }

    /**
     * @param {UnitState} unit
     * @param {UnitState[]} units
     * @param {number} range
     * @param {Partial<BattleConfig>} [config]
     * @returns {UnitState[]}
     */
    function getAttackTargets(unit, units, range, config) {
        return units.filter((target) => (
            target !== unit &&
            target.team !== unit.team &&
            isInsideMap(target.x, target.y, config) &&
            manhattanDistance(unit, target) <= range
        ));
    }

    /**
     * Calculates the non-UI part of a normal attack and returns the attacker
     * state changes that should be applied after the attack is committed.
     *
     * @param {AttackUnitState} attacker
     * @param {(randomStrength: number) => number} [rollFn]
     * @returns {AttackDamageResult}
     */
    function calculateAttackDamage(attacker, rollFn) {
        if (!attacker) {
            throw new Error('attacker is required');
        }

        const randomStrength = (attacker.diceCount || 0) + (attacker.extraDice || 0);
        const randomDamage = (rollFn || rollFate)(randomStrength);
        /** @type {Partial<AttackUnitState>} */
        const attackerPatch = {
            atkBuff: 0,
            extraDice: 0
        };
        /** @type {AttackDamageEvent[]} */
        const events = [
            { type: 'randomDamage', amount: randomDamage, randomStrength }
        ];
        let damage = attacker.atkBuff || 0;

        if ((attacker.burstMode || 0) > 0) {
            const burstBonus = attacker.burstAtkBonus || 0;
            const turnsLeft = (attacker.burstMode || 0) - 1;

            damage += burstBonus;
            attackerPatch.burstMode = turnsLeft;
            events.push({ type: 'burstBonus', amount: burstBonus, turnsLeft });

            if (turnsLeft === 0) {
                attackerPatch.burstAtkBonus = 0;
                attackerPatch.burstRangeBonus = 0;
                events.push({ type: 'burstExpired' });
            }
        }

        damage += randomDamage;

        if (attacker.projectedWeapon && attacker.projectionBonus) {
            damage += attacker.projectionBonus;
            attackerPatch.projectedWeapon = false;
            attackerPatch.projectionBonus = 0;
            events.push({ type: 'projectionBonus', amount: attacker.projectionBonus });
        }

        if (attacker.doubleDamage) {
            damage *= 2;
            attackerPatch.doubleDamage = false;
            events.push({ type: 'doubleDamage' });
        }

        return {
            damage,
            randomStrength,
            randomDamage,
            attackerPatch,
            events
        };
    }

    return Object.freeze({
        BATTLE_CONFIG,
        calculateAttackDamage,
        generateInitialBattleState,
        generateRoomCode,
        getAttackTargets,
        getMoveTargets,
        getUnitAt,
        isInsideMap,
        isTileBlocked,
        manhattanDistance,
        nextTurn,
        normalizeConfig,
        rollFate,
        rollSingleFate
    });
});
