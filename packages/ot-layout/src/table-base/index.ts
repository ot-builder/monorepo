import { OtGlyph } from "@ot-builder/ot-glyphs";
import { OtVar } from "@ot-builder/variance";

import { GeneralBase } from "./general";

export namespace Base {
    export const Tag = "BASE";

    export import General = GeneralBase;

    export class Table extends GeneralBase.TableT<OtGlyph, OtVar.Value> {}
    export class AxisTable extends GeneralBase.AxisTableT<OtGlyph, OtVar.Value> {}
    export class Script extends GeneralBase.ScriptT<OtGlyph, OtVar.Value> {}
    export class BaseValues extends GeneralBase.BaseValuesT<OtGlyph, OtVar.Value> {}
    export class MinMaxTable extends GeneralBase.MinMaxTableT<OtGlyph, OtVar.Value> {}
    export type MinMaxValue = GeneralBase.MinMaxValueT<OtGlyph, OtVar.Value>;
    export type Coord = GeneralBase.CoordT<OtGlyph, OtVar.Value>;
}
