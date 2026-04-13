import type { Data } from "@ot-builder/prelude";

import type * as Meta from "./tables/meta";
import type * as Name from "./tables/name";
import type * as Stat from "./tables/stat";

export interface OtNameData {
    name?: Data.Maybe<Name.Table>;
    stat?: Data.Maybe<Stat.Table>;
    meta?: Data.Maybe<Meta.Table>;
}
