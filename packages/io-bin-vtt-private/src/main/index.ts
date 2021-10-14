import { BinaryView, Frag } from "@ot-builder/bin-util";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { OtFontMetadata } from "@ot-builder/ot-metadata";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { OtVttPrivate, TSI0123, TSI5, TSIC } from "@ot-builder/ot-vtt-private";
import { Data } from "@ot-builder/prelude";

import { VttPrivateCfg } from "../cfg";
import { VttExtraInfoSource } from "../extra-info-source";
import { readTSI0123 } from "../tsi0123/read";
import { NopProcessor, TSI01Processor, writeTSI0123 } from "../tsi0123/write";
import { TSI5Table } from "../tsi5";
import { TsicTable } from "../tsic";

export function readVttPrivate(
    sfnt: Sfnt,
    cfg: VttPrivateCfg,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
) {
    const result: OtVttPrivate = {};
    if (cfg.vttPrivate.processVttPrivateTables) {
        const bTSI0 = sfnt.tables.get(TSI0123.TagTSI0);
        const bTSI1 = sfnt.tables.get(TSI0123.TagTSI1);
        if (bTSI0 && bTSI1) {
            result.tsi01 = readTSI0123(new BinaryView(bTSI0), new BinaryView(bTSI1), gOrd);
        }

        const bTSI2 = sfnt.tables.get(TSI0123.TagTSI2);
        const bTSI3 = sfnt.tables.get(TSI0123.TagTSI3);
        if (bTSI2 && bTSI3) {
            result.tsi23 = readTSI0123(new BinaryView(bTSI2), new BinaryView(bTSI3), gOrd);
        }

        const bTSI5 = sfnt.tables.get(TSI5.Tag);
        if (bTSI5) {
            result.tsi5 = new BinaryView(bTSI5).next(TSI5Table, gOrd);
        }

        const bTSIC = sfnt.tables.get(TSIC.Tag);
        if (bTSIC && md.fvar) {
            result.tsic = new BinaryView(bTSIC).next(TsicTable, md.fvar.getDesignSpace());
        }
    }
    return result;
}

export function writeVttPrivate(
    out: SfntIoTableSink,
    cfg: VttPrivateCfg,
    otVttPrivate: OtVttPrivate,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata,
    eis: VttExtraInfoSource
) {
    if (!cfg.vttPrivate.processVttPrivateTables) return;
    if (otVttPrivate.tsi01) {
        const frTSI0 = new Frag();
        const frTSI1 = new Frag();
        const textProcessor = cfg.vttPrivate.recalculatePseudoInstructions
            ? new TSI01Processor(eis)
            : new NopProcessor();
        writeTSI0123(frTSI0, frTSI1, otVttPrivate.tsi01, gOrd, textProcessor);
        out.add(TSI0123.TagTSI0, Frag.pack(frTSI0));
        out.add(TSI0123.TagTSI1, Frag.pack(frTSI1));
    }
    if (otVttPrivate.tsi23) {
        const frTSI2 = new Frag();
        const frTSI3 = new Frag();
        writeTSI0123(frTSI2, frTSI3, otVttPrivate.tsi23, gOrd, new NopProcessor());
        out.add(TSI0123.TagTSI2, Frag.pack(frTSI2));
        out.add(TSI0123.TagTSI3, Frag.pack(frTSI3));
    }
    if (otVttPrivate.tsi5) {
        out.add(TSI5.Tag, Frag.packFrom(TSI5Table, otVttPrivate.tsi5, gOrd));
    }
    if (otVttPrivate.tsic && md.fvar) {
        out.add(TSIC.Tag, Frag.packFrom(TsicTable, otVttPrivate.tsic, md.fvar.getDesignSpace()));
    }
}
