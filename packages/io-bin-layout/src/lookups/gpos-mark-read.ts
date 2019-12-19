import { BinaryView } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gpos } from "@ot-builder/ft-layout";

import { LookupReader, SubtableReadingContext } from "../gsub-gpos-shared/general";
import { Ptr16GidCoverage } from "../shared/coverage";
import { NullablePtr16GposAnchor, Ptr16GposAnchor } from "../shared/gpos-anchor";

const MarkArray = {
    read(
        view: BinaryView,
        marks: Map<OtGlyph, Gpos.MarkRecord>,
        clsStart: number,
        cov: number[],
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        const markCount = view.uint16();
        Assert.SizeMatch(`MarkArray::markCount`, markCount, cov.length);

        for (let gidMark of cov) {
            const markClass = view.uint16();
            const markAnchor = view.next(Ptr16GposAnchor, ctx.ivs);

            const markGlyph = ctx.gOrd.at(gidMark);
            let rec = marks.get(markGlyph);
            if (!rec) {
                rec = { markAnchors: [] };
                marks.set(markGlyph, rec);
            }
            rec.markAnchors[markClass + clsStart] = markAnchor;
        }
    }
};

const BaseArray = {
    read(
        view: BinaryView,
        bases: Map<OtGlyph, Gpos.BaseRecord>,
        clsStart: number,
        clsCount: number,
        cov: number[],
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        const baseCount = view.uint16();
        Assert.SizeMatch(`BaseArray::baseCount`, baseCount, cov.length);
        for (const gid of cov) {
            const baseGlyph = ctx.gOrd.at(gid);
            for (let cls = 0; cls < clsCount; cls++) {
                const anchor = view.next(NullablePtr16GposAnchor, ctx.ivs);
                let rec = bases.get(baseGlyph);
                if (!rec) {
                    rec = { baseAnchors: [] };
                    bases.set(baseGlyph, rec);
                }
                rec.baseAnchors[cls + clsStart] = anchor;
            }
        }
    }
};

const LigatureAttach = {
    read(
        view: BinaryView,
        bases: Map<OtGlyph, Gpos.LigatureBaseRecord>,
        clsStart: number,
        clsCount: number,
        baseGlyph: OtGlyph,
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        const componentCount = view.uint16();
        for (let componentID = 0; componentID < componentCount; componentID++) {
            for (let cls = 0; cls < clsCount; cls++) {
                const anchor = view.next(NullablePtr16GposAnchor, ctx.ivs);
                let rec = bases.get(baseGlyph);
                if (!rec) {
                    rec = { baseAnchors: [] };
                    bases.set(baseGlyph, rec);
                }
                if (!rec.baseAnchors[componentID]) rec.baseAnchors[componentID] = [];
                rec.baseAnchors[componentID][cls + clsStart] = anchor;
            }
        }
    }
};

const LigatureArray = {
    read(
        view: BinaryView,
        bases: Map<OtGlyph, Gpos.LigatureBaseRecord>,
        clsStart: number,
        clsCount: number,
        cov: number[],
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        const baseCount = view.uint16();
        Assert.SizeMatch(`BaseArray::baseCount`, baseCount, cov.length);
        for (const gid of cov) {
            const baseGlyph = ctx.gOrd.at(gid);
            view.ptr16().next(LigatureAttach, bases, clsStart, clsCount, baseGlyph, ctx);
        }
    }
};

class GposMarkReaderBase {
    protected getStartClass(marks: Iterable<[OtGlyph, Gpos.MarkRecord]>) {
        let sk = 0;
        for (const [glyph, rec] of marks) {
            for (let cls = 0; cls < rec.markAnchors.length; cls++) {
                if (rec.markAnchors[cls] && cls + 1 > sk) sk = cls + 1;
            }
        }
        return sk;
    }
    protected readMarkToBaseSubtable(
        view: BinaryView,
        marks: Map<OtGlyph, Gpos.MarkRecord>,
        bases: Map<OtGlyph, Gpos.BaseRecord>,
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        const format = view.uint16();
        Assert.FormatSupported(`MarkBasePosFormat1`, format, 1);

        const startClass = this.getStartClass(marks);
        const covMarks = view.next(Ptr16GidCoverage);
        const covBases = view.next(Ptr16GidCoverage);
        const markClassCount = view.uint16();
        view.ptr16().next(MarkArray, marks, startClass, covMarks, ctx);
        view.ptr16().next(BaseArray, bases, startClass, markClassCount, covBases, ctx);
    }
    protected readMarkToLigatureSubtable(
        view: BinaryView,
        marks: Map<OtGlyph, Gpos.MarkRecord>,
        bases: Map<OtGlyph, Gpos.LigatureBaseRecord>,
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        const format = view.uint16();
        Assert.FormatSupported(`MarkLigPosFormat1`, format, 1);

        const startClass = this.getStartClass(marks);
        const covMarks = view.next(Ptr16GidCoverage);
        const covBases = view.next(Ptr16GidCoverage);
        const markClassCount = view.uint16();
        view.ptr16().next(MarkArray, marks, startClass, covMarks, ctx);
        view.ptr16().next(LigatureArray, bases, startClass, markClassCount, covBases, ctx);
    }
}

export class GposMarkToBaseReader extends GposMarkReaderBase
    implements LookupReader<Gpos.Lookup, Gpos.MarkToBase> {
    public createLookup() {
        return Gpos.MarkToBase.create();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.MarkToBase,
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        this.readMarkToBaseSubtable(view, lookup.marks, lookup.bases, ctx);
    }
}
export class GposMarkToLigatureReader extends GposMarkReaderBase
    implements LookupReader<Gpos.Lookup, Gpos.MarkToLigature> {
    public createLookup() {
        return Gpos.MarkToLigature.create();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.MarkToLigature,
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        this.readMarkToLigatureSubtable(view, lookup.marks, lookup.bases, ctx);
    }
}
export class GposMarkToMarkReader extends GposMarkReaderBase
    implements LookupReader<Gpos.Lookup, Gpos.MarkToMark> {
    public createLookup() {
        return Gpos.MarkToMark.create();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.MarkToMark,
        ctx: SubtableReadingContext<Gpos.Lookup>
    ) {
        this.readMarkToBaseSubtable(view, lookup.marks, lookup.baseMarks, ctx);
    }
}
