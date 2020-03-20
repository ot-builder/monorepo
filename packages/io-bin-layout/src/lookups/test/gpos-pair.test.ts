import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gpos } from "@ot-builder/ft-layout";
import { BimapCtx, LookupIdentity } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { GposPairReader } from "../gpos-pair-read";
import { GposPairWriter } from "../gpos-pair-write";

import {
    LookupRoundTripConfig,
    LookupRoundTripTest,
    SetupVariation
} from "./-shared-test-util.test";

describe("GPOS pair lookup handler", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x200);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gpos.Lookup, Gpos.Pair> = {
        gOrd,
        writer: () => new GposPairWriter(),
        reader: () => new GposPairReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GposPair.test(BimapCtx.from(gOrd), a, b);
        }
    };

    function kern(amount: OtVar.Value): Gpos.AdjustmentPair {
        return [{ ...Gpos.ZeroAdjustment, dWidth: amount }, Gpos.ZeroAdjustment];
    }

    test("Scattered", () => {
        const lookup = new Gpos.Pair();
        for (let gid = 1; gid < 0x10; gid++) {
            lookup.adjustments.set(new Set([gOrd.at(gid)]), new Set([gOrd.at(gid)]), kern(gid));
        }

        LookupRoundTripTest(lookup, roundtripConfig);
    });

    test("Scattered, zero padded", () => {
        const lookup = new Gpos.Pair();
        lookup.adjustments.set(new Set(gOrd), new Set(gOrd), kern(0));
        for (let gid = 1; gid < 0x10; gid++) {
            lookup.adjustments.set(new Set([gOrd.at(gid)]), new Set([gOrd.at(gid)]), kern(gid));
        }

        LookupRoundTripTest(lookup, roundtripConfig);
    });

    test("Plain", () => {
        const lookup = new Gpos.Pair();
        const split = 16;
        for (let c1 = 0; c1 < split; c1++) {
            for (let c2 = 0; c2 < split; c2++) {
                const s1 = new Set<OtGlyph>();
                const s2 = new Set<OtGlyph>();
                for (let gid = 0; gid < gOrd.length; gid++) {
                    const g = gOrd.at(gid);
                    if (gid % split === c1) s1.add(g);
                    if (gid % split === c2) s2.add(g);
                }
                lookup.adjustments.set(s1, s2, kern((c1 << 8) | c2));
            }
        }

        LookupRoundTripTest(lookup, roundtripConfig);
    });

    test("Plain + Scatter", () => {
        const lookup = new Gpos.Pair();
        const split = 16;
        for (let c1 = 0; c1 < split; c1++) {
            for (let c2 = 0; c2 < split; c2++) {
                const s1 = new Set<OtGlyph>();
                const s2 = new Set<OtGlyph>();
                for (let gid = 0; gid < gOrd.length; gid++) {
                    const g = gOrd.at(gid);
                    if (gid % split === c1) s1.add(g);
                    if (gid % split === c2) s2.add(g);
                }
                lookup.adjustments.set(s1, s2, kern((c1 << 8) | c2));
            }
        }
        for (let gid = 1; gid < 0x40; gid++) {
            lookup.adjustments.set(
                new Set([gOrd.at(0x4 * gid)]),
                new Set([gOrd.at(0x4 * gid)]),
                kern(gid)
            );
        }

        LookupRoundTripTest(lookup, roundtripConfig);
    });

    test("Plain + Scatter, variable", () => {
        const variation = SetupVariation();
        const { bold, wide } = variation.masters;

        const lookup = new Gpos.Pair();
        const split = 16;
        for (let c1 = 0; c1 < split; c1++) {
            for (let c2 = 0; c2 < split; c2++) {
                const s1 = new Set<OtGlyph>();
                const s2 = new Set<OtGlyph>();
                for (let gid = 0; gid < gOrd.length; gid++) {
                    const g = gOrd.at(gid);
                    if (gid % split === c1) s1.add(g);
                    if (gid % split === c2) s2.add(g);
                }
                lookup.adjustments.set(s1, s2, kern(variation.create([bold, (c1 << 8) | c2])));
            }
        }
        for (let gid = 1; gid < 0x40; gid++) {
            lookup.adjustments.set(
                new Set([gOrd.at(0x4 * gid)]),
                new Set([gOrd.at(0x4 * gid)]),
                kern(variation.create([bold, Math.round(gid / 8)], [wide, Math.round(-gid / 8)]))
            );
        }

        LookupRoundTripTest(lookup, { ...roundtripConfig, variation });
    });
});
