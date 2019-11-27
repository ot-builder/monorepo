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

    // "Dependent pair"
    export class Sigma implements IUnknown {
        private constructor(private readonly tid: TypeID<any>, private readonly value: any) {}
        public queryInterface<T>(tag: TypeID<T>): undefined | T {
            return StandardQueryInterface(this.value, this.tid, tag);
        }

        public static create<T>(tid: TypeID<T>, value: T) {
            return new Sigma(tid, value);
        }
    }
}
