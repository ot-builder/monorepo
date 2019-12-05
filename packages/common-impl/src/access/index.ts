import { Access } from "@ot-builder/prelude";

export class State<T> implements Access<T> {
    constructor(private value: T) {}
    public get() {
        return this.value;
    }
    public set(x: T) {
        this.value = x;
    }
}
