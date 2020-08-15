import * as crypto from "crypto";

import { Errors } from "@ot-builder/errors";
import { Data } from "@ot-builder/prelude";

import { Sized } from "./binary-view";
import { BufferWriter } from "./buffer-writer";
import { SizeofUInt16, SizeofUInt32 } from "./primitive-types";

export interface Write<T, A extends unknown[] = []> {
    write(target: Frag, t: T, ...args: A): void;
}
export interface WriteOpt<T, A extends unknown[] = []> {
    writeOpt(t: T, ...args: A): Data.Maybe<Frag>;
}
export function Write<T, A extends unknown[] = []>(
    proc: (frag: Frag, t: T, ...args: A) => void
): Write<T, A> {
    return { write: proc };
}
export function WriteOpt<T, A extends unknown[] = []>(
    proc: (t: T, ...args: A) => Data.Maybe<Frag>
): WriteOpt<T, A> {
    return { writeOpt: proc };
}
export interface FragHole<T, A extends unknown[] = []> {
    fill(p: T, ...args: A): void;
}

export interface FragPointerEmbedding {
    readonly id: string;
    getOffset(enclosure: number, embed: number, to: number): number;
}
export namespace FragPointerEmbedding {
    export const Absolute: FragPointerEmbedding = {
        id: "Absolute",
        getOffset: (enc, emb, to) => to
    };
    export const Relative: FragPointerEmbedding = {
        id: "Relative",
        getOffset: (enc, emb, to) => to - enc
    };
    export const EmbedRelative: FragPointerEmbedding = {
        id: "EmbedRelative",
        getOffset: (enc, emb, to) => to - enc - emb
    };
}

interface FragPointerRecord {
    to: null | Frag;
    targetOffset: number;
    size: number;
    offset: number;
    createdOffset: number;
    embedding: FragPointerEmbedding;
}

class FragHashSink {
    public forward = new Map<Frag, string>();
    public reward = new Map<string, Frag>();
    public resolve(frag: Frag) {
        const hash = this.forward.get(frag);
        if (!hash) return frag;
        else return this.reward.get(hash) || frag;
    }
    public add(frag: Frag, hash: string) {
        this.forward.set(frag, hash);
        if (!this.reward.has(hash)) this.reward.set(hash, frag);
    }
}

export class Frag {
    private bw = new BufferWriter();
    public pointers: FragPointerRecord[] = [];

    public get size() {
        return this.bw.length;
    }
    public push<T, A extends unknown[], TW extends T, AW extends A>(
        builder: Write<T, A>,
        obj: TW,
        ...args: AW
    ) {
        builder.write(this, obj, ...args);
        return this;
    }
    public array<T, A extends unknown[], TW extends T, AW extends A>(
        builder: Write<T, A>,
        objects: readonly TW[],
        ...args: AW
    ) {
        for (const obj of objects) {
            builder.write(this, obj, ...args);
        }
        return this;
    }
    public arrayN<T, A extends unknown[], TW extends T, AW extends A>(
        builder: Write<T, A>,
        count: number,
        objects: readonly TW[],
        ...args: AW
    ) {
        for (let index = 0; index < count; index++) {
            const obj = objects[index];
            builder.write(this, obj, ...args);
        }
        return this;
    }
    public arrayNF<T, A extends unknown[], TW extends T, AW extends A>(
        builder: Write<T, A>,
        count: number,
        objects: readonly (TW | undefined)[],
        fallback: TW,
        ...args: AW
    ) {
        for (let index = 0; index < count; index++) {
            let obj = objects[index];
            if (obj === undefined) obj = fallback;
            builder.write(this, obj, ...args);
        }
        return this;
    }
    public reserve<T, A extends unknown[], TW extends T, AW extends A>(
        builder: Write<T, A> & Sized
    ): FragHole<T, A> {
        const offset = this.bw.currentOffset;
        for (let mu = 0; mu < builder.size; mu++) this.uint8(0); // Fill 0
        return {
            fill: (obj: TW, ...args: AW) => {
                const curOffset = this.bw.seek(offset);
                this.push<T, A, TW, AW>(builder, obj, ...args);
                this.bw.seek(curOffset);
            }
        };
    }
    public bytes(buf: Buffer) {
        this.bw.bytes(buf);
        return this;
    }
    public uint8(x: number) {
        this.bw.uint8((x << 24) >>> 24);
        return this;
    }
    public uint16(x: number) {
        this.bw.uint16((x << 16) >>> 16);
        return this;
    }
    public uint32(x: number) {
        this.bw.uint32(x >>> 0);
        return this;
    }
    public int8(x: number) {
        this.bw.int8((x << 24) >> 24);
        return this;
    }
    public int16(x: number) {
        this.bw.int16((x << 16) >> 16);
        return this;
    }
    public int32(x: number) {
        this.bw.int32(x >> 0);
        return this;
    }
    public ptr16(to: null | Frag, embedding = FragPointerEmbedding.Relative, targetOffset = 0) {
        const offset = this.bw.currentOffset;
        this.bw.uint16(0);
        this.pointers.push({
            to,
            offset,
            createdOffset: offset,
            size: SizeofUInt16,
            embedding,
            targetOffset
        });
        return this;
    }
    public ptr32(to: null | Frag, embedding = FragPointerEmbedding.Relative, targetOffset = 0) {
        const offset = this.bw.currentOffset;
        this.bw.uint32(0);
        this.pointers.push({
            to,
            offset,
            createdOffset: offset,
            size: SizeofUInt32,
            embedding,
            targetOffset
        });
        return this;
    }
    public ptr16New(embedding = FragPointerEmbedding.Relative) {
        const to = new Frag();
        this.ptr16(to, embedding);
        return to;
    }
    public ptr32New(embedding = FragPointerEmbedding.Relative) {
        const to = new Frag();
        this.ptr32(to, embedding);
        return to;
    }
    public embed(frag: Frag) {
        const start = this.bw.currentOffset;
        this.bw.bytes(frag.bw.toBuffer());
        for (const ptr of frag.pointers) {
            this.pointers.push({ ...ptr, offset: ptr.offset + start });
        }
        return this;
    }
    public clone() {
        const frag = new Frag();
        frag.embed(this);
        return frag;
    }
    public deepClone() {
        const c = this.clone();
        for (const ptr of this.pointers) {
            if (ptr.to) ptr.to = ptr.to.deepClone();
        }
        return c;
    }
    public getDataBuffer() {
        return this.bw.toBuffer();
    }

    // Static methods
    public static pack(root: Frag) {
        return new Packing().pack(root);
    }
    public static packMany(roots: ReadonlyArray<Frag>) {
        return new Packing().packMany(roots);
    }
    /** In-place consolidation */
    public static consolidate(root: Frag) {
        const buf = new Packing().pack(root);
        root.pointers = [];
        root.bw = new BufferWriter();
        root.bw.bytes(buf);
        return root;
    }

    // Generic initializer
    public static from<T, A extends unknown[], TW extends T, AW extends A>(
        builder: Write<T, A>,
        t: TW,
        ...a: AW
    ) {
        return new Frag().push<T, A, TW, AW>(builder, t, ...a);
    }
    public static packFrom<T, A extends unknown[], TW extends T, AW extends A>(
        builder: Write<T, A>,
        t: TW,
        ...a: AW
    ) {
        return Frag.pack(new Frag().push<T, A, TW, AW>(builder, t, ...a));
    }
    public static solidFrom<T, A extends unknown[], TW extends T, AW extends A>(
        builder: Write<T, A>,
        t: TW,
        ...a: AW
    ) {
        const buf = Frag.pack(new Frag().push<T, A, TW, AW>(builder, t, ...a));
        return new Frag().bytes(buf);
    }
    // Quick initializer
    public static uint8(x: number) {
        return new Frag().uint8(x);
    }
    public static uint16(x: number) {
        return new Frag().uint16(x);
    }
    public static uint32(x: number) {
        return new Frag().uint32(x);
    }
    public static int8(x: number) {
        return new Frag().int8(x);
    }
    public static int16(x: number) {
        return new Frag().int16(x);
    }
    public static int32(x: number) {
        return new Frag().int32(x);
    }
    // pointers
    public static ptr16(x: Frag, embedding = FragPointerEmbedding.Relative) {
        return new Frag().ptr16(x, embedding);
    }
    public static ptr32(x: Frag, embedding = FragPointerEmbedding.Relative) {
        return new Frag().ptr32(x, embedding);
    }
}

class Sorter {
    private marked = new Set<Frag>();
    private sorted: Frag[] = [];

    constructor() {}

    private visitUnmarked(f: Frag) {
        for (let size = 4; size > 0; size--) {
            for (let pid = f.pointers.length; pid-- > 0; ) {
                const ptr = f.pointers[pid];
                if (!ptr.to || ptr.size !== size) continue;
                this.dfsVisit(ptr.to);
            }
        }
        this.marked.add(f);
        this.sorted.unshift(f);
    }
    private dfsVisit(f: Frag) {
        if (!this.marked.has(f)) {
            this.visitUnmarked(f);
        }
    }

    public sort(root: Frag) {
        this.dfsVisit(root);
        return this.sorted;
    }
}

class Packing {
    public hash(frag: Frag, sink: FragHashSink) {
        const h = crypto.createHash("sha256");
        h.update(frag.getDataBuffer());
        for (const ptr of frag.pointers) {
            const targetHash = ptr.to ? this.hash(ptr.to, sink) : "NULL";
            h.update(
                `{${ptr.size},${ptr.offset},${ptr.createdOffset},${ptr.embedding.id},${targetHash}}`
            );
        }
        const result = h.digest("hex");
        sink.add(frag, result);
        return result;
    }

    public shareBlocks(root: Frag) {
        const sink = new FragHashSink();
        this.hash(root, sink);
        for (const frag of sink.forward.keys()) {
            for (const ptr of frag.pointers) {
                if (!ptr.to) continue;
                ptr.to = sink.resolve(ptr.to);
            }
        }
    }

    private allocateOffsets(root: Frag) {
        const sorted = new Sorter().sort(root);
        const offsets = new Map<Frag, number>();
        let currentOffset = 0;
        for (const b of sorted) {
            offsets.set(b, currentOffset);
            currentOffset += b.size;
        }
        return offsets;
    }

    private getPointerOffset(offsets: Map<Frag, number>, frag: Frag, ptr: FragPointerRecord) {
        if (!ptr.to) return 0;
        return ptr.embedding.getOffset(
            offsets.get(frag) || 0,
            ptr.offset - ptr.createdOffset,
            (offsets.get(ptr.to) || 0) + ptr.targetOffset
        );
    }

    private deOverflow(root: Frag) {
        let rounds = 0;
        let overflows = 0;
        let offsets: Map<Frag, number>;
        do {
            overflows = 0;
            offsets = this.allocateOffsets(root);
            for (const frag of offsets.keys()) {
                for (const ptr of frag.pointers) {
                    const targetValue = this.getPointerOffset(offsets, frag, ptr);
                    const maxPtrValue = ptr.size === 4 ? 0x100000000 : 0x10000;
                    if (targetValue < 0 || (ptr.to && targetValue === 0)) {
                        throw Errors.Binary.PointerUnderflow();
                    }
                    if (targetValue >= maxPtrValue) {
                        if (ptr.to) ptr.to = ptr.to.clone();
                        overflows += 1;
                    }
                }
            }
            rounds += 1;
        } while (overflows && rounds < 0x100);

        if (overflows) throw Errors.Binary.UnresolvableFragOverflow();
        return offsets;
    }

    private writePointer(
        b: BufferWriter,
        enclosure: number,
        ptr: FragPointerRecord,
        value: number
    ) {
        switch (ptr.size) {
            case 2:
                b.seek(enclosure + ptr.offset), b.uint16(value);
                break;
            case 4:
                b.seek(enclosure + ptr.offset), b.uint32(value);
                break;
            default:
                throw Errors.Binary.UnknownPointerType();
        }
    }

    private serialize(offsets: Map<Frag, number>) {
        const b = new BufferWriter();
        for (const [block, offset] of offsets) {
            b.seek(offset);
            b.bytes(block.getDataBuffer());
            for (const ptr of block.pointers) {
                this.writePointer(b, offset, ptr, this.getPointerOffset(offsets, block, ptr));
            }
        }
        return b.toBuffer();
    }

    public pack(root: Frag) {
        if (!root.pointers.length) return root.getDataBuffer();

        this.shareBlocks(root);
        const offsets = this.deOverflow(root);
        return this.serialize(offsets);
    }

    public packMany(roots: ReadonlyArray<Frag>) {
        const virtualRoot = new Frag();
        for (const root of roots) virtualRoot.ptr32(root, FragPointerEmbedding.Absolute);
        this.shareBlocks(virtualRoot);
        const offsets = this.deOverflow(virtualRoot);
        const buffer = this.serialize(offsets);
        const rootOffsets = virtualRoot.pointers.map(
            ptr => offsets.get(ptr.to!)! - virtualRoot.size
        );
        return {
            buffer: buffer.slice(virtualRoot.size),
            rootOffsets
        };
    }
}
