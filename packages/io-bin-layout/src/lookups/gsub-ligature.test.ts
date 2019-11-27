import { ImpLib } from "@ot-builder/common-impl";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gsub } from "@ot-builder/ft-layout";
import { BimapCtx, Disorder, LookupIdentity } from "@ot-builder/test-util";

import { GsubLigatureReader, GsubLigatureWriter } from "./gsub-ligature";
import { LookupRoundTripConfig, LookupRoundTripTest } from "./test-util.test";

describe("GSUB ligature lookup handler", () => {
    const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x4000);
    for (let gid = 0; gid < gStore.items.length; gid++) gStore.items[gid].name = "glyph" + gid;
    const gOrd = gStore.decideOrder();

    const roundtripConfig: LookupRoundTripConfig<Gsub.Ligature> = {
        gOrd,
        writer: () => new GsubLigatureWriter(),
        reader: () => new GsubLigatureReader(),
        validate(gOrd, lOrd, a, b) {
            LookupIdentity.GsubLigature.test(BimapCtx.from(gOrd), a, b);
        }
    };

    test("Exhaustive", () => {
        const lookup = new Gsub.Ligature();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.mapping.set(
                [
                    gOrd.at((gid + 0x30) % gOrd.length),
                    gOrd.at((gid - 0x30 + gOrd.length) % gOrd.length)
                ],
                gOrd.at(gid)
            );
        }
        lookup.mapping = ImpLib.PathMapImpl.create(
            Disorder.shuffleArray([...lookup.mapping.entries()])
        );
        LookupRoundTripTest(lookup, roundtripConfig);
    });

    test("Many overlapping", () => {
        const lookup = new Gsub.Ligature();
        for (let gid = 0; gid < gOrd.length; gid++) {
            lookup.mapping.set(
                [
                    gOrd.at((gid + 0x30) % 16),
                    gOrd.at((gid - 0x30 + gOrd.length) % gOrd.length),
                    gOrd.at((gid - 0x60 + gOrd.length) % gOrd.length)
                ],
                gOrd.at(gid)
            );
        }
        lookup.mapping = ImpLib.PathMapImpl.create(
            Disorder.shuffleArray([...lookup.mapping.entries()])
        );
        LookupRoundTripTest(lookup, roundtripConfig);
    });
});
