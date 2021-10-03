import { BinaryView } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { TSI0123 } from "@ot-builder/ot-vtt-private";
import { Data } from "@ot-builder/prelude";
import { UInt16, UInt32 } from "@ot-builder/primitive";

export type Tsi02Record = {
    readonly glyphIndex: UInt16;
    readonly textLength: UInt16;
    readonly textOffset: UInt32;
};

export function readTSI0123(
    viewTable02: BinaryView,
    viewTable13: BinaryView,
    gOrd: Data.Order<OtGlyph>
) {
    const sizeOfTSI02Record = UInt16.size * 2 + UInt32.size; // 8 bytes
    const totalRecords = viewTable02.sourceBufferSize / sizeOfTSI02Record;

    const offsetRecords: Tsi02Record[] = [];
    for (let index = 0; index < totalRecords; index++) {
        const glyphIndex = viewTable02.uint16();
        const textLength = viewTable02.uint16();
        const textOffset = viewTable02.uint32();

        if (glyphIndex === 0xfffe) continue;
        offsetRecords.push({ glyphIndex, textLength, textOffset });
    }

    const sink = new TSI0123.Table();

    for (let index = 0; index < offsetRecords.length; index++) {
        const rec = offsetRecords[index];
        const nextOffset =
            index + 1 < offsetRecords.length
                ? offsetRecords[index + 1].textOffset
                : viewTable13.sourceBufferSize;
        const textLength = rec.textLength < 0x8000 ? rec.textLength : nextOffset - rec.textOffset;
        const text = viewTable13.lift(rec.textOffset).bytes(textLength).toString("utf-8");
        switch (rec.glyphIndex) {
            case 0xfffa:
                sink.preProgram = text;
                break;
            case 0xfffb:
                sink.cvtProgram = text;
                break;
            case 0xfffc:
                break;
            case 0xfffd:
                sink.fpgmProgram = text;
                break;
            default:
                sink.glyphPrograms.set(gOrd.at(rec.glyphIndex), text);
        }
    }

    return sink;
}
