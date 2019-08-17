import { BinaryView } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gpos, GsubGpos } from "@ot-builder/ft-layout";
import { Range } from "@ot-builder/prelude/lib/control";

import { LookupReader, SubtableReadingContext } from "../gsub-gpos-shared/general";
import { Ptr16GidCoverage } from "../shared/coverage";
import { NullablePtr16GposAnchor, Ptr16GposAnchor } from "../shared/gpos-anchor";

const MarkArray = {
    read(
        view: BinaryView,
        marks: Map<OtGlyph, Gpos.MarkRecord>,
        clsStart: number,
        cov: number[],
        ctx: SubtableReadingContext<GsubGpos.Lookup>
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
        ctx: SubtableReadingContext<GsubGpos.Lookup>
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
        bases: Map<OtGlyph, Gpos.LigatureRecord>,
        clsStart: number,
        clsCount: number,
        baseGlyph: OtGlyph,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) {
        const componentCount = view.uint16();
        for (const componentID of Range(0, componentCount)) {
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
        bases: Map<OtGlyph, Gpos.LigatureRecord>,
        clsStart: number,
        clsCount: number,
        cov: number[],
        ctx: SubtableReadingContext<GsubGpos.Lookup>
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
        ctx: SubtableReadingContext<GsubGpos.Lookup>
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
        bases: Map<OtGlyph, Gpos.LigatureRecord>,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
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
    implements LookupReader<GsubGpos.Lookup, Gpos.MarkToBase> {
    public createLookup() {
        return new Gpos.MarkToBase();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.MarkToBase,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) {
        this.readMarkToBaseSubtable(view, lookup.marks, lookup.bases, ctx);
    }
}
export class GposMarkToLigatureReader extends GposMarkReaderBase
    implements LookupReader<GsubGpos.Lookup, Gpos.MarkToLigature> {
    public createLookup() {
        return new Gpos.MarkToLigature();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.MarkToLigature,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) {
        this.readMarkToLigatureSubtable(view, lookup.marks, lookup.bases, ctx);
    }
}
export class GposMarkToMarkReader extends GposMarkReaderBase
    implements LookupReader<GsubGpos.Lookup, Gpos.MarkToMark> {
    public createLookup() {
        return new Gpos.MarkToMark();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.MarkToMark,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) {
        this.readMarkToBaseSubtable(view, lookup.marks, lookup.baseMarks, ctx);
    }
}
