import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../../compar-util";

import { GposAdjIdentity } from "./gpos-shared";

export namespace GposPairLookupIdentity {
    function testSingle(bmg: BimapCtx<OtGlyph>, expected: Gpos.Pair, actual: Gpos.Pair) {
        //let pairs = 0;
        for (const [ga1, ga2, _adj] of expected.adjustments.entries()) {
            const adj = _adj || Gpos.ZeroAdjustmentPair;
            const gb1 = bmg.forward(ga1);
            const gb2 = bmg.forward(ga2);
            const adjB = actual.adjustments.get(gb1, gb2) || Gpos.ZeroAdjustmentPair;
            //if (pairs % 0x100 === 0) process.stderr.write(`${ga1.name} ${ga2.name}\n`);
            GposAdjIdentity(adj[0], adjB[0], `${ga1.name}<>${ga2.name}/fst`);
            GposAdjIdentity(adj[1], adjB[1], `${ga1.name}<>${ga2.name}/snd`);
            //pairs++;
        }
    }

    export const test = StdCompare(testSingle);
}
