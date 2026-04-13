import { BinaryView, Frag } from "@ot-builder/bin-util";
import type { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { type OtExtPrivate, XPrv } from "@ot-builder/ot-ext-private";
import type { OtGlyph } from "@ot-builder/ot-glyphs";
import type { OtFontMetadata } from "@ot-builder/ot-metadata";
import type { Sfnt } from "@ot-builder/ot-sfnt";
import type { Data } from "@ot-builder/prelude";

import type { ExtPrivateCfg } from "../cfg";
import { ReadXPrv, WriteXPrv } from "../xprv";

export function readExtPrivate(
    sfnt: Sfnt,
    cfg: ExtPrivateCfg,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata,
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
    md: OtFontMetadata,
) {
    if (cfg.extPrivate.processExtPrivateTable && OtExtPrivate.xPrv) {
        out.add(XPrv.Tag, Frag.packFrom(WriteXPrv, OtExtPrivate.xPrv, gOrd));
    }
}
