import { OtVar, OV } from "@ot-builder/variance";
import * as util from "util";

export namespace FastMatch {
    export function exactly<T>(actual: T, expected: T) {
        if (actual !== expected) expect(actual).toBe(expected);
    }

    export function otvar(
        expected: OtVar.Value,
        actual: OtVar.Value,
        place: string = "",
        error: number = 1
    ) {
        const vvEq = OV.equal(expected, actual, error);
        if (!vvEq) {
            let msg = `Value mismatch${place ? " at " + place : ""}\n`;
            msg +=
                ` - MASTER: (default), Expected: ${OV.evaluate(expected, null)},` +
                ` Actual: ${OV.evaluate(actual, null)}\n`;
            for (const [master] of [...OV.varianceOf(expected), ...OV.varianceOf(actual)]) {
                const expValue = OV.evaluate(expected, master.getPeak());
                const actValue = OV.evaluate(actual, master.getPeak());
                const delta = Math.abs(expValue - actValue);
                let warning = "";
                if (Math.abs(expValue - actValue) > error) {
                    warning = ` | Delta = ${delta} > ${error}`;
                }
                msg += ` - MASTER: ${master}, Expected: ${expValue} | Actual: ${actValue}${warning}\n`;
            }
            msg += `Expected value: ${util.inspect(expected)}\n`;
            msg += `Actual value: ${util.inspect(actual)}\n`;
            throw new Error(msg);
        }
    }
}
