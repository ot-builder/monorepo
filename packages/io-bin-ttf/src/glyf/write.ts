import { alignBufferSize, Frag, Write } from "@ot-builder/bin-util";
import * as ImpLib from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";
import { F2D14, Int8, UInt8 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import { TtfCfg } from "../cfg";
import { TtfWritingExtraInfoSink } from "../extra-info-sink/index";

import { CompositeGlyph, GlyphClassifier, SimpleGlyph } from "./classifier";
import { LocaTable } from "./loca";
import { ComponentFlag, GlyfOffsetAlign, SimpleGlyphFlag } from "./shared";

class FlagShrinker {
    constructor(private cfg: TtfCfg) {}
    private flags: number[] = [];
    private repeating = 0;
    private last = 0;
    private count = 0;
    public push(flag: number) {
        if (0 === this.count) {
            this.last = flag;
            this.flags.push(flag);
        } else if (flag !== this.last) {
            this.repeating = 0;
            this.last = flag;
            this.flags.push(flag);
        } else if (this.repeating && this.repeating < 0xff) {
            this.flags[this.flags.length - 1]++;
            this.repeating++;
        } else if (this.repeating === 0) {
            this.flags[this.flags.length - 1] |= SimpleGlyphFlag.REPEAT_FLAG;
            this.flags.push(1);
            this.repeating = 1;
        } else {
            this.repeating = 0;
            this.last = flag;
            this.flags.push(flag);
        }
        this.count++;
    }

    public finalizeAndGetFlags() {
        if (this.cfg.ttf.glyfIncludeOverlapSimpleFlag && this.flags.length) {
            this.flags[0] |= SimpleGlyphFlag.OVERLAP_SIMPLE;
        }
        return this.flags;
    }

    public static decideAndWrite(
        delta: number,
        flagShort: number,
        flagPosZero: number,
        fDelta: Frag
    ) {
        let flag = 0;
        if (delta === 0) {
            flag |= flagPosZero;
        } else if (delta > 0 && delta < 0x100) {
            flag |= flagShort | flagPosZero;
            fDelta.uint8(delta);
        } else if (delta < 0 && delta > -0x100) {
            flag |= flagShort;
            fDelta.uint8(-delta);
        } else {
            fDelta.int16(delta);
        }
        return flag;
    }
}

// TODO: could we optimize MORE?
function collectSimpleGlyphOutlineData(sg: SimpleGlyph, cfg: TtfCfg) {
    let endPtsOfContours = -1;
    const endPtsOfContoursArray = [];
    const shrinker = new FlagShrinker(cfg);
    const fragX = new Frag();
    const fragY = new Frag();

    let cx = 0,
        cy = 0;
    for (const geom of sg.outlines) {
        for (const contour of geom.contours) {
            endPtsOfContours += contour.length;
            endPtsOfContoursArray.push(endPtsOfContours);
            for (const z of contour) {
                const px = ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(z.x));
                const py = ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(z.y));
                let flag =
                    z.kind === OtGlyph.PointType.Corner ? SimpleGlyphFlag.ON_CURVE_POINT : 0;

                flag |= FlagShrinker.decideAndWrite(
                    px - cx,
                    SimpleGlyphFlag.X_SHORT_VECTOR,
                    SimpleGlyphFlag.X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR,
                    fragX
                );
                flag |= FlagShrinker.decideAndWrite(
                    py - cy,
                    SimpleGlyphFlag.Y_SHORT_VECTOR,
                    SimpleGlyphFlag.Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR,
                    fragY
                );

                shrinker.push(flag);

                cx = px;
                cy = py;
            }
        }
    }

    return { flags: shrinker.finalizeAndGetFlags(), fragX, fragY, endPtsOfContoursArray };
}

const SimpleGlyphData = Write((frag: Frag, sg: SimpleGlyph, cfg: TtfCfg) => {
    const st = sg.getStatData();
    frag.int16(st.eigenContours)
        .int16(st.extent.xMin)
        .int16(st.extent.yMin)
        .int16(st.extent.xMax)
        .int16(st.extent.yMax);
    const analysis = collectSimpleGlyphOutlineData(sg, cfg);
    for (const zid of analysis.endPtsOfContoursArray) frag.uint16(zid);
    frag.uint16(sg.instructions.byteLength);
    frag.bytes(sg.instructions);
    for (const flag of analysis.flags) frag.uint8(flag);
    frag.embed(analysis.fragX);
    frag.embed(analysis.fragY);
});

function analyzeComponent(ref: OtGlyph.TtReference) {
    let flag = 0,
        arg1,
        arg2;
    if (ref.pointAttachment) {
        arg1 = ref.pointAttachment.outer.pointIndex;
        arg2 = ref.pointAttachment.inner.pointIndex;
        if (arg1 !== UInt8.from(arg1) || arg2 !== UInt8.from(arg2)) {
            flag |= ComponentFlag.ARG_1_AND_2_ARE_WORDS;
        }
    } else {
        arg1 = ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(ref.transform.dx));
        arg2 = ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(ref.transform.dy));
        flag |= ComponentFlag.ARGS_ARE_XY_VALUES;
        if (arg1 !== Int8.from(arg1) || arg2 !== Int8.from(arg2)) {
            flag |= ComponentFlag.ARG_1_AND_2_ARE_WORDS;
        }
    }

    if (ref.transform.scaledOffset) flag |= ComponentFlag.SCALED_COMPONENT_OFFSET;
    else flag |= ComponentFlag.UNSCALED_COMPONENT_OFFSET;
    if (ref.roundXyToGrid) flag |= ComponentFlag.ROUND_XY_TO_GRID;
    if (ref.useMyMetrics) flag |= ComponentFlag.USE_MY_METRICS;

    const { xx, xy, yx, yy } = ref.transform;
    if (xy || yx) flag |= ComponentFlag.WE_HAVE_A_TWO_BY_TWO;
    else if (F2D14.from(xx) !== 1 || F2D14.from(yy) !== 1) {
        if (F2D14.from(xx) === F2D14.from(yy)) {
            flag |= ComponentFlag.WE_HAVE_A_SCALE;
        } else {
            flag |= ComponentFlag.WE_HAVE_AN_X_AND_Y_SCALE;
        }
    }
    return { flag, arg1, arg2 };
}

function writeComponentArgs(frag: Frag, flag: number, arg1: number, arg2: number) {
    if (ComponentFlag.ARGS_ARE_XY_VALUES & flag) {
        if (ComponentFlag.ARG_1_AND_2_ARE_WORDS & flag) {
            frag.int16(arg1);
            frag.int16(arg2);
        } else {
            frag.int8(arg1);
            frag.int8(arg2);
        }
    } else {
        if (ComponentFlag.ARG_1_AND_2_ARE_WORDS & flag) {
            frag.uint16(arg1);
            frag.uint16(arg2);
        } else {
            frag.uint8(arg1);
            frag.uint8(arg2);
        }
    }
}
function writeComponentTransform(frag: Frag, flag: number, transform: OtGlyph.Transform2X3) {
    if (ComponentFlag.WE_HAVE_A_SCALE & flag) {
        frag.push(F2D14, transform.xx);
    } else if (ComponentFlag.WE_HAVE_AN_X_AND_Y_SCALE & flag) {
        frag.push(F2D14, transform.xx);
        frag.push(F2D14, transform.yy);
    } else if (ComponentFlag.WE_HAVE_A_TWO_BY_TWO & flag) {
        frag.push(F2D14, transform.xx); // xScale
        frag.push(F2D14, transform.xy); // scale01
        frag.push(F2D14, transform.yx); // scale10
        frag.push(F2D14, transform.yy); // yScale
    }
}
const CompositeGlyphData = Write(
    (
        frag: Frag,
        cg: CompositeGlyph,
        iGlyph: number,
        gOrd: Data.Order<OtGlyph>,
        extraInfoSink: TtfWritingExtraInfoSink
    ) => {
        const st = cg.getStatData();
        frag.int16(-1)
            .int16(st.extent.xMin)
            .int16(st.extent.yMin)
            .int16(st.extent.xMax)
            .int16(st.extent.yMax);
        for (let rid = 0; rid < cg.references.length; rid++) {
            const ref = cg.references[rid];
            let { flag, arg1, arg2 } = analyzeComponent(ref);
            if (rid === 0) flag |= ComponentFlag.OVERLAP_COMPOUND; // Always set overlapping flag
            if (rid + 1 < cg.references.length) flag |= ComponentFlag.MORE_COMPONENTS;
            else if (cg.instructions.byteLength) flag |= ComponentFlag.WE_HAVE_INSTRUCTIONS;

            const targetGID = gOrd.reverse(ref.to);

            frag.uint16(flag);
            frag.uint16(targetGID);
            writeComponentArgs(frag, flag, arg1, arg2);
            writeComponentTransform(frag, flag, ref.transform);
            if (flag & ComponentFlag.WE_HAVE_INSTRUCTIONS) {
                frag.uint16(cg.instructions.byteLength);
                frag.bytes(cg.instructions);
            }
            extraInfoSink.setComponentInfo(
                iGlyph,
                rid,
                flag,
                targetGID,
                arg1,
                arg2,
                ref.transform.xx, // xScale
                ref.transform.xy, // scale01
                ref.transform.yx, // scale10
                ref.transform.yy // yScale
            );
        }
    }
);

export const GlyfTableWrite = Write(
    (
        frag,
        gOrd: Data.Order<OtGlyph>,
        cfg: TtfCfg,
        outLoca: LocaTable,
        stat: OtGlyph.Stat.Sink,
        extraInfoSink: TtfWritingExtraInfoSink
    ) => {
        const sink = new StdGlyfDataSink(outLoca, frag);
        sink.begin();
        stat.setNumGlyphs(gOrd.length);
        const classifier = new GlyphClassifier(gOrd);
        for (let iGlyph = 0; iGlyph < gOrd.length; iGlyph++) {
            const glyph = gOrd.at(iGlyph);
            const cg = classifier.classify(glyph);
            cg.stat(stat);
            const fGlyph = new Frag();
            if (cg instanceof SimpleGlyph) {
                fGlyph.push(SimpleGlyphData, cg, cfg);
            } else if (cg instanceof CompositeGlyph) {
                fGlyph.push(CompositeGlyphData, cg, iGlyph, gOrd, extraInfoSink);
            }
            sink.add(fGlyph);
        }
        stat.settle();
        sink.end();
    }
);

class StdGlyfDataSink {
    constructor(
        private readonly loca: LocaTable,
        private readonly frag: Frag
    ) {}
    private offset = 0;
    public begin() {}
    public add(fGlyph: Frag) {
        this.loca.glyphOffsets.push(this.offset);
        const bGlyph = alignBufferSize(Frag.pack(fGlyph), GlyfOffsetAlign);
        this.frag.bytes(bGlyph);
        this.offset += bGlyph.byteLength;
    }
    public end() {
        this.loca.glyphOffsets.push(this.offset);
    }
}
