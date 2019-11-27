import { LongDateTime } from "@ot-builder/bin-composite-types";
import { Read, Write } from "@ot-builder/bin-util";
import { Head } from "@ot-builder/ft-metadata";
import { F16D16 } from "@ot-builder/primitive";

export const HeadIo = {
    ...Read<Head.Table>(view => {
        const head = new Head.Table();
        head.majorVersion = view.uint16();
        head.minorVersion = view.uint16();
        head.fontRevision = view.next(F16D16);
        const _checkSumAdjust = view.uint32(); // pass, Head.Table::checkSumAdjust is read-only
        const _magicNumber = view.uint32(); // pass, Head.Table::magicNumber is read-only
        head.flags = view.uint16();
        head.unitsPerEm = view.uint16();
        head.created = view.next(LongDateTime);
        head.modified = view.next(LongDateTime);
        head.xMin = view.int16();
        head.yMin = view.int16();
        head.xMax = view.int16();
        head.yMax = view.int16();
        head.macStyle = view.uint16();
        head.lowestRecPPEM = view.uint16();
        head.fontDirectionHint = view.int16();
        head.indexToLocFormat = view.int16();
        head.glyphDataFormat = view.int16();
        return head;
    }),
    ...Write<Head.Table>((fr, head) => {
        fr.uint16(head.majorVersion);
        fr.uint16(head.minorVersion);
        fr.push(F16D16, head.fontRevision);
        fr.uint32(head.checkSumAdjust);
        fr.uint32(head.magicNumber);
        fr.uint16(head.flags);
        fr.uint16(head.unitsPerEm);
        fr.push(LongDateTime, head.created);
        fr.push(LongDateTime, head.modified);
        fr.int16(head.xMin);
        fr.int16(head.yMin);
        fr.int16(head.xMax);
        fr.int16(head.yMax);
        fr.uint16(head.macStyle);
        fr.uint16(head.lowestRecPPEM);
        fr.int16(head.fontDirectionHint);
        fr.int16(head.indexToLocFormat);
        fr.int16(head.glyphDataFormat);
    })
};
