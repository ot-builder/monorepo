import { Data } from "@ot-builder/prelude";

import { Gdef } from "./gdef";
import { Gpos, Gsub } from "./gsub-gpos";
import { Math as OtMath } from "./math";
import { Base } from "./table-base";

export * from "./common";
//
export { DicingStore, DicingStoreRep } from "./dicing-store";
export * from "./gdef";
export * from "./gsub-gpos";
export * from "./math";
export * from "./table-base";

// Aggregated
export interface OtFontLayoutData {
    gdef?: Data.Maybe<Gdef.Table>;
    gsub?: Data.Maybe<Gsub.Table>;
    gpos?: Data.Maybe<Gpos.Table>;
    base?: Data.Maybe<Base.Table>;
    math?: Data.Maybe<OtMath.Table>;
}
