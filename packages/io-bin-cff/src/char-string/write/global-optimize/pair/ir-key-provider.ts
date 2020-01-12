import { Mir, MirType } from "../../mir";

import { KeyProvider } from "./pairing";

export const MirKeyProvider: KeyProvider<Mir> = {
    getIrKey(ir: Mir) {
        switch (ir.type) {
            case MirType.Nop:
                return `Z`;
            case MirType.Operand:
                return `N[${ir.arg}]`;
            case MirType.Operator: {
                let s = `O[${ir.opCode}`;
                if (ir.flags) for (const x of ir.flags) s += `,${x}`;
                s += "]";

                return s;
            }
            case MirType.NonTerminal:
                return `I[${ir.id}]`;
        }
    },
    isBarrier(ir: Mir) {
        return ir.type === MirType.Nop;
    }
};
