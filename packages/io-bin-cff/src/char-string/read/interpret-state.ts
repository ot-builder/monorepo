import type { OtVar } from "@ot-builder/variance";

import { CffStackMachine } from "../../interp/stack-machine";

import type { CffCharStringInterpState } from "./interpreter";

export class CffCharStringInterpStateImpl
    extends CffStackMachine
    implements CffCharStringInterpState
{
    public getRandom() {
        return 0;
    }
    public transient: OtVar.Value[] = [];
    public log = "";
}
