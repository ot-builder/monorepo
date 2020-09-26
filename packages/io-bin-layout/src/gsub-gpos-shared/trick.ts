import { GsubGpos } from "@ot-builder/ot-layout";

import { LayoutCfg } from "../cfg";

export function setLookupTricks<L>(table: GsubGpos.TableT<L>, cfg: LayoutCfg) {
    const tricks: Map<L, number> = new Map();
    if (cfg.layout.lookupWriteTricks) {
        for (const lookup of table.lookups) {
            const userTrick = cfg.layout.lookupWriteTricks.get(lookup);
            if (userTrick) tricks.set(lookup, userTrick);
        }
    }
    return tricks;
}
