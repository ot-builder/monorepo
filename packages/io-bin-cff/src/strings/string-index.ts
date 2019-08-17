import { Read, Write } from "@ot-builder/bin-util";

import { CffReadIndex } from "../cff-index/read";
import { CffWriteIndex } from "../cff-index/write";
import { CffReadContext } from "../context/read";
import { CffWriteContext } from "../context/write";

export const CffStringIndex = {
    ...Read((view, ctx: CffReadContext) => {
        return view.next(
            new CffReadIndex({ read: (view, ctx, size) => view.bytes(size).toString("utf8") }),
            ctx
        );
    }),
    ...Write((frag, strings: string[], ctx: CffWriteContext) => {
        frag.push(
            new CffWriteIndex<string>({
                write: (f, item, ctx) => f.bytes(Buffer.from(item, "utf8"))
            }),
            strings,
            ctx
        );
    })
};
