import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gpos } from "@ot-builder/ft-layout";
import { BimapCtx, Disorder, LookupIdentity } from "@ot-builder/test-util";

import { GposMarkToBaseReader } from "./gpos-mark-read";
import { GposMarkToBaseWriter } from "./gpos-mark-write";
import { LookupRoundTripConfig, LookupRoundTripTest } from "./test-util.test";

describe("GPOS mark-to-base lookup handler", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x4000);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gpos.MarkToBase> = {
        gOrd,
        writer: () => new GposMarkToBaseWriter(),
        reader: () => new GposMarkToBaseReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GposMarkToBase.test(BimapCtx.from(gOrd), a, b);
        }
    };

    test("1MC", () => {
        const lookup = new Gpos.MarkToBase();
        const gidMaxMark = 0x100;
        for (let gid = 0; gid < gidMaxMark; gid++) {
            lookup.marks.set(gOrd.at(gid), { markAnchors: [{ x: gid, y: gid }] });
        }
        for (let gid = gidMaxMark; gid < gOrd.length; gid++) {
            lookup.bases.set(gOrd.at(gid), { baseAnchors: [{ x: gid, y: gid }] });
        }
        lookup.marks = Disorder.shuffleMap(lookup.marks);
        lookup.bases = Disorder.shuffleMap(lookup.bases);

        LookupRoundTripTest(lookup, roundtripConfig);
    });
    test("2MC", () => {
        const lookup = new Gpos.MarkToBase();
        const gidMaxMark = 0x100;
        for (let gid = 0; gid < gidMaxMark; gid++) {
            lookup.marks.set(gOrd.at(gid), {
                markAnchors: [
                    { x: gid, y: gid },
                    { x: gid, y: gid }
                ]
            });
        }
        for (let gid = gidMaxMark; gid < gOrd.length; gid++) {
            lookup.bases.set(gOrd.at(gid), {
                baseAnchors: gid % 2 ? [{ x: -gid, y: -gid }, null] : [null, { x: -gid, y: -gid }]
            });
        }
        lookup.marks = Disorder.shuffleMap(lookup.marks);
        lookup.bases = Disorder.shuffleMap(lookup.bases);

        LookupRoundTripTest(lookup, roundtripConfig);
    });
});
