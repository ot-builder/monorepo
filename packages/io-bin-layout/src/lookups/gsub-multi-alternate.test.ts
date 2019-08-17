import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gsub } from "@ot-builder/ft-layout";
import { BimapCtx, LookupIdentity } from "@ot-builder/test-util";

import { GsubMultiReader, GsubMultiWriter } from "./gsub-multi-alternate";
import { LookupRoundTripConfig, LookupRoundTripTest, shuffleArray } from "./test-util.test";

describe("GSUB multi/alternate lookup handler", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x1000);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gsub.Multiple> = {
        gOrd,
        writer: () => new GsubMultiWriter(),
        reader: () => new GsubMultiReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GsubMultiAlt.test(BimapCtx.from(gOrd), a, b);
        }
    };

    test("Exhaustive", () => {
        const lookup = new Gsub.Multiple();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.mapping.set(gOrd.at(gid), [
                gOrd.at((gid + 0x30) % gOrd.length),
                gOrd.at((gid - 0x30 + gOrd.length) % gOrd.length)
            ]);
        }
        lookup.mapping = new Map(shuffleArray([...lookup.mapping]));
        LookupRoundTripTest(lookup, roundtripConfig);
    });

    test("Simple", () => {
        const lookup = new Gsub.Multiple();
        for (let gid = 0; gid < gOrd.length / 4; gid++) {
            lookup.mapping.set(gOrd.at(gid), [
                gOrd.at((gid + 0x30) % gOrd.length),
                gOrd.at((gid - 0x30 + gOrd.length) % gOrd.length)
            ]);
        }
        lookup.mapping = new Map(shuffleArray([...lookup.mapping]));
        LookupRoundTripTest(lookup, roundtripConfig);
    });
});
