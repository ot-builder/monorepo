import { Read, Write } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { MetricBasic, OtGlyph } from "@ot-builder/ft-glyphs";
import { Maxp, MetricHead } from "@ot-builder/ft-metadata";
import { Data } from "@ot-builder/prelude";

export const MetricBasicIo = {
    ...Read((view, hea: MetricHead.Table, maxp: Maxp.Table) => {
        const table = new MetricBasic.Table();

        let lastAdvance = 0;
        for (let gid = 0; gid < maxp.numGlyphs; gid++) {
            let m = new MetricBasic.Measure();
            if (gid < hea.numberOfLongMetrics) {
                m.advance = view.uint16();
                m.startSideBearing = view.int16();
            } else {
                m.advance = lastAdvance;
                m.startSideBearing = view.int16();
            }
            table.measures[gid] = m;
            lastAdvance = m.advance;
        }

        return table;
    }),
    ...Write((frag, mtx: MetricBasic.Table, hea: MetricHead.Table, gord: Data.Order<OtGlyph>) => {
        if (gord.length !== mtx.measures.length) {
            throw Errors.GlyphCountMismatch(`metric-static table writing`);
        }
        for (let gid = 0; gid < mtx.measures.length; gid++) {
            const measure = mtx.measures[gid];
            if (gid < hea.numberOfLongMetrics) {
                frag.uint16(measure.advance);
                frag.int16(measure.startSideBearing);
            } else {
                frag.int16(measure.startSideBearing);
            }
        }
    })
};
