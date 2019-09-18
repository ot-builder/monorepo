import { BinaryView } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef, GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS } from "@ot-builder/var-store";

import { LookupFlag, LookupReader, LookupReaderFactory } from "./general";

///////////////////////////////////////////////////////////////////////////////////////////////////

export interface LookupReadContext {
    gOrd: Data.Order<OtGlyph>;
    gdef?: Data.Maybe<Gdef.Table>;
    ivs?: Data.Maybe<ReadTimeIVS>;
}

class CReadLookupList {
    private readExtensionSubtables(subtableViews: BinaryView[]) {
        let extensionLookupType: undefined | number = undefined;
        let realSubtables: BinaryView[] = [];
        for (const vSubTable of subtableViews) {
            const format = vSubTable.uint16();
            Assert.FormatSupported("ExtensionSubstFormat::format", format, 1);
            const type = vSubTable.uint16();
            if (extensionLookupType === undefined) extensionLookupType = type;
            Assert.FormatSupported(
                `ExtensionSubstFormat::extensionLookupType`,
                type,
                extensionLookupType || 0
            );
            realSubtables.push(vSubTable.ptr32());
        }
        if (!realSubtables.length || extensionLookupType == null) {
            throw Errors.Layout.EmptyExtensionLookup();
        }

        return { extensionLookupType, realSubtables };
    }

    private applyGdefClassDefIgnores(ignores: Set<OtGlyph>, flags: number, gdef: Gdef.Table) {
        if (gdef.glyphClassDef) {
            for (const [g, cls] of gdef.glyphClassDef) {
                if (flags & LookupFlag.IgnoreBaseGlyphs && cls === Gdef.GlyphClass.Base) {
                    ignores.add(g);
                }
                if (flags & LookupFlag.IgnoreMarks && cls === Gdef.GlyphClass.Mark) {
                    ignores.add(g);
                }
                if (flags & LookupFlag.IgnoreLigatures && cls === Gdef.GlyphClass.Ligature) {
                    ignores.add(g);
                }
            }
        }
    }
    private applyGdefMarkAttachDefIgnores(ignores: Set<OtGlyph>, flags: number, gdef: Gdef.Table) {
        if (gdef.markAttachClassDef && flags & LookupFlag.MarkAttachmentType) {
            const maCls = (flags & LookupFlag.MarkAttachmentType) >>> 16;
            for (const [g, cls] of gdef.markAttachClassDef) {
                if (cls === maCls) ignores.add(g);
            }
        }
    }
    private applyGdefMarkGlyphSetIgnores(
        ignores: Set<OtGlyph>,
        flags: number,
        markFilteringSet: Data.Maybe<number>,
        gdef: Gdef.Table
    ) {
        if (
            gdef.markGlyphSets &&
            flags & LookupFlag.UseMarkFilteringSet &&
            markFilteringSet != null
        ) {
            const mgs = gdef.markGlyphSets[markFilteringSet];
            if (mgs) {
                for (const g of mgs) {
                    ignores.add(g);
                }
            }
        }
    }

    private applyIgnoreSet<L extends GsubGpos.Lookup>(
        lookup: L,
        flags: number,
        markFilteringSet: Data.Maybe<number>,
        gdef: Data.Maybe<Gdef.Table>
    ) {
        if (flags & LookupFlag.RightToLeft) lookup.rightToLeft = true;
        if (!gdef) return;
        const ignores: Set<OtGlyph> = new Set();
        this.applyGdefClassDefIgnores(ignores, flags, gdef);
        this.applyGdefMarkAttachDefIgnores(ignores, flags, gdef);
        this.applyGdefMarkGlyphSetIgnores(ignores, flags, markFilteringSet, gdef);
        if (ignores.size) lookup.ignoreGlyphs = ignores;
    }

    public read(
        view: BinaryView,
        lrf: LookupReaderFactory<GsubGpos.Lookup>,
        lrc: LookupReadContext
    ) {
        const lookupCount = view.uint16();
        let lookups: GsubGpos.Lookup[] = [];
        let readers: LookupReader<GsubGpos.Lookup, any>[] = [];
        let subtables: BinaryView[][] = [];
        for (let lid = 0; lid < lookupCount; lid++) {
            const vLookup = view.ptr16();

            let lookupType = vLookup.uint16();
            const lookupFlag = vLookup.uint16();
            const subtableCount = vLookup.uint16();
            let subtableViews: BinaryView[] = [];
            for (let stid = 0; stid < subtableCount; stid++) {
                subtableViews.push(vLookup.ptr16());
            }
            const markFilteringSet: number | undefined =
                lookupFlag & LookupFlag.UseMarkFilteringSet ? vLookup.uint16() : undefined;

            // Override data if the lookup is extension
            if (lrf.isExtendedFormat(lookupType)) {
                const r = this.readExtensionSubtables(subtableViews);
                lookupType = r.extensionLookupType;
                subtableViews = r.realSubtables;
            }

            const reader = lrf.createReader(lookupType);
            const lookup = reader.createLookup();
            readers.push(reader);
            lookups.push(lookup);
            subtables.push(subtableViews);
            this.applyIgnoreSet(lookup, lookupFlag, markFilteringSet, lrc.gdef);
        }
        const lookupOrder = Data.Order.fromList(`Lookups`, lookups);
        for (const [lookup, reader, sts] of ImpLib.Iterators.Zip3WithIndex(
            lookups,
            readers,
            subtables
        )) {
            for (const st of sts) {
                reader.parseSubtable(st, lookup, {
                    ivs: lrc.ivs,
                    gOrd: lrc.gOrd,
                    crossReferences: lookupOrder
                });
            }
        }

        return lookups;
    }
}

export const ReadLookupList = new CReadLookupList();
