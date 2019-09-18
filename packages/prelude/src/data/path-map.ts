export interface Allocator<A, R extends any[] = []> {
    next(...args: R): A;
}

export interface PathMapLens<Step, Value> {
    get(): Value | undefined;
    set(value: Value): void;
    getOrPut(value: Value): Value;
    getOrAlloc<R extends any[] = []>(alloc: Allocator<Value, R>, ...r: R): Value;
    advance(step: Step): boolean;
    focusGet(steps: Iterable<Step>): boolean;
    advanceCreate(step: Step): void;
    focus(steps: Iterable<Step>): void;
}

export interface PathMap<Step, Value> {
    createLens(): PathMapLens<Step, Value>;
    get(steps: Iterable<Step>): Value | undefined;
    set(steps: Iterable<Step>, value: Value): void;
    entries(): Iterable<[ReadonlyArray<Step>, Value]>;
    postRootEntries(): Iterable<[ReadonlyArray<Step>, Value]>;
    values(): Iterable<Value>;
}
