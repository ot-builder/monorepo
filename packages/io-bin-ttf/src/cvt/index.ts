import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Cvt } from "@ot-builder/ft-glyphs";
import { Int16 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export const CvtIo = {
    read(view: BinaryView) {
        const count = view.sourceBufferSize / Int16.size;
        const entries = view.array(count, Int16);
        return new Cvt.Table(entries);
    },
    write(frag: Frag, table: Cvt.Table) {
        frag.array(Int16, table.items.map(x => OtVar.Ops.originOf(x)));
    }
};
