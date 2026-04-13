import type { Data } from "@ot-builder/prelude";

import type * as Cvt from "./cvt";
import type * as Fpgm from "./fpgm";
import type * as Prep from "./prep";

export interface TtfCoGlyphs {
    fpgm?: Data.Maybe<Fpgm.Table>;
    prep?: Data.Maybe<Prep.Table>;
    cvt?: Data.Maybe<Cvt.Table>;
}
