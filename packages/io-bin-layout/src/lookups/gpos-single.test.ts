import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gpos } from "@ot-builder/ft-layout";
import { BimapCtx, Disorder, LookupIdentity } from "@ot-builder/test-util";

import { SubtableWriteTrick } from "../gsub-gpos-shared/general";

import { GposSingleReader, GposSingleWriter } from "./gpos-single";
import { LookupRoundTripConfig, LookupRoundTripTest, SetupVariation } from "./test-util.test";

describe("GPOS single lookup handler", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x4000);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gpos.Lookup, Gpos.Single> = {
        gOrd,
        writer: () => new GposSingleWriter(),
        reader: () => new GposSingleReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GposSingle.test(BimapCtx.from(gOrd), a, b);
        }
    };

    test("Very different", () => {
        const lookup = Gpos.Single.create();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.adjustments.set(gOrd.at(gid), {
                dX: Math.round(gid / 8),
                dY: Math.round(-gid / 8),
                dWidth: Math.round((gid * 2) / 8),
                dHeight: Math.round((-gid * 2) / 8)
            });
        }
        lookup.adjustments = Disorder.shuffleMap(lookup.adjustments);

        LookupRoundTripTest(lookup, roundtripConfig);
        LookupRoundTripTest(lookup, {
            ...roundtripConfig,
            trick:
                SubtableWriteTrick.AvoidBreakSubtable |
                SubtableWriteTrick.UseFlatCoverageForSingleLookup
        });
    });
    test("Very same", () => {
        const lookup = Gpos.Single.create();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.adjustments.set(gOrd.at(gid), {
                dX: Math.round(gid / 1024),
                dY: Math.round(-gid / 1024),
                dWidth: Math.round((gid * 2) / 1024),
                dHeight: Math.round((-gid * 2) / 1024)
            });
        }
        lookup.adjustments = Disorder.shuffleMap(lookup.adjustments);

        LookupRoundTripTest(lookup, roundtripConfig);
        LookupRoundTripTest(lookup, {
            ...roundtripConfig,
            trick:
                SubtableWriteTrick.AvoidBreakSubtable |
                SubtableWriteTrick.UseFlatCoverageForSingleLookup
        });
    });
    test("Variable", () => {
        const lookup = Gpos.Single.create();
        const variation = SetupVariation();
        const { bold, wide } = variation.masters;
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.adjustments.set(gOrd.at(gid), {
                dX: variation.create([bold, gid]),
                dY: variation.create([wide, gid]),
                dWidth: Math.round((gid * 2) / 1024),
                dHeight: Math.round((-gid * 2) / 1024)
            });
        }
        lookup.adjustments = Disorder.shuffleMap(lookup.adjustments);

        LookupRoundTripTest(lookup, { ...roundtripConfig, variation });
    });
});
