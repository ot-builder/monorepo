import {
    int16,
    int32,
    int8,
    SizeofUInt16,
    SizeofUInt32,
    SizeofUInt8,
    uint16,
    uint32,
    uint8
} from "./primitive-types";

export class BufferWriter {
    protected _capacity: number;
    protected _offset: number;
    protected _length: number;

    protected _wb: Buffer;

    public get capacity() {
        return this._capacity;
    }
    public get length() {
        return this._length;
    }
    public get currentOffset() {
        return this._offset;
    }
    public toBuffer() {
        return this._wb.slice(0, this.length);
    }

    constructor(cap: number = 0x40) {
        this._capacity = cap;
        this._wb = Buffer.allocUnsafe(cap);
        this._wb.fill(0);
        this._offset = 0;
        this._length = 0;
    }

    protected guard(len2write: number) {
        if (this._offset + len2write > this._capacity) {
            this._capacity = (this._offset + len2write) * 2;
            const wb1 = Buffer.allocUnsafe(this._capacity);
            this._wb.copy(wb1, 0, 0, this._length);
            wb1.fill(0, this._length, this._capacity);
            this._wb = wb1;
        }
        if (this._offset + len2write > this._length) {
            this._length = this._offset + len2write;
        }
    }

    public shrinkToFit() {
        this._capacity = this._length;
        const wb1 = Buffer.allocUnsafe(this._capacity);
        this._wb.copy(wb1, 0, 0, this._length);
        this._wb = wb1;
    }

    public seek(offset: number) {
        const oldOffset = this._offset;
        this._offset = offset;
        return oldOffset;
    }

    public bytes(b: Buffer) {
        this.guard(b.length);
        for (let index = 0, len = b.length; index < len; ++index) {
            this._wb.writeUInt8(b.readUInt8(index), this._offset);
            this._offset += SizeofUInt8;
        }
    }

    public int8(n: int8) {
        this.guard(SizeofUInt8);
        this._wb.writeInt8(n, this._offset);
        this._offset += SizeofUInt8;
    }

    public int16(n: int16) {
        this.guard(SizeofUInt16);
        this._wb.writeInt16BE(n, this._offset);
        this._offset += SizeofUInt16;
    }

    public int32(n: int32) {
        this.guard(SizeofUInt32);
        this._wb.writeInt32BE(n, this._offset);
        this._offset += SizeofUInt32;
    }

    public uint8(n: uint8) {
        this.guard(SizeofUInt8);
        this._wb.writeUInt8(n, this._offset);
        this._offset += SizeofUInt8;
    }

    public uint16(n: uint16) {
        this.guard(SizeofUInt16);
        this._wb.writeUInt16BE(n, this._offset);
        this._offset += SizeofUInt16;
    }

    public uint32(n: uint32) {
        this.guard(SizeofUInt32);
        this._wb.writeUInt32BE(n, this._offset);
        this._offset += SizeofUInt32;
    }
}
