import { Data } from "@ot-builder/prelude";

import { Meta } from "./meta";
import { Name } from "./name";
import { Stat } from "./stat";

export * from "./name";
export * from "./stat";
export * from "./meta";

export interface OtNameData {
    name?: Data.Maybe<Name.Table>;
    stat?: Data.Maybe<Stat.Table>;
    meta?: Data.Maybe<Meta.Table>;
}
