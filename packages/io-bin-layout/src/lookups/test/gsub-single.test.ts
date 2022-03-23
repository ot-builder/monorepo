import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { Gsub } from "@ot-builder/ot-layout";
import { BimapCtx, Disorder, LookupIdentity } from "@ot-builder/test-util";

import { LookupWriteTrick } from "../../cfg";
import { GsubSingleReader, GsubSingleWriter } from "../gsub-single";

import { LookupRoundTripConfig, LookupRoundTripTest } from "./-shared-test-util.test";

describe("GSUB single lookup handler", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0xffff);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gsub.Lookup, Gsub.Single> = {
        gOrd,
        writer: () => new GsubSingleWriter(),
        reader: () => new GsubSingleReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GsubSingle.test(BimapCtx.from(gOrd), a, b);
        }
    };

    test("Simple", () => {
        const lookup: Gsub.Single = new Gsub.Single();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.mapping.set(gOrd.at(gid), gOrd.at((gid + 0x30) % gOrd.length));
        }
        lookup.mapping = Disorder.shuffleMap(lookup.mapping);

        LookupRoundTripTest(lookup, roundtripConfig);
        LookupRoundTripTest(lookup, {
            ...roundtripConfig,
            trick: LookupWriteTrick.AvoidBreakSubtable | LookupWriteTrick.UseFlatCoverage
        });
    });
    test("Unusual", () => {
        const lookup: Gsub.Single = new Gsub.Single();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.mapping.set(gOrd.at(gid), gOrd.at((gid * gid + gid + 0x30) % gOrd.length));
        }
        lookup.mapping = Disorder.shuffleMap(lookup.mapping);

        LookupRoundTripTest(lookup, roundtripConfig);
        LookupRoundTripTest(lookup, {
            ...roundtripConfig,
            trick: LookupWriteTrick.AvoidBreakSubtable | LookupWriteTrick.UseFlatCoverage
        });
    });
});
