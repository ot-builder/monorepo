import * as ImpLib from "@ot-builder/common-impl";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { Gsub } from "@ot-builder/ot-layout";
import { BimapCtx, LookupCtx, LookupIdentity } from "@ot-builder/test-util";

import { SubtableWriteTrick } from "../../gsub-gpos-shared/general";
import { GsubChainingReader, GsubContextualReader } from "../contextual-read";
import { GsubChainingContextualWriter } from "../contextual-write";

import { LookupRoundTripConfig, LookupRoundTripTest, TuGlyphSet } from "./-shared-test-util.test";

const gStore = OtListGlyphStoreFactory.createStoreFromSize(0x100);
const gOrd = gStore.decideOrder();

const ll = [new Gsub.Single(), new Gsub.Single(), new Gsub.Single()];
const lOrd = ImpLib.Order.fromList(`Lookups`, ll);

const roundtripConfig: LookupRoundTripConfig<Gsub.Lookup, Gsub.Chaining> = {
    gOrd,
    lOrd,
    writer: () => new GsubChainingContextualWriter(),
    reader: ty => (ty === 5 ? new GsubContextualReader() : new GsubChainingReader()),
    validate(gOrd, lOrd, a, b) {
        LookupIdentity.Chaining.test(
            LookupCtx.from(BimapCtx.from(gOrd), BimapCtx.from(lOrd)),
            a,
            b
        );
    }
};

test("GSUB/GPOS Contextual : Simple", () => {
    const lookup = new Gsub.Chaining();
    lookup.rules.push({
        match: [TuGlyphSet(gOrd, 0), TuGlyphSet(gOrd, 1)],
        inputBegins: 0,
        inputEnds: 2,
        applications: [{ at: 0, apply: lOrd.at(0) }]
    });
    lookup.rules.push({
        match: [
            TuGlyphSet(gOrd, 0, 4, 5, 8),
            TuGlyphSet(gOrd, 2, 78, 1, 34),
            TuGlyphSet(gOrd, 4, 99, 10, 8),
            TuGlyphSet(gOrd, 8, 10, 12, 13, 15)
        ],
        inputBegins: 1,
        inputEnds: 3,
        applications: [{ at: 0, apply: lOrd.at(1) }]
    });

    LookupRoundTripTest(lookup, roundtripConfig);
    LookupRoundTripTest(lookup, {
        ...roundtripConfig,
        trick: SubtableWriteTrick.ChainingForceFormat2
    });
    LookupRoundTripTest(lookup, {
        ...roundtripConfig,
        trick: SubtableWriteTrick.ChainingForceFormat3
    });
});
