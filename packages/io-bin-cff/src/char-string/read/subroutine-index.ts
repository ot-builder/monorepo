import { Read, Write } from "@ot-builder/bin-util";

import { CffReadIndex } from "../../cff-index/read";
import { CffWriteIndex } from "../../cff-index/write";
import { CffReadContext } from "../../context/read";
import { CffWriteContext } from "../../context/write";

export const CffSubroutineIndex = {
    ...Read((view, ctx: CffReadContext) => {
        return view.next(new CffReadIndex({ read: (view, ctx, size) => view.bytes(size) }), ctx);
    }),
    ...Write((frag, subrs: Buffer[], ctx: CffWriteContext) => {
        frag.push(
            new CffWriteIndex<Buffer>({ write: (f, item, ctx) => f.bytes(item) }),
            subrs,
            ctx
        );
    })
};

export const CffBufferIndex = CffSubroutineIndex;
