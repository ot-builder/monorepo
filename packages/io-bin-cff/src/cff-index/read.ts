import { BinaryView, Read } from "@ot-builder/bin-util";

import { CffReadContext } from "../context/read";
import { CffIndexCount } from "../structs/index.count";
import { CffOffSize } from "../structs/off-size";
import { CffOffset } from "../structs/offset";

export type CffIndexItemReadContext = [CffReadContext, number, number];

export class CffReadIndex<T> implements Read<T[], [CffReadContext]> {
    constructor(private readItem: Read<T, CffIndexItemReadContext>) {}
    public read(view: BinaryView, context: CffReadContext) {
        const count = view.next(CffIndexCount, context.version);
        const offSize = view.next(CffOffSize);
        const offsets = view.array(count + 1, CffOffset, offSize);
        const vwData = view.liftRelative(0);
        const items: T[] = [];
        for (const [v, index] of vwData.repeat(count)) {
            const vwItem = vwData.lift(offsets[index]);
            items[index] = vwItem.next(
                this.readItem,
                context,
                offsets[index + 1] - offsets[index],
                index
            );
        }
        view.bytes(offsets[count]);
        return items;
    }
}
