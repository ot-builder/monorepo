import { BinaryView, Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Fvar } from "@ot-builder/ft-metadata";
import { GlyphIdentity } from "@ot-builder/test-util";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";

import { CffCharStringInterpStateImpl } from "../char-string/read/interpret-state";
import { interpretCharString } from "../char-string/read/interpreter";
import { CffGlyphBuilder } from "../char-string/read/shape-building";
import { CffDrawCall } from "../char-string/write/draw-call";
import { codeGenGlyph } from "../char-string/write/draw-call-gen";
import {
    cffOptimizeDrawCall,
    DrawCallOptimizationPass
} from "../char-string/write/draw-call-optimize/general";
import { CharStringEncoder } from "../char-string/write/encoder";
import { Mir } from "../char-string/write/mir";
import { CffWriteContext } from "../context/write";

export function singleGlyphCodeGenRoundTrip(
    cffVersion: number,
    glyph: OtGlyph,
    optimizationCtr: (ctx: CffWriteContext) => Array<DrawCallOptimizationPass<unknown>>,
    fvar?: Fvar.Table
) {
    const wCtx = new CffWriteContext(cffVersion, 1000, !!fvar);
    const drawCalls = [
        ...cffOptimizeDrawCall(codeGenGlyph(wCtx, 0, glyph), optimizationCtr(wCtx))
    ];
    const irSeq = Mir.toInterpIrSeq(CffDrawCall.charStringSeqToMir(wCtx, drawCalls));
    const frag = new Frag();
    const encoder = new CharStringEncoder(frag);
    for (const ir of irSeq) encoder.push(ir);
    const buf = Frag.pack(frag);

    let rIVS: null | ReadTimeIVS;
    if (fvar) {
        const designSpace = fvar.getDesignSpace();
        const bIVS = Frag.pack(new Frag().push(WriteTimeIVS, wCtx.ivs!, designSpace));
        rIVS = new BinaryView(bIVS).next(ReadTimeIVS, designSpace);
    } else {
        rIVS = null;
    }

    const glyph1 = OtGlyph.create();
    const gb = new CffGlyphBuilder(glyph1);
    const st = new CffCharStringInterpStateImpl(rIVS);
    interpretCharString(
        buf,
        st,
        { global: [], local: [], defaultWidthX: 0, nominalWidthX: 0 },
        gb
    );
    gb.endChar();

    GlyphIdentity.test(
        glyph,
        glyph1,
        GlyphIdentity.CompareMode.RemoveCycle | GlyphIdentity.CompareMode.CompareMetric
    );
}
