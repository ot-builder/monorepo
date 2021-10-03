import { Frag } from "@ot-builder/bin-util";
import { ComponentFlag } from "@ot-builder/io-bin-ttf";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { TSI0123 } from "@ot-builder/ot-vtt-private";
import { Data } from "@ot-builder/prelude";
import { UInt16 } from "@ot-builder/primitive";

import { VttExtraInfoSource } from "../extra-info-source";

type TsiEntry = {
    readonly glyphIndex: UInt16;
    readonly textBuffer: Buffer;
};

export function writeTSI0123(
    frTSI02: Frag,
    frTSI13: Frag,
    table: TSI0123.Table,
    gOrd: Data.Order<OtGlyph>,
    textProcessor: ProgramProcessor
) {
    const sink: TsiEntry[] = [];
    for (let gid = 0; gid < gOrd.length; gid++) {
        collectTSI0123Entry(sink, gid, table.glyphPrograms.get(gOrd.at(gid)) || "", textProcessor);
    }
    collectTSI0123Entry(sink, 0xfffa, table.preProgram || "", textProcessor);
    collectTSI0123Entry(sink, 0xfffb, table.cvtProgram || "", textProcessor);
    collectTSI0123Entry(sink, 0xfffc, "", textProcessor);
    collectTSI0123Entry(sink, 0xfffd, table.fpgmProgram || "", textProcessor);

    let offset = 0;
    for (let iEntry = 0; iEntry < sink.length; iEntry++) {
        if (iEntry + 4 === sink.length) {
            frTSI02.uint16(0xfffe).uint16(0).uint32(0xabfc1f34); // Magic
        }
        const entry = sink[iEntry];
        frTSI02
            .uint16(entry.glyphIndex)
            .uint16(Math.min(entry.textBuffer.byteLength, 0x8000))
            .uint32(offset);
        frTSI13.bytes(entry.textBuffer);
        offset += entry.textBuffer.byteLength;
    }
}

function collectTSI0123Entry(
    sink: TsiEntry[],
    gid: number,
    text: string,
    textProcessor: ProgramProcessor
) {
    sink.push({
        glyphIndex: gid,
        textBuffer: Buffer.from(textProcessor.processProgram(gid, text), "utf-8")
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////

export interface ProgramProcessor {
    processProgram(gid: number, text: string): string;
}

export class TSI01Processor implements ProgramProcessor {
    constructor(private readonly extraInfoReporter: VttExtraInfoSource) {}
    public processProgram(gid: number, text: string) {
        if (gid >= 0xfffa) return text;

        text = text.replace(
            /^(?:USEMYMETRICS|(?:NON)?OVERLAP|(?:UN)?SCALEDCOMPONENTOFFSET|S?(?:OFFSET|ANCHOR))\[[rR]?\].*$(?:\r|\n|\r\n)?/gm,
            ""
        );

        let pseudoInstructions = "";
        const componentInfos = this.extraInfoReporter.getCompositeGlyphInfo(gid);
        for (const component of componentInfos) {
            if (!component) continue;
            if (component.flags & ComponentFlag.USE_MY_METRICS)
                pseudoInstructions += "USEMYMETRICS[]\r";
            if (!(component.flags & ComponentFlag.NON_OVERLAPPING))
                pseudoInstructions += "OVERLAP[]\r";
            if (component.flags & ComponentFlag.UNSCALED_COMPONENT_OFFSET)
                pseudoInstructions += "UNSCALEDCOMPONENTOFFSET[]\r";
            else if (component.flags & ComponentFlag.SCALED_COMPONENT_OFFSET)
                pseudoInstructions += "SCALEDCOMPONENTOFFSET[]\r";

            const roundIndicator = component.flags & ComponentFlag.ROUND_XY_TO_GRID ? "R" : "r";
            const argTy = component.flags & ComponentFlag.ARGS_ARE_XY_VALUES ? "OFFSET" : "ANCHOR";
            if (
                component.flags &
                (ComponentFlag.WE_HAVE_A_SCALE |
                    ComponentFlag.WE_HAVE_AN_X_AND_Y_SCALE |
                    ComponentFlag.WE_HAVE_A_TWO_BY_TWO)
            ) {
                pseudoInstructions +=
                    `S${argTy}[${roundIndicator}], ${component.targetGID}, ` +
                    `${component.arg1}, ${component.arg2}, ` +
                    `${component.argXScale.toFixed(4)}, ${component.argScale01.toFixed(4)}, ` +
                    `${component.argScale10.toFixed(4)}, ${component.argYScale.toFixed(4)}\r`;
            } else {
                pseudoInstructions +=
                    `${argTy}[${roundIndicator}], ${component.targetGID}, ` +
                    `${component.arg1}, ${component.arg2}\r`;
            }
        }
        return pseudoInstructions + text;
    }
}

export class NopProcessor implements ProgramProcessor {
    public processProgram(gid: number, text: string) {
        return text;
    }
}
