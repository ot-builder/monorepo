import { LayoutAdjustment } from "./adjust";
import { LayoutAnchor, LayoutCursiveAnchorPair } from "./anchor";
import { LayoutClassDef, LayoutCoverage } from "./matching";

export namespace LayoutCommon {
    export import Adjust = LayoutAdjustment;
    export import Anchor = LayoutAnchor;
    export import CursiveAnchorPair = LayoutCursiveAnchorPair;
    export import Coverage = LayoutCoverage;
    export import ClassDef = LayoutClassDef;
}
