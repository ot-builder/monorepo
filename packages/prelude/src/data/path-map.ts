class PathMapNode<Step, Value> {
    public value: Value | undefined;
    public further = new Map<Step, PathMapNode<Step, Value>>();

    public *entries(existing: Step[]): IterableIterator<[Step[], Value]> {
        if (this.value !== undefined) yield [existing, this.value];
        for (const [step, child] of this.further) {
            yield* child.entries([...existing, step]);
        }
    }
    public *postRootEntries(existing: Step[]): IterableIterator<[Step[], Value]> {
        if (this.value !== undefined) yield [existing, this.value];
        for (const [step, child] of this.further) {
            yield* child.postRootEntries([...existing, step]);
        }
    }
    public *values(): IterableIterator<Value> {
        if (this.value !== undefined) yield this.value;
        for (const child of this.further.values()) yield* child.values();
    }
}

export interface Allocator<A, R extends any[] = []> {
    next(...args: R): A;
}
export class IndexAllocator implements Allocator<number> {
    private index = 0;
    public next() {
        return this.index++;
    }
    get count() {
        return this.index;
    }
}

export class PathMapLens<Step, Value> {
    private current: PathMapNode<Step, Value>;
    constructor(node: PathMapNode<Step, Value>) {
        this.current = node;
    }
    public get() {
        return this.current.value;
    }
    public set(value: Value) {
        this.current.value = value;
    }
    public getOrPut(value: Value) {
        const existing = this.current.value;
        if (existing === undefined) {
            this.current.value = value;
            return value;
        } else {
            return existing;
        }
    }
    public getOrAlloc<R extends any[] = []>(alloc: Allocator<Value, R>, ...r: R) {
        const existing = this.current.value;
        if (existing === undefined) {
            const value = alloc.next(...r);
            this.current.value = value;
            return value;
        } else {
            return existing;
        }
    }
    public advance(step: Step) {
        const nextNode = this.current.further.get(step);
        if (nextNode) {
            this.current = nextNode;
            return true;
        } else {
            return false;
        }
    }
    public focusGet(steps: Iterable<Step>) {
        for (const step of steps) {
            const result = this.advance(step);
            if (!result) return false;
        }
        return true;
    }
    public advanceCreate(step: Step) {
        const nextNode = this.current.further.get(step);
        if (nextNode) {
            this.current = nextNode;
        } else {
            const n = new PathMapNode<Step, Value>();
            this.current.further.set(step, n);
            this.current = n;
        }
    }
    public focus(steps: Iterable<Step>) {
        for (const step of steps) {
            this.advanceCreate(step);
        }
    }
}

export class PathMap<Step, Value> {
    private root = new PathMapNode<Step, Value>();
    public createLens() {
        return new PathMapLens(this.root);
    }
    public get(steps: Iterable<Step>) {
        const lens = this.createLens();
        const focused = lens.focusGet(steps);
        if (!focused) return undefined;
        else return lens.get();
    }
    public set(steps: Iterable<Step>, value: Value) {
        const lens = this.createLens();
        lens.focus(steps);
        lens.set(value);
    }

    public entries() {
        return this.root.entries([]);
    }
    public postRootEntries() {
        return this.root.postRootEntries([]);
    }
    public values() {
        return this.root.values();
    }
}
