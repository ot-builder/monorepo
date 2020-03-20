import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gpos } from "@ot-builder/ft-layout";
import { BimapCtx, Disorder, LookupIdentity } from "@ot-builder/test-util";

import { GposCursiveReader, GposCursiveWriter } from "../gpos-cursive";

import {
    LookupRoundTripConfig,
    LookupRoundTripTest,
    SetupVariation
} from "./-shared-test-util.test";

describe("GPOS cursive lookup handler", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0xffff);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gpos.Lookup, Gpos.Cursive> = {
        gOrd,
        writer: () => new GposCursiveWriter(),
        reader: () => new GposCursiveReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GposCursive.test(BimapCtx.from(gOrd), a, b);
        }
    };

    test("Very different", () => {
        const lookup = new Gpos.Cursive();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.attachments.set(gOrd.at(gid), {
                entry: {
                    x: Math.round(gid / 8),
                    y: Math.round(-gid / 8)
                },
                exit: {
                    x: Math.round((gid * 2) / 8),
                    y: Math.round((-gid * 2) / 8)
                }
            });
        }
        lookup.attachments = Disorder.shuffleMap(lookup.attachments);

        LookupRoundTripTest(lookup, roundtripConfig);
    });
    test("Very same", () => {
        const lookup = new Gpos.Cursive();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.attachments.set(gOrd.at(gid), {
                entry: {
                    x: Math.round(gid / 8),
                    y: Math.round(-gid / 8)
                },
                exit: {
                    x: Math.round((gid * 2) / 8),
                    y: Math.round((-gid * 2) / 8)
                }
            });
        }
        lookup.attachments = Disorder.shuffleMap(lookup.attachments);

        LookupRoundTripTest(lookup, roundtripConfig);
    });
    test("Very different variable", () => {
        const variation = SetupVariation();
        const { bold, wide } = variation.masters;

        const lookup = new Gpos.Cursive();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.attachments.set(gOrd.at(gid), {
                entry: {
                    x: variation.create([bold, Math.round(gid / 8)]),
                    y: variation.create([wide, Math.round(-gid / 8)])
                },
                exit: {
                    x: variation.create([bold, Math.round((gid * 2) / 8)]),
                    y: variation.create([wide, Math.round((-gid * 2) / 8)])
                }
            });
        }
        lookup.attachments = Disorder.shuffleMap(lookup.attachments);

        LookupRoundTripTest(lookup, { ...roundtripConfig, variation });
    });
});
