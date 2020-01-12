import { Frag, FragPointerEmbedding } from "@ot-builder/bin-util";
import { Data } from "@ot-builder/prelude";

import { CffInterp } from "../interp/ir";
import { CffOperator } from "../interp/operator";

const EPSILON = 1e-8;
const ZERO = "0".charCodeAt(0);
const DOT = ".".charCodeAt(0);
const Em = "e".charCodeAt(0);
const E = "E".charCodeAt(0);
const MINUS = "-".charCodeAt(0);
const PLUS = "+".charCodeAt(0);

export class DictEncoder extends CffInterp.Encoder<Frag> {
    constructor(private frag: Frag) {
        super();
    }
    public operand(val: number) {
        if (Math.abs(val - Math.round(val)) < EPSILON) {
            // Value is integer -- encode as int
            return this.encodeInt(val);
        } else {
            return this.encodeReal(val);
        }
    }
    private encodeInt(val: number) {
        if (val >= -107 && val <= 107) {
            return this.frag.uint8(val + 139);
        } else if (val >= 108 && val <= 1131) {
            val -= 108;
            return this.frag.uint8((val >> 8) + 247).uint8(val & 0xff);
        } else if (val >= -1131 && val <= -108) {
            val = -108 - val;
            return this.frag.uint8((val >> 8) + 251).uint8(val & 0xff);
        } else if (val >= -32768 && val < 32768) {
            return this.frag.uint8(28).int16(val);
        } else {
            return this.frag.uint8(29).int32(val);
        }
    }

    // Generate a "short" string representation of a CFF real number
    // TODO: use Dragon or Ryu?
    private shortToString(val: number) {
        const direct = val.toString(10);
        const exp = val.toExponential(8);
        if (exp.length < direct.length) return exp;
        else return direct;
    }

    private encodeReal(val: number) {
        // Value is float
        const nibbles: number[] = [];
        const valStr = this.shortToString(val);
        for (let digit = 0; digit < valStr.length; ) {
            const cur = valStr.charCodeAt(digit);
            const next = digit < valStr.length - 1 ? valStr.charCodeAt(digit + 1) : 0;
            if (cur === DOT) {
                nibbles.push(0x0a);
                digit++;
            } else if (cur >= ZERO && cur <= ZERO + 9) {
                nibbles.push(cur - ZERO);
                digit++;
            } else if ((cur === Em || cur === E) && next === MINUS) {
                nibbles.push(0x0c);
                digit += 2;
            } else if ((cur === Em || cur === E) && next === PLUS) {
                nibbles.push(0x0b);
                digit += 2;
            } else if (cur === Em || cur === E) {
                nibbles.push(0x0b);
                digit += 1;
            } else if (cur === MINUS) {
                nibbles.push(0x0e);
                digit += 1;
            }
        }
        nibbles.push(0x0f);
        if (nibbles.length % 2) nibbles.push(0x0f);
        this.frag.uint8(30);
        for (let digit = 0; digit < nibbles.length; digit += 2) {
            this.frag.uint8((nibbles[digit] << 4) | nibbles[digit + 1]);
        }
    }

    protected operator(opCode: number, flags?: Data.Maybe<number[]>) {
        if ((opCode & 0xff00) === 0x0c00) {
            this.frag.uint8(0x0c).uint8(opCode & 0xff);
        } else {
            this.frag.uint8(opCode);
        }
        // Mask bits
        if (flags) {
            let maskByte: number = 0;
            let bits: number = 0;
            for (const bit of flags) {
                maskByte = (maskByte << 1) | (bit ? 1 : 0);
                bits++;
                if (bits === 8) {
                    this.frag.uint8(maskByte);
                    bits = 0;
                }
            }
            if (bits) {
                maskByte = maskByte << (8 - bits);
                this.frag.uint8(maskByte);
            }
        }
    }

    public absPointer(p: Frag | null, op: CffOperator) {
        this.frag.uint8(29);
        this.frag.ptr32(p, FragPointerEmbedding.Absolute);
        this.operator(op);
    }

    public embRelPointer(p: Frag | null, op: CffOperator) {
        this.frag.uint8(29);
        this.frag.ptr32(p, FragPointerEmbedding.EmbedRelative);
        this.operator(op);
    }
}
