import { Caster } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { PointRef } from "./point";

export const TID_CffHintVisitor = new Caster.TypeID<CffHintVisitor>(
    "OTB::TrueType::TID_CffHintVisitor"
);
export interface CffHintVisitor extends GeneralGlyph.HintVisitorT<OtVar.Value> {
    visitHorizontalStem(stem: CffHintStem): void;
    visitVerticalStem(stem: CffHintStem): void;
    visitHintMask(stem: CffHintMask): void;
    visitCounterMask(stem: CffHintMask): void;
}

export class CffHintStem implements OtVar.Rectifiable {
    constructor(public start: OtVar.Value, public end: OtVar.Value) {}
    public rectifyCoords(rectify: OtVar.Rectifier) {
        this.start = rectify.coord(this.start);
        this.end = rectify.coord(this.end);
    }
}
export class CffHintMask {
    constructor(
        public at: PointRef,
        public maskH: Set<CffHintStem>,
        public maskV: Set<CffHintStem>
    ) {}
}
export class CffHint implements GeneralGlyph.HintT<OtVar.Value> {
    public hStems: CffHintStem[] = [];
    public vStems: CffHintStem[] = [];
    public hintMasks: CffHintMask[] = [];
    public counterMasks: CffHintMask[] = [];
    public rectifyCoords(rectify: OtVar.Rectifier) {
        for (const hs of this.hStems) hs.rectifyCoords(rectify);
        for (const vs of this.vStems) vs.rectifyCoords(rectify);
    }
    public acceptHintVisitor(hv: GeneralGlyph.HintVisitorT<OtVar.Value>) {
        const visitor = hv.queryInterface(TID_CffHintVisitor);
        if (!visitor) return;
        visitor.begin();
        for (const hs of this.hStems) visitor.visitHorizontalStem(hs);
        for (const vs of this.vStems) visitor.visitVerticalStem(vs);
        for (const hm of this.hintMasks) visitor.visitHintMask(hm);
        for (const cm of this.counterMasks) visitor.visitCounterMask(cm);
        visitor.end();
    }
    public duplicate() {
        const h1 = new CffHint();
        h1.hStems = this.hStems.map(s => new CffHintStem(s.start, s.end));
        h1.vStems = this.vStems.map(s => new CffHintStem(s.start, s.end));
        h1.hintMasks = this.hintMasks.map(s => new CffHintMask(s.at, s.maskH, s.maskV));
        h1.counterMasks = this.counterMasks.map(s => new CffHintMask(s.at, s.maskH, s.maskV));
        return h1;
    }
}
