/* eslint-disable @typescript-eslint/no-explicit-any */

export class TypeID<T> {
    constructor(public readonly id: string) {}
}

export class DependentPair {
    private constructor(private readonly tid: TypeID<any>, private readonly value: any) {}
    public cast<T>(expected: TypeID<T>): undefined | T {
        if (this.tid.id === expected.id) return this.value;
        else return undefined;
    }
    public static create<T>(tid: TypeID<T>, value: T) {
        return new DependentPair(tid, value);
    }
}

export class PropertyBag {
    private mapping: Map<string, any> = new Map();
    public set<T>(tid: TypeID<T>, value: T) {
        this.mapping.set(tid.id, value);
    }
    public get<T>(tid: TypeID<T>): undefined | T {
        return this.mapping.get(tid.id);
    }
    public delete<T>(tid: TypeID<T>) {
        this.mapping.delete(tid.id);
    }
    public *entries(): IterableIterator<DependentPair> {
        for (const [id, value] of this.mapping) {
            yield DependentPair.create(new TypeID<any>(id), value);
        }
    }
}
