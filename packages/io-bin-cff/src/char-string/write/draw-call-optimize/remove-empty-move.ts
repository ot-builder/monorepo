import { CharStringOperator } from "../../../interp/operator";
import { CffDrawCall } from "../draw-call";

import { argIsZero, DrawCallOmit } from "./general";

export class RemoveEmptyMove extends DrawCallOmit {
    protected match(dc: CffDrawCall) {
        return (
            dc.operator === CharStringOperator.RLineTo &&
            argIsZero(dc.args[0]) &&
            argIsZero(dc.args[1])
        );
    }
}
