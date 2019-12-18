import { ImpLib } from "@ot-builder/common-impl";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gsub } from "@ot-builder/ft-layout";
import { BimapCtx, Disorder, LookupIdentity } from "@ot-builder/test-util";

import { GsubReverseReader, GsubReverseWriter } from "./gsub-reverse";
import { LookupRoundTripConfig, LookupRoundTripTest, TuGlyphSet } from "./test-util.test";

const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x100);
const gOrd = gStore.decideOrder();

const ll = [Gsub.Single.create(), Gsub.Single.create(), Gsub.Single.create()];
const lOrd = ImpLib.Order.fromList(`Lookups`, ll);

const roundtripConfig: LookupRoundTripConfig<Gsub.ReverseSub> = {
    gOrd,
    lOrd,
    writer: () => new GsubReverseWriter(),
    reader: () => new GsubReverseReader(),
    validate(gOrd, lOrd, a, b) {
        LookupIdentity.GsubReverse.test(BimapCtx.from(gOrd), a, b);
    }
};

test("GSUB Reverse sub : Simple", () => {
    const lookup = Gsub.ReverseSub.create();
    lookup.rules.push({
        match: [TuGlyphSet(gOrd, 0), TuGlyphSet(gOrd, 1)],
        doSubAt: 0,
        replacement: Disorder.shuffleMap(new Map([[gOrd.at(0), gOrd.at(3)]]))
    });
    lookup.rules.push({
        match: [TuGlyphSet(gOrd, 0, 3, 4, 5, 6, 7, 8), TuGlyphSet(gOrd, 2), TuGlyphSet(gOrd, 4)],
        doSubAt: 1,
        replacement: Disorder.shuffleMap(new Map([[gOrd.at(2), gOrd.at(4)]]))
    });

    LookupRoundTripTest(lookup, roundtripConfig);
});
