import { BinaryView, Frag } from "@ot-builder/bin-util";
import { FpgmPrep } from "@ot-builder/ft-glyphs";

export const FpgmPrepIo = {
    read(view: BinaryView) {
        let buf = view.bytes(view.sourceBufferSize);
        return new FpgmPrep.Table(buf);
    },
    write(frag: Frag, table: FpgmPrep.Table) {
        frag.bytes(table.instructions);
    }
};
