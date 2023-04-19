import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";
import { BimapCtx, LookupIdentity } from "@ot-builder/test-util";

import { GposMarkToMarkReader } from "../gpos-mark-read";
import { GposMarkToMarkWriter } from "../gpos-mark-write";

import { LookupRoundTripConfig, LookupRoundTripTest } from "./-shared-test-util.test";

describe("GPOS mark-to-base lookup handler", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x100);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gpos.Lookup, Gpos.MarkToMark> = {
        gOrd,
        writer: () => new GposMarkToMarkWriter(),
        reader: () => new GposMarkToMarkReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GposMarkToMark.test(BimapCtx.from(gOrd), a, b);
        }
    };

    test("Mark class without bases", () => {
        const lookup = new Gpos.MarkToMark();

        const dummy = (x: number) => ({ x: x, y: x });

        lookup.marks.set(gOrd.at(1), { markAnchors: [dummy(1)] });
        lookup.marks.set(gOrd.at(2), { markAnchors: [null, dummy(2)] });
        lookup.marks.set(gOrd.at(3), { markAnchors: [null, null, dummy(3)] });

        lookup.baseMarks.set(gOrd.at(1), { baseAnchors: [dummy(4), null, dummy(5)] });
        lookup.baseMarks.set(gOrd.at(2), { baseAnchors: [dummy(6), null, dummy(7)] });
        lookup.baseMarks.set(gOrd.at(3), { baseAnchors: [dummy(8), null, dummy(10)] });

        LookupRoundTripTest(lookup, roundtripConfig);
    });
});
