import { Frag, Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { Gdef } from "@ot-builder/ft-layout";
import { Fvar } from "@ot-builder/ft-metadata";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { ClassDef } from "../shared/class-def";

import { GdefAttachmentPointList } from "./attachment-point";
import { LigCaretList } from "./lig-caret-list";
import { MarkGlyphSets } from "./mark-glyph-sets";

export const GdefTableIo = {
    ...Read((view, gOrd: OtGlyphOrder, axes: Data.Maybe<Data.Order<OtVar.Axis>>) => {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported(`GDEF`, majorVersion, minorVersion, [1, 0], [1, 2], [1, 3]);

        let pGlyphClassDef = view.ptr16Nullable();
        let pAttachList = view.ptr16Nullable();
        let pLigCaretList = view.ptr16Nullable();
        let pMarkAttachClassDef = view.ptr16Nullable();
        let pMarkGlyphSetsDef = minorVersion >= 2 ? view.ptr16Nullable() : null;
        let pIVS = minorVersion >= 3 ? view.ptr32Nullable() : null;

        const ivs = pIVS && axes ? pIVS.next(ReadTimeIVS, axes) : null;
        const gdef = new Gdef.Table();
        gdef.glyphClassDef = pGlyphClassDef ? pGlyphClassDef.next(ClassDef, gOrd) : null;
        gdef.attachList = pAttachList ? pAttachList.next(GdefAttachmentPointList, gOrd) : null;
        gdef.ligCarets = pLigCaretList ? pLigCaretList.next(LigCaretList, gOrd, ivs) : null;
        gdef.markAttachClassDef = pMarkAttachClassDef
            ? pMarkAttachClassDef.next(ClassDef, gOrd)
            : null;
        gdef.markGlyphSets = pMarkGlyphSetsDef ? pMarkGlyphSetsDef.next(MarkGlyphSets, gOrd) : null;

        return { gdef, ivs };
    }),

    ...Write(
        (
            frag,
            gdef: Gdef.Table,
            gOrd: OtGlyphOrder,
            ivs: Data.Maybe<WriteTimeIVS>,
            axes: Data.Maybe<Data.Order<OtVar.Axis>>
        ) => {
            const fClassDef = gdef.glyphClassDef
                ? Frag.from(ClassDef, gdef.glyphClassDef, gOrd)
                : null;
            const fAttachList = gdef.attachList
                ? Frag.from(GdefAttachmentPointList, gdef.attachList, gOrd)
                : null;
            const fLigCaretList = gdef.ligCarets
                ? Frag.from(LigCaretList, gdef.ligCarets, gOrd, ivs)
                : null;
            const fMarkAttachClassDef = gdef.markAttachClassDef
                ? Frag.from(ClassDef, gdef.markAttachClassDef, gOrd)
                : null;
            const fMarkGlyphSets = gdef.markGlyphSets
                ? Frag.from(MarkGlyphSets, gdef.markGlyphSets, gOrd)
                : null;
            const fIVS = !ivs || !axes || ivs.isEmpty() ? null : Frag.from(WriteTimeIVS, ivs, axes);

            let minorVersion = 3;
            if (!fIVS) minorVersion = 2;
            if (!fMarkGlyphSets && !fIVS) minorVersion = 0;

            frag.uint16(1).uint16(minorVersion);
            frag.ptr16(fClassDef);
            frag.ptr16(fAttachList);
            frag.ptr16(fLigCaretList);
            frag.ptr16(fMarkAttachClassDef);
            if (minorVersion >= 2) frag.ptr16(fMarkGlyphSets);
            if (minorVersion >= 3) frag.ptr32(fIVS);
        }
    )
};
