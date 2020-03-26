import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Fpgm, Prep } from "@ot-builder/ot-glyphs";

export const FpgmIo = {
    read(view: BinaryView) {
        const buf = view.bytes(view.sourceBufferSize);
        return new Fpgm.Table(buf);
    },
    write(frag: Frag, table: Fpgm.Table) {
        frag.bytes(table.instructions);
    }
};

export const PrepIo = {
    read(view: BinaryView) {
        const buf = view.bytes(view.sourceBufferSize);
        return new Prep.Table(buf);
    },
    write(frag: Frag, table: Prep.Table) {
        frag.bytes(table.instructions);
    }
};
