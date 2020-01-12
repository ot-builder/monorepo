import { Errors } from "@ot-builder/errors";

import { SizeofUInt16, SizeofUInt32, SizeofUInt8 } from "./primitive-types";

export interface Read<T, A extends unknown[] = []> {
    read(view: BinaryView, ...args: A): T;
}
export function Read<T, A extends unknown[] = []>(
    proc: (view: BinaryView, ...args: A) => T
): Read<T, A> {
    return { read: proc };
}
export interface Sized {
    readonly size: number;
}
export interface Ranged {
    readonly min: number;
    readonly max: number;
}

export class BinaryView {
    constructor(
        protected readonly buffer: Buffer,
        public displace = 0,
        public cursor: number = displace
    ) {}

    get sourceBufferSize() {
        return this.buffer.byteLength;
    }

    public next<T, A extends unknown[], AR extends A>(inst: Read<T, A>, ...args: AR): T {
        return inst.read(this, ...args);
    }
    public array<T, A extends unknown[], AR extends A>(
        count: number,
        inst: Read<T, A>,
        ...args: AR
    ) {
        const arr: T[] = [];
        for (let mu = 0; mu < count; mu++) {
            arr[mu] = inst.read(this, ...args);
        }
        return arr;
    }

    /** Create a new BinaryView using an offset relative to current view's displacement. */
    public lift(offset: number) {
        return new BinaryView(this.buffer, this.displace + offset);
    }
    /** Create a new BinaryView using an offset relative to the current cursor. */
    public liftRelative(offset: number) {
        return new BinaryView(this.buffer, this.cursor + offset);
    }

    // Primitive methods
    public uint8() {
        const n = this.buffer.readUInt8(this.cursor);
        this.cursor += SizeofUInt8;
        return n;
    }
    public uint16() {
        const n = this.buffer.readUInt16BE(this.cursor);
        this.cursor += SizeofUInt16;
        return n;
    }
    public uint32() {
        const n = this.buffer.readUInt32BE(this.cursor);
        this.cursor += SizeofUInt32;
        return n;
    }
    public int8() {
        const n = this.buffer.readInt8(this.cursor);
        this.cursor += SizeofUInt8;
        return n;
    }
    public int16() {
        const n = this.buffer.readInt16BE(this.cursor);
        this.cursor += SizeofUInt16;
        return n;
    }
    public int32() {
        const n = this.buffer.readInt32BE(this.cursor);
        this.cursor += SizeofUInt32;
        return n;
    }
    public ptr16() {
        const v = this.uint16();
        if (v) return this.lift(v);
        else throw Errors.NullPtr();
    }
    public ptr16Nullable(): BinaryView | null {
        const v = this.uint16();
        if (v) return this.lift(v) as BinaryView | null;
        else return null;
    }
    public ptr32() {
        const v = this.uint32();
        if (v) return this.lift(v);
        else throw Errors.NullPtr();
    }
    public ptr32Nullable(): BinaryView | null {
        const v = this.uint32();
        if (v) return this.lift(v) as BinaryView | null;
        else return null;
    }
    public bytes(length: number) {
        const buf = this.buffer.slice(this.cursor, this.cursor + length);
        this.cursor += length;
        return buf;
    }

    public *repeat(count: number): IterableIterator<[BinaryView, number]> {
        for (let mu = 0; mu < count; mu++) {
            yield [this, mu];
        }
    }
}
