import { BinaryView, Frag, Ranged, Read, Sized, Write } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";

export class Fixed implements Sized, Read<number, []>, Write<number, []>, Ranged {
    private readonly shiftBits: number; // Bits in total
    private readonly exponent: number; // Fraction exponent
    private readonly mask: number; // Bit masks
    public readonly size: number; // Size in bytes
    public readonly min: number; // minimum possible value
    public readonly max: number; // maximum possible value

    constructor(private readonly signed: boolean, integerBits: number, fractionBits: number) {
        this.shiftBits = 32 - integerBits - fractionBits;
        this.exponent = 1 << fractionBits;
        this.mask = (-1 << this.shiftBits) >>> this.shiftBits;
        this.size = Math.ceil((integerBits + fractionBits) / 8);
        if (this.signed) {
            const maxInt = this.clearMostSigBit(this.mask);
            this.min = this.fromUInt(maxInt - this.mask);
            this.max = this.fromUInt(maxInt);
        } else {
            this.min = 0;
            this.max = this.fromUInt(this.mask);
        }
    }

    private clearMostSigBit(n: number) {
        let mask = n;

        mask |= mask >>> 1;
        mask |= mask >>> 2;
        mask |= mask >>> 4;
        mask |= mask >>> 8;
        mask |= mask >>> 16;
        mask = mask >>> 1;

        return n & mask;
    }

    private fromUInt(n: number) {
        if (this.signed) {
            n = (n << this.shiftBits) >> this.shiftBits;
        } else {
            n = (n << this.shiftBits) >>> this.shiftBits;
        }
        return n / this.exponent;
    }

    private toUInt(x: number) {
        return ((x * this.exponent) & this.mask) >>> 0;
    }

    public from(x: number) {
        return this.fromUInt(this.toUInt(x));
    }

    public read(bp: BinaryView) {
        switch (this.size) {
            case 1:
                return this.fromUInt(bp.uint8());
            case 2:
                return this.fromUInt(bp.uint16());
            case 3:
                return this.fromUInt((bp.uint8() << 16) | bp.uint16());
            case 4:
                return this.fromUInt(bp.uint32());
            default:
                throw Errors.Primitives.UnsupportedIntSize();
        }
    }
    public write(bb: Frag, n: number) {
        switch (this.size) {
            case 1:
                bb.uint8(this.toUInt(n));
                break;
            case 2:
                bb.uint16(this.toUInt(n));
                break;
            case 3:
                const iv = this.toUInt(n);
                bb.uint8((iv >>> 16) & 0xff);
                bb.uint16(iv & 0xffff);
                break;
            case 4:
                bb.uint32(this.toUInt(n));
                break;
            default:
                throw Errors.Primitives.UnsupportedIntSize();
        }
    }
}

// Integers
export type UInt8 = number;
export type UInt16 = number;
export type UInt24 = number;
export type UInt32 = number;
export type Int8 = number;
export type Int16 = number;
export type Int24 = number;
export type Int32 = number;

export const UInt8 = new Fixed(false, 8, 0);
export const UInt16 = new Fixed(false, 16, 0);
export const UInt24 = new Fixed(false, 24, 0);
export const UInt32 = new Fixed(false, 32, 0);
export const Int8 = new Fixed(true, 8, 0);
export const Int16 = new Fixed(true, 16, 0);
export const Int24 = new Fixed(true, 24, 0);
export const Int32 = new Fixed(true, 32, 0);

export const UIntN = [UInt8, UInt16, UInt24, UInt32];
export const IntN = [Int8, Int16, Int24, Int32];

// GID alias
export type GID = UInt16;

// Fractions
export type F16D16 = number;
export type F24D6 = number;
export type F2D14 = number;

export const F16D16 = new Fixed(true, 16, 16);
export const F24D6 = new Fixed(true, 24, 6);
export const F2D14 = new Fixed(true, 2, 14);
