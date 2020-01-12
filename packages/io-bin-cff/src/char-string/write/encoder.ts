import { Frag } from "@ot-builder/bin-util";
import { Data } from "@ot-builder/prelude";
import { F16D16 } from "@ot-builder/primitive";

import { CffInterp } from "../../interp/ir";

const EPSILON = 1 / 0x20000;

export class CharStringEncoder extends CffInterp.Encoder<Frag> {
    constructor(private frag: Frag) {
        super();
    }
    protected operand(val: number) {
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
        } else {
            return this.frag.uint8(28).int16(val);
        }
    }
    private encodeReal(val: number) {
        this.frag.uint8(0xff);
        this.frag.push(F16D16, val);
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

    public static measureOperand(val: number) {
        if (Math.abs(val - Math.round(val)) < EPSILON) {
            // Value is integer -- encode as int
            return CharStringEncoder.measureInt(val);
        } else {
            return CharStringEncoder.measureReal(val);
        }
    }
    public static measureInt(val: number) {
        if (val >= -107 && val <= 107) {
            return 1;
        } else if (val >= 108 && val <= 1131) {
            return 2;
        } else if (val >= -1131 && val <= -108) {
            return 2;
        } else {
            return 3;
        }
    }
    public static measureReal(val: number) {
        return 5;
    }
    public static measureOperator(opCode: number, flags?: Data.Maybe<number[]>) {
        let s;
        if ((opCode & 0xff00) === 0x0c00) {
            s = 2;
        } else {
            s = 1;
        }
        if (flags) {
            let maskByte: number = 0;
            let bits: number = 0;
            for (const bit of flags) {
                maskByte = (maskByte << 1) | (bit ? 1 : 0);
                bits++;
                if (bits === 8) {
                    s++;
                    bits = 0;
                }
            }
            if (bits) {
                maskByte = maskByte << (8 - bits);
                s++;
            }
        }
        return s;
    }
}
