import { OtVar } from "@ot-builder/variance";

export namespace TestVariance {
    export function createWellKnownAxes() {
        const wght = new OtVar.Dim("wght", 100, 400, 900);
        const wdth = new OtVar.Dim("wdth", 25, 100, 200);
        const opsz = new OtVar.Dim("opsz", 6, 12, 72);

        return { wght, wdth, opsz };
    }
}
