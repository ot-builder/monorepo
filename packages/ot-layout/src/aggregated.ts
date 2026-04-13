import type { Data } from "@ot-builder/prelude";

import type * as Gdef from "./gdef";
import type * as Gpos from "./gsub-gpos/table-gpos";
import type * as Gsub from "./gsub-gpos/table-gsub";
import type * as OtMath from "./math";
import type * as Base from "./table-base";

// Aggregated
export interface OtFontLayoutData {
    gdef?: Data.Maybe<Gdef.Table>;
    gsub?: Data.Maybe<Gsub.Table>;
    gpos?: Data.Maybe<Gpos.Table>;
    base?: Data.Maybe<Base.Table>;
    math?: Data.Maybe<OtMath.Table>;
}
