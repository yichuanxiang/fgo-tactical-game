declare const module: { exports: unknown } | undefined;

declare namespace Phaser {
    namespace Math {
        function Between(min: number, max: number): number;
    }
}
