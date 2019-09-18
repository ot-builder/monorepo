import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";
import { Rectify, RectifyImpl } from "@ot-builder/rectify";
import { OtVar } from "@ot-builder/variance";

export namespace Base {
    export const Tag = "BASE";

    export class Table
        implements Rectify.Glyph.RectifiableT<OtGlyph>, Rectify.Coord.RectifiableT<OtVar.Value> {
        public horizontal: Data.Maybe<AxisTable> = null;
        public vertical: Data.Maybe<AxisTable> = null;

        public rectifyCoords(rec: Rectify.Coord.RectifierT<OtVar.Value>) {
            if (this.horizontal) this.horizontal.rectifyCoords(rec);
            if (this.vertical) this.vertical.rectifyCoords(rec);
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<OtGlyph>) {
            if (this.horizontal) this.horizontal.rectifyGlyphs(rec);
            if (this.vertical) this.vertical.rectifyGlyphs(rec);
        }
    }

    export class AxisTable
        implements Rectify.Glyph.RectifiableT<OtGlyph>, Rectify.Coord.RectifiableT<OtVar.Value> {
        public baselineTags: Data.Maybe<Array<Tag>> = null;
        public scripts: Map<Tag, Script> = new Map();
        public rectifyCoords(rec: Rectify.Coord.RectifierT<OtVar.Value>) {
            for (const script of this.scripts.values()) script.rectifyCoords(rec);
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<OtGlyph>) {
            for (const script of this.scripts.values()) script.rectifyGlyphs(rec);
        }
    }

    export class Script
        implements Rectify.Glyph.RectifiableT<OtGlyph>, Rectify.Coord.RectifiableT<OtVar.Value> {
        public baseValues: Data.Maybe<BaseValues> = null;
        public defaultMinMax: Data.Maybe<MinMaxTable> = null;
        public baseLangSysRecords: Data.Maybe<Map<Tag, MinMaxTable>> = null;

        public rectifyCoords(rec: Rectify.Coord.RectifierT<OtVar.Value>) {
            if (this.baseValues) this.baseValues.rectifyCoords(rec);
            if (this.defaultMinMax) this.defaultMinMax.rectifyCoords(rec);
            if (this.baseLangSysRecords) {
                for (const [tag, mm] of this.baseLangSysRecords) mm.rectifyCoords(rec);
            }
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<OtGlyph>) {
            if (this.baseValues) this.baseValues.rectifyGlyphs(rec);
            if (this.defaultMinMax) this.defaultMinMax.rectifyGlyphs(rec);
            if (this.baseLangSysRecords) {
                for (const [tag, mm] of this.baseLangSysRecords) mm.rectifyGlyphs(rec);
            }
        }
    }

    export class BaseValues
        implements Rectify.Glyph.RectifiableT<OtGlyph>, Rectify.Coord.RectifiableT<OtVar.Value> {
        public defaultBaselineIndex: number = 0;
        public baseValues: Map<Tag, CoordT<OtGlyph, OtVar.Value>> = new Map();

        public rectifyCoords(rec: Rectify.Coord.RectifierT<OtVar.Value>) {
            this.baseValues = RectifyImpl.mapSomeT(
                rec,
                this.baseValues,
                RectifyImpl.Id,
                rectifyBaseCoordCoord
            );
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<OtGlyph>) {
            this.baseValues = RectifyImpl.mapSomeT(
                rec,
                this.baseValues,
                RectifyImpl.Id,
                rectifyBaseCoordGlyph
            );
        }
    }

    export class MinMaxTable
        implements Rectify.Glyph.RectifiableT<OtGlyph>, Rectify.Coord.RectifiableT<OtVar.Value> {
        constructor(
            public defaultMinMax: MinMaxValueT<OtGlyph, OtVar.Value>,
            public featMinMax: Map<Tag, MinMaxValueT<OtGlyph, OtVar.Value>>
        ) {}
        public rectifyCoords(rec: Rectify.Coord.RectifierT<OtVar.Value>) {
            this.defaultMinMax = rectifyMinMaxValueCoord(rec, this.defaultMinMax);
            this.featMinMax = RectifyImpl.mapSomeT(
                rec,
                this.featMinMax,
                RectifyImpl.Id,
                rectifyMinMaxValueCoord
            );
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<OtGlyph>) {
            this.defaultMinMax = rectifyMinMaxValueGlyph(rec, this.defaultMinMax);
            this.featMinMax = RectifyImpl.mapSomeT(
                rec,
                this.featMinMax,
                RectifyImpl.Id,
                rectifyMinMaxValueGlyph
            );
        }
    }

    // Min-max value pair
    export type MinMaxValue = MinMaxValueT<OtGlyph, OtVar.Value>;
    export interface MinMaxValueT<G, X> {
        readonly minCoord: Data.Maybe<CoordT<G, X>>;
        readonly maxCoord: Data.Maybe<CoordT<G, X>>;
    }
    function rectifyMinMaxValueCoord<G, X>(
        rec: Rectify.Coord.RectifierT<X>,
        lc: MinMaxValueT<G, X>
    ): MinMaxValueT<G, X> {
        return {
            minCoord: RectifyImpl.maybeT(rec, lc.minCoord, rectifyBaseCoordCoord),
            maxCoord: RectifyImpl.maybeT(rec, lc.maxCoord, rectifyBaseCoordCoord)
        };
    }
    function rectifyMinMaxValueGlyph<G, X>(
        rec: Rectify.Glyph.RectifierT<G>,
        lc: MinMaxValueT<G, X>
    ): MinMaxValueT<G, X> {
        return {
            minCoord: RectifyImpl.maybeT(rec, lc.minCoord, rectifyBaseCoordGlyph),
            maxCoord: RectifyImpl.maybeT(rec, lc.maxCoord, rectifyBaseCoordGlyph)
        };
    }

    // Base coord
    export type Coord = CoordT<OtGlyph, OtVar.Value>;

    export interface CoordT<G, X> {
        readonly at: X;
        readonly pointAttachment?: Data.Maybe<OtGlyph.GlyphPointIDRef<G>>;
        readonly deviceDeltas?: Data.Maybe<ReadonlyArray<number>>;
    }
    function rectifyBaseCoordCoord<G, X>(
        rec: Rectify.Coord.RectifierT<X>,
        lc: CoordT<G, X>
    ): CoordT<G, X> {
        return { ...lc, at: rec.coord(lc.at) };
    }

    function rectifyBaseCoordGlyph<G, X>(
        rec: Rectify.Glyph.RectifierT<G>,
        lc: CoordT<G, X>
    ): CoordT<G, X> {
        if (!lc.pointAttachment) return lc;
        const g1 = rec.glyph(lc.pointAttachment.glyph);
        if (!g1) return { ...lc, pointAttachment: null };
        else return { ...lc, pointAttachment: { ...lc.pointAttachment, glyph: g1 } };
    }
}
