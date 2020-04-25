import { BinaryView, Frag } from "@ot-builder/bin-util";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { Cmap, OtEncoding } from "@ot-builder/ot-encoding";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { OtFontMetadata } from "@ot-builder/ot-metadata";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Data } from "@ot-builder/prelude";

import { EncodingCfg } from "../cfg";
import { ReadCmap } from "../cmap/read";
import { WriteCmap } from "../cmap/write";
import { EmptyStat } from "../stat/interface";
import { Os2MinMaxCharStat } from "../stat/os2-min-max-char-index";
import { Os2UnicodeRangeStat } from "../stat/os2-unicode-range";

export function readEncoding(
    sfnt: Sfnt,
    cfg: EncodingCfg,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
): OtEncoding {
    const bCmap = sfnt.tables.get(Cmap.Tag);
    if (bCmap) return { cmap: new BinaryView(bCmap).next(ReadCmap, gOrd) };
    else return {};
}
export function writeEncoding(
    out: SfntIoTableSink,
    cfg: EncodingCfg,
    encoding: OtEncoding,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
) {
    if (encoding.cmap) {
        let stat = new EmptyStat();
        if (cfg.encoding.statOs2UnicodeRanges && md.os2) {
            stat = new Os2MinMaxCharStat(md.os2, new Os2UnicodeRangeStat(md.os2, stat));
        }
        for (const [u, g] of encoding.cmap.unicode.entries()) stat.addEncoding(u);
        stat.settle();

        out.add(Cmap.Tag, Frag.packFrom(WriteCmap, encoding.cmap, gOrd, cfg));
    }
}
