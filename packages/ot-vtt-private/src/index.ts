import { Data } from "@ot-builder/prelude";

import * as TSI0123 from "./tsi0123/index";
import * as TSI5 from "./tsi5/index";
import * as TSIC from "./tsic/index";

export * as TSI0123 from "./tsi0123/index";
export * as TSI5 from "./tsi5/index";
export * as TSIC from "./tsic/index";

export interface OtVttPrivate {
    tsi01?: Data.Maybe<TSI0123.Table>;
    tsi23?: Data.Maybe<TSI0123.Table>;
    tsi5?: Data.Maybe<TSI5.Table>;
    tsic?: Data.Maybe<TSIC.Table>;
}
