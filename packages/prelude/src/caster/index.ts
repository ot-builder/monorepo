export namespace Caster {
    export class TypeID<T> {
        constructor(public readonly id: string) {}
    }
    export interface IUnknown {
        queryInterface<T>(tag: TypeID<T>): undefined | T;
    }
    export function StandardQueryInterface<R, T>(
        obj: R,
        actual: TypeID<T>,
        expected: TypeID<R>
    ): undefined | T {
        if (expected.id === actual.id) return obj as any;
        return undefined;
    }
}
