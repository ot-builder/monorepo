import { Data, Ot, Rectify } from "ot-builder";

export class StdPointAttachRectifier implements Rectify.PointAttachmentRectifier {
    constructor(
        readonly manner: Rectify.PointAttachmentRectifyManner = Rectify
            .PointAttachmentRectifyManner.TrustAttachment,
        readonly error = 1 / 16
    ) {}
    public acceptOffset(
        actual: Data.XYOptional<Ot.Var.Value>,
        desired: Data.XYOptional<Ot.Var.Value>
    ) {
        let xSame = Ot.Var.Ops.equal(actual.x || 0, desired.x || 0, this.error);
        let ySame = Ot.Var.Ops.equal(actual.y || 0, desired.y || 0, this.error);
        return { x: xSame, y: ySame };
    }
}
