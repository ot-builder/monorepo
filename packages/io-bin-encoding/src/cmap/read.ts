import { Read } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { Cmap } from "@ot-builder/ft-encoding";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";

import { SubtableRawData } from "./general";
import { SubtableHandlers } from "./handlers";

export const ReadCmap = Read((view, gOrd: Data.Order<OtGlyph>) => {
    const version = view.uint16();
    Assert.VersionSupported("cmap", version, 0);

    const cmap = new Cmap.Table();

    const numTables = view.uint16();
    const raw: SubtableRawData[] = [];

    for (const [v] of view.repeat(numTables)) {
        const platform = v.uint16();
        const encoding = v.uint16();
        const vSubTable = v.ptr32();
        const format = vSubTable.uint16();
        raw.push({ platform, encoding, format, view: vSubTable.lift(0) });
    }

    for (const handlerF of SubtableHandlers) {
        const handler = handlerF();
        for (const r of raw) {
            if (handler.acceptEncoding(r.platform, r.encoding, r.format)) {
                r.view.lift(0).next(handler, gOrd);
                handler.apply(cmap);
            }
        }
    }

    return cmap;
});
