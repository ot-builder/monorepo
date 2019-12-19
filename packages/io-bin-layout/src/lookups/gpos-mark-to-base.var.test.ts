import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gpos } from "@ot-builder/ft-layout";
import { BimapCtx, Disorder, LookupIdentity } from "@ot-builder/test-util";

import { GposMarkToBaseReader } from "./gpos-mark-read";
import { GposMarkToBaseWriter } from "./gpos-mark-write";
import { LookupRoundTripConfig, LookupRoundTripTest, SetupVariation } from "./test-util.test";

describe("GPOS mark-to-base lookup handler (variable)", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x400);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gpos.Lookup, Gpos.MarkToBase> = {
        gOrd,
        writer: () => new GposMarkToBaseWriter(),
        reader: () => new GposMarkToBaseReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GposMarkToBase.test(BimapCtx.from(gOrd), a, b);
        }
    };

    test("2MC Variable", () => {
        const variation = SetupVariation();
        const { bold, wide } = variation.masters;

        const lookup = Gpos.MarkToBase.create();
        const gidMaxMark = 0x100;
        for (let gid = 0; gid < gidMaxMark; gid++) {
            lookup.marks.set(gOrd.at(gid), {
                markAnchors: [
                    {
                        x: variation.create([bold, Math.round(-gid / 8)]),
                        y: variation.create([wide, Math.round(-gid / 8)])
                    },
                    { x: gid, y: gid }
                ]
            });
        }
        for (let gid = gidMaxMark; gid < gOrd.length; gid++) {
            lookup.bases.set(gOrd.at(gid), {
                baseAnchors:
                    gid % 2
                        ? [{ x: -gid, y: -gid }, null]
                        : [
                              null,
                              {
                                  x: variation.create([bold, Math.round(gid / 8)]),
                                  y: variation.create([wide, Math.round(gid / 8)])
                              }
                          ]
            });
        }
        lookup.marks = Disorder.shuffleMap(lookup.marks);
        lookup.bases = Disorder.shuffleMap(lookup.bases);

        LookupRoundTripTest(lookup, { ...roundtripConfig, variation });
    });
});
