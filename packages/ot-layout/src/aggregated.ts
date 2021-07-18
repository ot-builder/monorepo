import { Data } from "@ot-builder/prelude";

import * as Gdef from "./gdef";
import * as Gpos from "./gsub-gpos/table-gpos";
import * as Gsub from "./gsub-gpos/table-gsub";
import * as OtMath from "./math";
import * as Base from "./table-base";

// Aggregated
export interface OtFontLayoutData {
    gdef?: Data.Maybe<Gdef.Table>;
    gsub?: Data.Maybe<Gsub.Table>;
    gpos?: Data.Maybe<Gpos.Table>;
    base?: Data.Maybe<Base.Table>;
    math?: Data.Maybe<OtMath.Table>;
}
