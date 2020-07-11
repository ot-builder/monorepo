import { BinaryView, Frag } from "@ot-builder/bin-util";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { OtExtPrivate, XPrv } from "@ot-builder/ot-ext-private";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { OtFontMetadata } from "@ot-builder/ot-metadata";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Data } from "@ot-builder/prelude";

import { ExtPrivateCfg } from "../cfg";
import { ReadXPrv, WriteXPrv } from "../xprv";

export function readExtPrivate(
    sfnt: Sfnt,
    cfg: ExtPrivateCfg,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
): OtExtPrivate {
    const result: OtExtPrivate = {};
    if (cfg.extPrivate.processExtPrivateTable) {
        const bXPrv = sfnt.tables.get(XPrv.Tag);
        if (bXPrv) result.xPrv = new BinaryView(bXPrv).next(ReadXPrv, gOrd);
    }
    return result;
}
export function writeExtPrivate(
    out: SfntIoTableSink,
    cfg: ExtPrivateCfg,
    OtExtPrivate: OtExtPrivate,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
) {
    if (cfg.extPrivate.processExtPrivateTable && OtExtPrivate.xPrv) {
        out.add(XPrv.Tag, Frag.packFrom(WriteXPrv, OtExtPrivate.xPrv, gOrd));
    }
}
