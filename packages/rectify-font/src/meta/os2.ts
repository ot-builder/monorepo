import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

export function rectifyCoordOs2(rec: Rectify.Coord.RectifierT<Ot.Var.Value>, table: Ot.Os2.Table) {
    const newTable = new Ot.Os2.Table();
    newTable.version = table.version;
    newTable.xAvgCharWidth = table.xAvgCharWidth;
    newTable.usWeightClass = table.usWeightClass;
    newTable.usWidthClass = table.usWidthClass;
    newTable.fsType = table.fsType;
    newTable.ySubscriptXSize = rec.coord(table.ySubscriptXSize);
    newTable.ySubscriptYSize = rec.coord(table.ySubscriptYSize);
    newTable.ySubscriptXOffset = rec.coord(table.ySubscriptXOffset);
    newTable.ySubscriptYOffset = rec.coord(table.ySubscriptYOffset);
    newTable.ySuperscriptXSize = rec.coord(table.ySuperscriptXSize);
    newTable.ySuperscriptYSize = rec.coord(table.ySuperscriptYSize);
    newTable.ySuperscriptXOffset = rec.coord(table.ySuperscriptXOffset);
    newTable.ySuperscriptYOffset = rec.coord(table.ySuperscriptYOffset);
    newTable.yStrikeoutSize = rec.coord(table.yStrikeoutSize);
    newTable.yStrikeoutPosition = rec.coord(table.yStrikeoutPosition);
    newTable.sFamilyClass = table.sFamilyClass;
    newTable.ulUnicodeRange1 = table.ulUnicodeRange1;
    newTable.ulUnicodeRange2 = table.ulUnicodeRange2;
    newTable.ulUnicodeRange3 = table.ulUnicodeRange3;
    newTable.ulUnicodeRange4 = table.ulUnicodeRange4;
    newTable.achVendID = table.achVendID;
    newTable.fsSelection = table.fsSelection;
    newTable.usFirstCharIndex = table.usFirstCharIndex;
    newTable.usLastCharIndex = table.usLastCharIndex;
    newTable.sTypoAscender = rec.coord(table.sTypoAscender);
    newTable.sTypoDescender = rec.coord(table.sTypoDescender);
    newTable.sTypoLineGap = rec.coord(table.sTypoLineGap);
    newTable.usWinAscent = rec.coord(table.usWinAscent);
    newTable.usWinDescent = rec.coord(table.usWinDescent);
    newTable.ulCodePageRange1 = table.ulCodePageRange1;
    newTable.ulCodePageRange2 = table.ulCodePageRange2;
    newTable.sxHeight = rec.coord(table.sxHeight);
    newTable.sCapHeight = rec.coord(table.sCapHeight);
    newTable.usDefaultChar = table.usDefaultChar;
    newTable.usBreakChar = table.usBreakChar;
    newTable.usMaxContext = table.usMaxContext;
    newTable.usLowerOpticalPointSize = table.usLowerOpticalPointSize;
    newTable.usUpperOpticalPointSize = table.usUpperOpticalPointSize;

    newTable.panose.bFamilyType = table.panose.bFamilyType;
    newTable.panose.bSerifStyle = table.panose.bSerifStyle;
    newTable.panose.bWeight = table.panose.bWeight;
    newTable.panose.bProportion = table.panose.bProportion;
    newTable.panose.bContrast = table.panose.bContrast;
    newTable.panose.bStrokeVariation = table.panose.bStrokeVariation;
    newTable.panose.bArmStyle = table.panose.bArmStyle;
    newTable.panose.bLetterform = table.panose.bLetterform;
    newTable.panose.bMidline = table.panose.bMidline;
    newTable.panose.bXHeight = table.panose.bXHeight;

    return newTable;
}
