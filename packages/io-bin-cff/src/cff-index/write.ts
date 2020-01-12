import { Frag, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";

import { CffWriteContext } from "../context/write";
import { CffIndexCount } from "../structs/index.count";
import { CffOffSize } from "../structs/off-size";
import { CffOffset } from "../structs/offset";

export type CffIndexItemWriteContext = [CffWriteContext, number];

export class CffWriteIndex<T> implements Write<readonly T[], [CffWriteContext]> {
    constructor(private writeItem: Write<T, CffIndexItemWriteContext>) {}
    private collectOffsets(items: readonly T[], context: CffWriteContext) {
        Assert.NoGap("CFF Index items", items);
        let dataSize = 0;
        const offsets: number[] = [];
        const frags: Frag[] = [];
        for (let index = 0; index < items.length; index++) {
            offsets.push(dataSize);
            const fragItem = new Frag().push(this.writeItem, items[index], context, index);
            dataSize += fragItem.size;
            frags.push(fragItem);
        }
        offsets.push(dataSize);
        return { dataSize, offsets, frags };
    }
    private offsetSize(dataSize: number) {
        return dataSize < 0x100 ? 1 : dataSize < 0x10000 ? 2 : dataSize < 0x1000000 ? 3 : 4;
    }
    public write(frag: Frag, items: readonly T[], context: CffWriteContext) {
        Assert.NoGap("CFF Index items", items);
        const { dataSize, offsets, frags } = this.collectOffsets(items, context);
        frag.push(CffIndexCount, items.length, context.version);
        const offSize = this.offsetSize(dataSize);
        frag.push(CffOffSize, offSize);
        for (const item of offsets) frag.push(CffOffset, item, offSize);
        for (const frItem of frags) frag.embed(frItem);
    }
}
