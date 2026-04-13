import type { Data } from "@ot-builder/prelude";

import type * as XPrv from "./xprv";

export * as XPrv from "./xprv";

export interface OtExtPrivate {
    xPrv?: Data.Maybe<XPrv.Table>;
}
