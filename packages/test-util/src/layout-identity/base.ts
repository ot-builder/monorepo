import { Base } from "@ot-builder/ot-layout";

import { Compare, EmptyCtx, StdCompare } from "../compar-util";
import { FastMatch } from "../fast-match";

export namespace BaseIdentity {
    export const test = StdCompare((bim: EmptyCtx, a: Base.Table, b: Base.Table) => {
        Compare.optional(bim, a.horizontal, b.horizontal, testBaseAxis);
        Compare.optional(bim, a.vertical, b.vertical, testBaseAxis);
    });

    const testBaseAxis = StdCompare((bim: EmptyCtx, a: Base.AxisTable, b: Base.AxisTable) => {
        expect(a.baselineTags).toEqual(b.baselineTags);
        Compare.map(bim, a.scripts, b.scripts, testBaseScript);
    });

    const testBaseScript = StdCompare((bim: EmptyCtx, a: Base.Script, b: Base.Script) => {
        testBaseValues(bim, a.baseValues, b.baseValues);
        testMinMaxTable(bim, a.defaultMinMax, b.defaultMinMax);
        Compare.optional(bim, a.baseLangSysRecords, b.baseLangSysRecords, (bim, a, b) =>
            Compare.map(bim, a, b, testMinMaxTable)
        );
    });

    const testBaseValues = StdCompare((bim: EmptyCtx, a: Base.BaseValues, b: Base.BaseValues) => {
        FastMatch.exactly(a.defaultBaselineIndex, b.defaultBaselineIndex);
        Compare.map(bim, a.baseValues, b.baseValues, (c, a, b) => FastMatch.otvar(a.at, b.at));
    });

    const testMinMaxTable = StdCompare(
        (bim: EmptyCtx, a: Base.MinMaxTable, b: Base.MinMaxTable) => {
            testMinMaxValue(bim, a.defaultMinMax, b.defaultMinMax);
        }
    );

    const testMinMaxValue = StdCompare(
        (bim: EmptyCtx, a: Base.MinMaxValue, b: Base.MinMaxValue) => {
            testBaseCoord(bim, a.minCoord, b.minCoord);
            testBaseCoord(bim, a.maxCoord, b.maxCoord);
        }
    );

    const testBaseCoord = StdCompare((ctx: EmptyCtx, a: Base.Coord, b: Base.Coord) => {
        FastMatch.otvar(a.at, b.at);
    });
}
