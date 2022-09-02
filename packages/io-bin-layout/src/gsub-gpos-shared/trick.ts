import { GsubGpos } from "@ot-builder/ot-layout";

import { LayoutCfg, LookupWriteTrick } from "../cfg";

export function setLookupTricks<L extends GsubGpos.LookupProp>(
    table: GsubGpos.TableT<L>,
    cfg: LayoutCfg
) {
    const tricks: Map<L, LookupWriteTrick> = new Map();
    if (cfg.layout.lookupWriteTricks) {
        for (const lookup of table.lookups) {
            const userTrick = cfg.layout.lookupWriteTricks.get(lookup);
            if (userTrick) tricks.set(lookup, userTrick);
        }
    }
    return tricks;
}
