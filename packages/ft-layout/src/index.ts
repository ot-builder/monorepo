import { Data } from "@ot-builder/prelude";

import { Gdef } from "./gdef";
import { Gpos, Gsub } from "./gsub-gpos";
import { Base } from "./table-base";

export * from "./common";
//
export { DicingStore } from "./dicing-store";
export * from "./gdef";
export * from "./gsub-gpos";
export * from "./table-base";

// Aggregated
export interface OtFontLayoutData {
    gdef?: Data.Maybe<Gdef.Table>;
    gsub?: Data.Maybe<Gsub.Table>;
    gpos?: Data.Maybe<Gpos.Table>;
    base?: Data.Maybe<Base.Table>;
}
