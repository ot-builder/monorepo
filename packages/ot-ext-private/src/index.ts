import { Data } from "@ot-builder/prelude";

import { XPrv } from "./xprv";

export { XPrv } from "./xprv";

export interface OtExtPrivate {
    xPrv?: Data.Maybe<XPrv.Table>;
}
