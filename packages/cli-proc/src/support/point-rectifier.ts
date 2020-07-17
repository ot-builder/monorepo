import * as Ot from "@ot-builder/ot";
import { Data } from "@ot-builder/prelude";
import * as Rectify from "@ot-builder/rectify";

export class StdPointAttachRectifier implements Rectify.PointAttachmentRectifier {
    constructor(
        public readonly manner: Rectify.PointAttachmentRectifyManner = Rectify
            .PointAttachmentRectifyManner.TrustAttachment,
        public readonly error = 1 / 16
    ) {}
    public acceptOffset(
        actual: Data.XYOptional<Ot.Var.Value>,
        desired: Data.XYOptional<Ot.Var.Value>
    ) {
        const xSame = Ot.Var.Ops.equal(actual.x || 0, desired.x || 0, this.error);
        const ySame = Ot.Var.Ops.equal(actual.y || 0, desired.y || 0, this.error);
        return { x: xSame, y: ySame };
    }
}
