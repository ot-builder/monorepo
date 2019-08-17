import { CffWriteContext } from "../../../context/write";

import { DrawCallOptimizationPass } from "./general";
import { RRCurveToHHVVCurve } from "./hhvv-curveto";
import { RLineToHVLine } from "./hv-lineto";
import { RMoveToHVMove, RMoveToHVMoveW } from "./hv-moveto";
import { RRCurveToHVVHCurve } from "./hvvh-curveto";
import { RemoveEmptyMove } from "./remove-empty-move";

export function StandardDrawCallOptimizers(
    ctx: CffWriteContext
): DrawCallOptimizationPass<unknown>[] {
    return [
        new RemoveEmptyMove(ctx),
        new RLineToHVLine(ctx),
        new RRCurveToHVVHCurve(ctx),
        new RRCurveToHHVVCurve(ctx),
        new RMoveToHVMove(ctx),
        new RMoveToHVMoveW(ctx)
    ];
}
export function MinimalDrawCallOptimizers(
    ctx: CffWriteContext
): DrawCallOptimizationPass<unknown>[] {
    return [new RemoveEmptyMove(ctx)];
}
