export as namespace BattleCore;

export type Team = 'player' | 'enemy';

export interface Position {
    x: number;
    y: number;
}

export interface MapTile {
    baseColor: number;
    walkable: boolean;
}

export interface BattleConfig {
    mapWidth: number;
    mapHeight: number;
    grassColor?: number;
    dirtColor?: number;
}

export interface InitialBattleState {
    mapWidth: number;
    mapHeight: number;
    mapTiles: MapTile[][];
    units: {
        player: Position;
        enemy: Position;
    };
}

export interface UnitState extends Position {
    team?: Team;
    attackRange?: number;
}

export interface FieldEffect extends Position {
    effect?: string;
}

export interface AttackUnitState {
    diceCount?: number;
    extraDice?: number;
    atkBuff?: number;
    burstMode?: number;
    burstAtkBonus?: number;
    burstRangeBonus?: number;
    projectedWeapon?: boolean;
    projectionBonus?: number;
    doubleDamage?: boolean;
}

export interface AttackDamageEvent {
    type: string;
    amount?: number;
    randomStrength?: number;
    turnsLeft?: number;
}

export interface AttackDamageResult {
    damage: number;
    randomStrength: number;
    randomDamage: number;
    attackerPatch: Partial<AttackUnitState>;
    events: AttackDamageEvent[];
}

export type RandomFn = () => number;

export const BATTLE_CONFIG: Readonly<Required<BattleConfig>>;

export function normalizeConfig(config?: Partial<BattleConfig>): Required<BattleConfig>;
export function rollFate(randomStrength: number, randomFn?: RandomFn): number;
export function rollSingleFate(randomFn?: RandomFn): number;
export function calculateAttackDamage(
    attacker: AttackUnitState,
    rollFn?: (randomStrength: number) => number
): AttackDamageResult;
export function generateRoomCode(length?: number, randomFn?: RandomFn): string;
export function generateInitialBattleState(
    config?: Partial<BattleConfig>,
    randomFn?: RandomFn
): InitialBattleState;
export function nextTurn(currentTurn: Team): Team;
export function manhattanDistance(a: Position, b: Position): number;
export function isInsideMap(x: number, y: number, config?: Partial<BattleConfig>): boolean;
export function isTileBlocked(fieldEffects: FieldEffect[], x: number, y: number): boolean;
export function getUnitAt(
    units: UnitState[],
    x: number,
    y: number,
    ignoreUnit?: UnitState
): UnitState | null;
export function getMoveTargets(
    unit: UnitState,
    units: UnitState[],
    fieldEffects: FieldEffect[],
    config?: Partial<BattleConfig>,
    rangeOverride?: number
): Position[];
export function getAttackTargets(
    unit: UnitState,
    units: UnitState[],
    range: number,
    config?: Partial<BattleConfig>
): UnitState[];
