import { Gpos } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";

import * as FastMatch from "../../fast-match";

// TODO: compare device tables / anchor attachments
export function GposAdjIdentity(expected: Gpos.Adjustment, actual: Gpos.Adjustment, place = "") {
    FastMatch.otvar(expected.dX, actual.dX, place + "/dX");
    FastMatch.otvar(expected.dY, actual.dY, place + "/dY");
    FastMatch.otvar(expected.dWidth, actual.dWidth, place + "/dWidth");
    FastMatch.otvar(expected.dHeight, actual.dHeight, place + "/dHeight");
}

export function GposAnchorIdentity(
    expected: Data.Maybe<Gpos.Anchor>,
    actual: Data.Maybe<Gpos.Anchor>,
    place = ""
) {
    if (!expected && !actual) return;
    if (!expected) throw new Error("Expected to be null but present @ " + place);
    if (!actual) throw new Error("Expected to be not null but absent @ " + place);
    FastMatch.otvar(expected.x, actual.x, place + "/x");
    FastMatch.otvar(expected.y, actual.y, place + "/y");
}
