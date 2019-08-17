export interface Access<T> {
    get(): T;
    set(x: T): void;
}

export namespace Access {
    export interface Read<T> {
        get(): T;
    }
    export interface Write<T> {
        set(x: T): void;
    }
}

export class State<T> implements Access<T> {
    constructor(private value: T) {}
    public get() {
        return this.value;
    }
    public set(x: T) {
        this.value = x;
    }
}
