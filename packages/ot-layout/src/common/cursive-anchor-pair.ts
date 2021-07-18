import { Data } from "@ot-builder/prelude";

import * as LayoutAnchor from "./anchor";

export interface T<X> {
    readonly entry: Data.Maybe<LayoutAnchor.T<X>>;
    readonly exit: Data.Maybe<LayoutAnchor.T<X>>;
}
