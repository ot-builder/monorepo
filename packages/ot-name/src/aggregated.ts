import { Data } from "@ot-builder/prelude";

import * as Meta from "./tables/meta";
import * as Name from "./tables/name";
import * as Stat from "./tables/stat";

export interface OtNameData {
    name?: Data.Maybe<Name.Table>;
    stat?: Data.Maybe<Stat.Table>;
    meta?: Data.Maybe<Meta.Table>;
}
