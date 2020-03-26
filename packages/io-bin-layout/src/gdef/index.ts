import { Frag, Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { ClassDef } from "../shared/class-def";

import { GdefAttachmentPointList } from "./attachment-point";
import { LigCaretList } from "./lig-caret-list";
import { MarkGlyphSets } from "./mark-glyph-sets";

export const GdefTableIo = {
    ...Read((view, gOrd: Data.Order<OtGlyph>, designSpace: Data.Maybe<OtVar.DesignSpace>) => {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported(`GDEF`, majorVersion, minorVersion, [1, 0], [1, 2], [1, 3]);

        const pGlyphClassDef = view.ptr16Nullable();
        const pAttachList = view.ptr16Nullable();
        const pLigCaretList = view.ptr16Nullable();
        const pMarkAttachClassDef = view.ptr16Nullable();
        const pMarkGlyphSetsDef = minorVersion >= 2 ? view.ptr16Nullable() : null;
        const pIVS = minorVersion >= 3 ? view.ptr32Nullable() : null;

        const ivs = pIVS && designSpace ? pIVS.next(ReadTimeIVS, designSpace) : null;
        const gdef = new Gdef.Table();
        gdef.glyphClassDef = pGlyphClassDef ? pGlyphClassDef.next(ClassDef, gOrd) : null;
        gdef.attachList = pAttachList ? pAttachList.next(GdefAttachmentPointList, gOrd) : null;
        gdef.ligCarets = pLigCaretList ? pLigCaretList.next(LigCaretList, gOrd, ivs) : null;
        gdef.markAttachClassDef = pMarkAttachClassDef
            ? pMarkAttachClassDef.next(ClassDef, gOrd)
            : null;
        gdef.markGlyphSets = pMarkGlyphSetsDef
            ? pMarkGlyphSetsDef.next(MarkGlyphSets, gOrd)
            : null;

        return { gdef, ivs };
    }),

    ...Write(
        (
            frag,
            gdef: Gdef.Table,
            gOrd: Data.Order<OtGlyph>,
            ivs: Data.Maybe<WriteTimeIVS>,
            designSpace: Data.Maybe<OtVar.DesignSpace>
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
            const fIVS =
                !ivs || !designSpace || ivs.isEmpty()
                    ? null
                    : Frag.from(WriteTimeIVS, ivs, designSpace);

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
