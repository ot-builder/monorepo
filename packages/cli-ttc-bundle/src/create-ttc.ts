import { FontIo, Ot } from "ot-builder";

import { sparseShareGlyfData } from "./sparse-glyf-data-processor";
import { sparseShareGvarData } from "./sparse-gvar-data-processor";

export function createTtc(input: Buffer[], sharing: null | number[][]) {
    const fonts: FontIo.TableSliceCollection[] = [];
    for (const file of input) fonts.push(convertSfntToCustom(FontIo.readSfntOtf(file)));
    if (sharing) {
        sparseShareGlyfData(fonts, sharing);
        sparseShareGvarData(fonts, sharing);
    }
    return FontIo.writeSfntTtcFromTableSlices(fonts);
}

function convertSfntToCustom(sfnt: Ot.Sfnt) {
    const ds: FontIo.TableSliceCollection = { version: sfnt.version, tables: new Map() };
    for (const [tag, table] of sfnt.tables)
        ds.tables.set(tag, { data: table, start: 0, length: table.byteLength });
    return ds;
}
