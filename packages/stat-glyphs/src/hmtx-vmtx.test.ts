import { Head, MetricHead } from "@ot-builder/ft-metadata";

import { HmtxStat } from "./hmtx";
import { VmtxStat } from "./vmtx";

test("HMTX-VMTX stat test", () => {
    const hhea = new MetricHead.Hhea();
    const vhea = new MetricHead.Vhea();
    const statH = new HmtxStat(hhea, new Head.Table());
    const statV = new VmtxStat(vhea, null, statH);
    statV.setMetric(
        0,
        { start: 0, end: 1000 },
        { start: 800, end: -200 },
        { xMin: 50, xMax: 950, yMin: -150, yMax: 750 }
    );
    statV.settle();

    expect(hhea.minStartSideBearing).toBe(50);
    expect(hhea.minEndSideBearing).toBe(50);
    expect(vhea.minStartSideBearing).toBe(50);
    expect(vhea.minEndSideBearing).toBe(50);
    expect(statH.hmtx.measures[0].advance).toBe(1000);
    expect(statH.hmtx.measures[0].startSideBearing).toBe(50);
    expect(statV.vmtx.measures[0].advance).toBe(1000);
    expect(statV.vmtx.measures[0].startSideBearing).toBe(50);
    expect(statV.vorg.get(0)).toBe(800);
});
