import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import * as GeneralGlyph from "../general-glyph/index";

import * as OtGlyphStat from "./stat";

export interface Source {
    getHMetric(
        gid: number,
        extent: Data.Maybe<OtGlyphStat.BoundingBox>
    ): Data.Maybe<GeneralGlyph.Metric.T<OtVar.Value>>;
    getVMetric(
        gid: number,
        extent: Data.Maybe<OtGlyphStat.BoundingBox>
    ): Data.Maybe<GeneralGlyph.Metric.T<OtVar.Value>>;
}

export class Forward implements Source {
    constructor(private outer?: Data.Maybe<Source>) {}

    public getHMetric(gid: number, extent: Data.Maybe<OtGlyphStat.BoundingBox>) {
        if (this.outer) return this.outer.getHMetric(gid, extent);
        else return undefined;
    }
    public getVMetric(gid: number, extent: Data.Maybe<OtGlyphStat.BoundingBox>) {
        if (this.outer) return this.outer.getVMetric(gid, extent);
        else return undefined;
    }
}
