import { Data } from "@ot-builder/prelude";

import * as Cvt from "./cvt";
import * as Fpgm from "./fpgm";
import * as Prep from "./prep";

export interface TtfCoGlyphs {
    fpgm?: Data.Maybe<Fpgm.Table>;
    prep?: Data.Maybe<Prep.Table>;
    cvt?: Data.Maybe<Cvt.Table>;
}
