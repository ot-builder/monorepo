export interface Thunk<T> {
    force(): T;
}
export function Delay<T>(fn: () => T): Thunk<T> {
    return new ThunkImpl(fn);
}
export function Const<T>(x: T): Thunk<T> {
    return { force: () => x };
}

class ThunkImpl<T> implements Thunk<T> {
    constructor(fn: () => T) {
        this.force = () => {
            const ret = fn();
            this.force = () => ret;
            return ret;
        };
    }
    public force: () => T;
}
