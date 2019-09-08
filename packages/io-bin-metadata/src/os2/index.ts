import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Os2 } from "@ot-builder/ft-metadata";
import { Tag } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export const Os2Panose = {
    read(bp: BinaryView) {
        const p = new Os2.Panose();
        p.bFamilyType = bp.uint8();
        p.bSerifStyle = bp.uint8();
        p.bWeight = bp.uint8();
        p.bProportion = bp.uint8();
        p.bContrast = bp.uint8();
        p.bStrokeVariation = bp.uint8();
        p.bArmStyle = bp.uint8();
        p.bLetterform = bp.uint8();
        p.bMidline = bp.uint8();
        p.bXHeight = bp.uint8();
        return p;
    },

    write(b: Frag, panose: Os2.Panose) {
        b.uint8(panose.bFamilyType);
        b.uint8(panose.bSerifStyle);
        b.uint8(panose.bWeight);
        b.uint8(panose.bProportion);
        b.uint8(panose.bContrast);
        b.uint8(panose.bStrokeVariation);
        b.uint8(panose.bArmStyle);
        b.uint8(panose.bLetterform);
        b.uint8(panose.bMidline);
        b.uint8(panose.bXHeight);
    }
};

export const Os2TableIo = {
    read(view: BinaryView) {
        const table = new Os2.Table();
        table.version = view.uint16();
        table.xAvgCharWidth = view.int16();
        table.usWeightClass = view.uint16();
        table.usWidthClass = view.uint16();
        table.fsType = view.uint16();
        table.ySubscriptXSize = view.int16();
        table.ySubscriptYSize = view.int16();
        table.ySubscriptXOffset = view.int16();
        table.ySubscriptYOffset = view.int16();
        table.ySuperscriptXSize = view.int16();
        table.ySuperscriptYSize = view.int16();
        table.ySuperscriptXOffset = view.int16();
        table.ySuperscriptYOffset = view.int16();
        table.yStrikeoutSize = view.int16();
        table.yStrikeoutPosition = view.int16();
        table.sFamilyClass = view.int16();
        table.panose = view.next(Os2Panose);
        table.ulUnicodeRange1 = view.uint32();
        table.ulUnicodeRange2 = view.uint32();
        table.ulUnicodeRange3 = view.uint32();
        table.ulUnicodeRange4 = view.uint32();
        table.achVendID = view.next(Tag);
        table.fsSelection = view.uint16();
        table.usFirstCharIndex = view.uint16();
        table.usLastCharIndex = view.uint16();
        table.sTypoAscender = view.int16();
        table.sTypoDescender = view.int16();
        table.sTypoLineGap = view.int16();
        table.usWinAscent = view.uint16();
        table.usWinDescent = view.uint16();
        if (table.version < 1) return table;
        table.ulCodePageRange1 = view.uint32();
        table.ulCodePageRange2 = view.uint32();
        if (table.version < 2) return table;
        table.sxHeight = view.int16();
        table.sCapHeight = view.int16();
        table.usDefaultChar = view.uint16();
        table.usBreakChar = view.uint16();
        table.usMaxContext = view.uint16();
        if (table.version < 5) return table;
        table.usLowerOpticalPointSize = view.uint16();
        table.usUpperOpticalPointSize = view.uint16();
        return table;
    },

    write(frag: Frag, table: Os2.Table) {
        frag.uint16(table.version);
        frag.int16(table.xAvgCharWidth);
        frag.uint16(table.usWeightClass);
        frag.uint16(table.usWidthClass);
        frag.uint16(table.fsType);
        frag.int16(OtVar.Ops.originOf(table.ySubscriptXSize));
        frag.int16(OtVar.Ops.originOf(table.ySubscriptYSize));
        frag.int16(OtVar.Ops.originOf(table.ySubscriptXOffset));
        frag.int16(OtVar.Ops.originOf(table.ySubscriptYOffset));
        frag.int16(OtVar.Ops.originOf(table.ySuperscriptXSize));
        frag.int16(OtVar.Ops.originOf(table.ySuperscriptYSize));
        frag.int16(OtVar.Ops.originOf(table.ySuperscriptXOffset));
        frag.int16(OtVar.Ops.originOf(table.ySuperscriptYOffset));
        frag.int16(OtVar.Ops.originOf(table.yStrikeoutSize));
        frag.int16(OtVar.Ops.originOf(table.yStrikeoutPosition));
        frag.int16(table.sFamilyClass);
        frag.push(Os2Panose, table.panose);
        frag.uint32(table.ulUnicodeRange1);
        frag.uint32(table.ulUnicodeRange2);
        frag.uint32(table.ulUnicodeRange3);
        frag.uint32(table.ulUnicodeRange4);
        frag.push(Tag, table.achVendID);
        frag.uint16(table.fsSelection);
        frag.uint16(table.usFirstCharIndex);
        frag.uint16(table.usLastCharIndex);
        frag.int16(OtVar.Ops.originOf(table.sTypoAscender));
        frag.int16(OtVar.Ops.originOf(table.sTypoDescender));
        frag.int16(OtVar.Ops.originOf(table.sTypoLineGap));
        frag.uint16(OtVar.Ops.originOf(table.usWinAscent));
        frag.uint16(OtVar.Ops.originOf(table.usWinDescent));
        if (table.version < 1) return;
        frag.uint32(table.ulCodePageRange1);
        frag.uint32(table.ulCodePageRange2);
        if (table.version < 2) return;
        frag.int16(OtVar.Ops.originOf(table.sxHeight));
        frag.int16(OtVar.Ops.originOf(table.sCapHeight));
        frag.uint16(table.usDefaultChar);
        frag.uint16(table.usBreakChar);
        frag.uint16(table.usMaxContext);
        if (table.version < 5) return;
        frag.uint16(table.usLowerOpticalPointSize);
        frag.uint16(table.usUpperOpticalPointSize);
    }
};
