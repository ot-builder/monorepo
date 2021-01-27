import * as Crypto from "crypto";

const TY_BEGIN = 0x01;
const TY_END = 0x02;
const TY_STRING = 0x10;
const TY_NUMBER = 0x10;

export abstract class HashRep {
    public abstract transfer(h: Crypto.Hash): void;
}

class HrString extends HashRep {
    constructor(private readonly s: string) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        const bufRaw = Buffer.from(this.s, "utf-8");
        const bufDst = Buffer.allocUnsafe(bufRaw.byteLength + 8);
        bufDst.writeUInt32LE(TY_STRING, 0);
        bufDst.writeUInt32LE(bufRaw.byteLength, 4);
        bufRaw.copy(bufDst, 8);
        h.update(bufDst);
    }
}

class HrNumbers extends HashRep {
    constructor(private readonly s: ReadonlyArray<number>) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        const bufDst = Buffer.allocUnsafe(this.s.length * 8 + 8);
        bufDst.writeUInt32LE(TY_NUMBER, 0);
        bufDst.writeUInt32LE(this.s.length, 4);
        for (let index = 0; index < this.s.length; index++) {
            bufDst.writeDoubleLE(this.s[index] || 0, 8 + index * 8);
        }
        h.update(bufDst);
    }
}

class HrFlags extends HashRep {
    constructor(private readonly s: boolean[]) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        const bufDst = Buffer.allocUnsafe(this.s.length + 8);
        bufDst.writeUInt32LE(TY_NUMBER, 0);
        bufDst.writeUInt32LE(this.s.length, 4);
        for (let index = 0; index < this.s.length; index++) {
            bufDst.writeUInt8(this.s[index] ? 1 : 0, 8 + index);
        }
        h.update(bufDst);
    }
}

class HrBuffer extends HashRep {
    constructor(private readonly s: Buffer) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        const bufDst = Buffer.allocUnsafe(this.s.byteLength + 8);
        bufDst.writeUInt32LE(TY_NUMBER, 0);
        bufDst.writeUInt32LE(this.s.length, 4);
        this.s.copy(bufDst, 8);
        h.update(bufDst);
    }
}

class HrIsolate extends HashRep {
    constructor(private readonly r: HashRep) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        const bufBegin = Buffer.allocUnsafe(4);
        bufBegin.writeUInt32LE(TY_BEGIN, 0);

        const bufEnd = Buffer.allocUnsafe(4);
        bufEnd.writeUInt32LE(TY_END, 0);

        h.update(bufBegin);
        this.r.transfer(h);
        h.update(bufEnd);
    }
}

export class Hasher extends HashRep {
    private parts: HashRep[] = [];
    public transfer(h: Crypto.Hash) {
        for (const part of this.parts) part.transfer(h);
    }
    public string(s: string) {
        this.parts.push(new HrString(s));
        return this;
    }
    public number(...n: number[]) {
        this.parts.push(new HrNumbers(n));
        return this;
    }
    public flag(...n: boolean[]) {
        this.parts.push(new HrFlags(n));
        return this;
    }
    public numbers(n: ReadonlyArray<number>) {
        this.parts.push(new HrNumbers(n));
        return this;
    }
    public buffer(s: Buffer) {
        this.parts.push(new HrBuffer(s));
        return this;
    }
    public include(hr: HashRep) {
        const wrap = new HrIsolate(hr);
        this.parts.push(wrap);
        return this;
    }
    public begin() {
        const hasher = new Hasher();
        const wrap = new HrIsolate(hasher);
        this.parts.push(wrap);
        return hasher;
    }
    public beginSubObj(s: string) {
        this.string(s);
        return this.begin();
    }
}
