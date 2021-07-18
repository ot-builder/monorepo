/**
 * Factory that creates a PathMap
 */
export interface PathMapFactory {
    create<Step, Value>(iter?: Iterable<[ReadonlyArray<Step>, Value]>): PathMap<Step, Value>;
}

/**
 * A map that maps a path of objects to values
 */
export interface PathMap<Step, Value> {
    createLens(): PathMapLens<Step, Value>;
    get(steps: Iterable<Step>): Value | undefined;
    set(steps: Iterable<Step>, value: Value): void;
    entries(): Iterable<[ReadonlyArray<Step>, Value]>;
    postRootEntries(): Iterable<[ReadonlyArray<Step>, Value]>;
    values(): Iterable<Value>;
}

/**
 * A focus at a certain step point of a PathMap
 */
export interface PathMapLens<Step, Value> {
    get(): Value | undefined;
    set(value: Value): void;
    getOrPut(value: Value): Value;
    getOrAlloc<R extends unknown[] = []>(alloc: PathMapAllocator<Value, R>, ...r: R): Value;
    advance(step: Step): boolean;
    focusGet(steps: Iterable<Step>): boolean;
    advanceCreate(step: Step): void;
    focus(steps: Iterable<Step>): void;
}

export interface PathMapAllocator<A, R extends unknown[] = []> {
    next(...args: R): A;
}
