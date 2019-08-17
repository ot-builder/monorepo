import { Read } from "@ot-builder/bin-util";

import { CffReadContext } from "../context/read";

import { CffReadIndex } from "./read";

export const CffDeferIndex = {
    ...Read((view, ctx: CffReadContext) => {
        return view.next(new CffReadIndex({ read: (view, ctx, size) => ({ view, size }) }), ctx);
    })
};
