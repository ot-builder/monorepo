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
