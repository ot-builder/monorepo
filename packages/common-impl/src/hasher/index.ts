import * as Crypto from "crypto";

const TY_BEGIN = 0x01;
const TY_END = 0x02;
const TY_STRING = 0x10;
const TY_NUMBER = 0x11;
const TY_FLAGS = 0x12;
const TY_BUFFER = 0x13;

const g_bufSize1 = Buffer.allocUnsafe(1);
const g_bufSize4 = Buffer.allocUnsafe(4);
const g_bufSize8 = Buffer.allocUnsafe(8);

function transferUInt8(h: Crypto.Hash, x: number) {
    g_bufSize1.writeUInt8(x, 0);
    h.update(g_bufSize1);
}
function transferUInt32(h: Crypto.Hash, x: number) {
    g_bufSize4.writeUInt32LE(x, 0);
    h.update(g_bufSize4);
}
function transferFloat64(h: Crypto.Hash, x: number) {
    g_bufSize8.writeDoubleLE(x, 0);
    h.update(g_bufSize8);
}

export abstract class HashRep {
    public abstract transfer(h: Crypto.Hash): void;
}

class HrString extends HashRep {
    constructor(private readonly s: string) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        const bufRaw = Buffer.from(this.s, "utf-8");
        transferUInt32(h, TY_STRING);
        transferUInt32(h, bufRaw.byteLength);
        h.update(bufRaw);
    }
}

class HrNumbers extends HashRep {
    constructor(private readonly s: ReadonlyArray<number>) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        transferUInt32(h, TY_NUMBER);
        transferUInt32(h, this.s.length);
        for (let index = 0; index < this.s.length; index++) {
            transferFloat64(h, this.s[index] || 0);
        }
    }
}

class HrFlags extends HashRep {
    constructor(private readonly s: boolean[]) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        transferUInt32(h, TY_FLAGS);
        transferUInt32(h, this.s.length);
        for (let index = 0; index < this.s.length; index++) {
            transferUInt8(h, this.s[index] ? 1 : 0);
        }
    }
}

class HrBuffer extends HashRep {
    constructor(private readonly s: Buffer) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        transferUInt32(h, TY_BUFFER);
        transferUInt32(h, this.s.byteLength);
        h.update(this.s);
    }
}

class HrIsolate extends HashRep {
    constructor(private readonly r: HashRep) {
        super();
    }
    public transfer(h: Crypto.Hash) {
        transferUInt32(h, TY_BEGIN);
        this.r.transfer(h);
        transferUInt32(h, TY_END);
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
