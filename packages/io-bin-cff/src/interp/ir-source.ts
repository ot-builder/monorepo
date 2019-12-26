import { BinaryView } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { F16D16 } from "@ot-builder/primitive";

import { CffInterp } from "./ir";

abstract class BinaryIrSource implements CffInterp.IrSource {
    protected view: BinaryView;
    private startCursor: number;
    private endCursor: number;

    constructor(rawView: BinaryView, size: number) {
        this.view = rawView.liftRelative(0);
        rawView.bytes(size);
        this.startCursor = this.view.cursor;
        this.endCursor = this.startCursor + size;
    }
    protected eof(): boolean {
        return this.view.cursor >= this.endCursor;
    }
    public abstract next(): CffInterp.IR | null;
}

function parseCffShortInt(view: BinaryView, leadByte: number) {
    if (32 <= leadByte && leadByte <= 246) {
        return CffInterp.operand(leadByte - 139);
    } else if (247 <= leadByte && leadByte <= 250) {
        const nextByte = view.uint8();
        return CffInterp.operand((leadByte - 247) * 256 + nextByte + 108);
    } else if (251 <= leadByte && leadByte <= 254) {
        const nextByte = view.uint8();
        return CffInterp.operand(-(leadByte - 251) * 256 - nextByte - 108);
    } else {
        throw Errors.Unreachable();
    }
}

export class CffDictIrSource extends BinaryIrSource {
    protected cffDictNibbles() {
        // CFF nibbles
        let nibs: number[] = [];
        while (true) {
            let b = this.view.uint8();
            let nib0 = b >> 4,
                nib1 = b & 0xf;
            if (nib0 !== 0xf) nibs.push(nib0);
            if (nib1 !== 0xf) nibs.push(nib1);
            if (nib0 === 0xf || nib1 === 0xf) break;
        }
        let s = "";
        let chars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ".", "e", "e-", "reserved", "-", "endOfNumber"];
        for (let nibIndex = 0; nibIndex < nibs.length; nibIndex++) {
            s += chars[nibs[nibIndex]];
        }
        return CffInterp.operand(parseFloat(s));
    }

    public next() {
        if (this.eof()) return null;
        const leadByte = this.view.uint8();

        if (leadByte === 28) {
            return CffInterp.operand(this.view.int16());
        } else if (leadByte === 29) {
            return CffInterp.operand(this.view.int32());
        } else if (leadByte === 30) {
            return this.cffDictNibbles();
        } else if (32 <= leadByte && leadByte <= 254) {
            return parseCffShortInt(this.view, leadByte);
        } else {
            // Operator
            if (leadByte === 12) {
                const nextByte = this.view.uint8();
                return CffInterp.operator(0x0c00 | nextByte);
            } else {
                return CffInterp.operator(leadByte);
            }
        }
    }
}

export class CharStringIrSource extends BinaryIrSource implements CffInterp.IrFlagPuller {
    public next() {
        if (this.eof()) return null;
        const leadByte = this.view.uint8();
        if (this.isOperator(leadByte)) {
            return this.parseOperator(leadByte);
        } else if (leadByte === 28) {
            return CffInterp.operand(this.view.int16());
        } else if (32 <= leadByte && leadByte <= 254) {
            return parseCffShortInt(this.view, leadByte);
        } else if (leadByte === 255) {
            return CffInterp.operand(this.view.next(F16D16));
        } else {
            throw Errors.Cff.UnknownToken();
        }
    }

    private isOperator(leadByte: number) {
        return (leadByte > 0 && leadByte <= 27) || (leadByte >= 29 && leadByte <= 31);
    }

    private parseOperator(leadByte: number) {
        let opCode: number;
        if (leadByte === 12) {
            const nextByte = this.view.uint8();
            opCode = (leadByte << 8) | nextByte;
        } else {
            opCode = leadByte;
        }
        return CffInterp.operator(opCode);
    }

    public pullFlags(stemCount: number) {
        const maskLength = (stemCount + 7) >> 3;
        const mask: number[] = [];
        for (let byte = 0; byte < maskLength; byte++) {
            const maskByte = this.view.uint8();
            mask[(byte << 3) + 0] = (maskByte >> 7) & 1;
            mask[(byte << 3) + 1] = (maskByte >> 6) & 1;
            mask[(byte << 3) + 2] = (maskByte >> 5) & 1;
            mask[(byte << 3) + 3] = (maskByte >> 4) & 1;
            mask[(byte << 3) + 4] = (maskByte >> 3) & 1;
            mask[(byte << 3) + 5] = (maskByte >> 2) & 1;
            mask[(byte << 3) + 6] = (maskByte >> 1) & 1;
            mask[(byte << 3) + 7] = (maskByte >> 0) & 1;
        }
        return mask;
    }
}
