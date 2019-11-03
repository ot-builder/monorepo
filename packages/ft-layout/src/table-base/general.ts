import { RectifyImpl } from "@ot-builder/common-impl";
import { Data, Rectify } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";

import { BaseSubParts } from "./sub-parts";

export namespace GeneralBase {
    export class TableT<G, X>
        implements
            Rectify.Glyph.RectifiableT<G>,
            Rectify.Coord.RectifiableT<X>,
            Rectify.PointAttach.NonTerminalT<G, X> {
        public horizontal: Data.Maybe<AxisTableT<G, X>> = null;
        public vertical: Data.Maybe<AxisTableT<G, X>> = null;

        public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
            if (this.horizontal) this.horizontal.rectifyCoords(rec);
            if (this.vertical) this.vertical.rectifyCoords(rec);
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
            if (this.horizontal) this.horizontal.rectifyGlyphs(rec);
            if (this.vertical) this.vertical.rectifyGlyphs(rec);
        }
        public rectifyPointAttachment(rec: Rectify.PointAttach.RectifierT<G, X>) {
            if (this.horizontal) this.horizontal.rectifyPointAttachment(rec, true);
            if (this.vertical) this.vertical.rectifyPointAttachment(rec, false);
        }
    }

    export class AxisTableT<G, X>
        implements Rectify.Glyph.RectifiableT<G>, Rectify.Coord.RectifiableT<X> {
        public baselineTags: Data.Maybe<Array<Tag>> = null;
        public scripts: Map<Tag, ScriptT<G, X>> = new Map();
        public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
            for (const script of this.scripts.values()) script.rectifyCoords(rec);
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
            for (const script of this.scripts.values()) script.rectifyGlyphs(rec);
        }
        public rectifyPointAttachment(
            rec: Rectify.PointAttach.RectifierT<G, X>,
            horizontal: boolean
        ) {
            for (const script of this.scripts.values()) {
                script.rectifyPointAttachment(rec, horizontal);
            }
        }
    }

    export class ScriptT<G, X>
        implements Rectify.Glyph.RectifiableT<G>, Rectify.Coord.RectifiableT<X> {
        public baseValues: Data.Maybe<BaseValuesT<G, X>> = null;
        public defaultMinMax: Data.Maybe<MinMaxTableT<G, X>> = null;
        public baseLangSysRecords: Data.Maybe<Map<Tag, MinMaxTableT<G, X>>> = null;

        public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
            if (this.baseValues) this.baseValues.rectifyCoords(rec);
            if (this.defaultMinMax) this.defaultMinMax.rectifyCoords(rec);
            if (this.baseLangSysRecords) {
                for (const [tag, mm] of this.baseLangSysRecords) mm.rectifyCoords(rec);
            }
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
            if (this.baseValues) this.baseValues.rectifyGlyphs(rec);
            if (this.defaultMinMax) this.defaultMinMax.rectifyGlyphs(rec);
            if (this.baseLangSysRecords) {
                for (const [tag, mm] of this.baseLangSysRecords) mm.rectifyGlyphs(rec);
            }
        }
        public rectifyPointAttachment(
            rec: Rectify.PointAttach.RectifierT<G, X>,
            horizontal: boolean
        ) {
            if (this.defaultMinMax) this.defaultMinMax.rectifyPointAttachment(rec, horizontal);
            if (this.baseLangSysRecords) {
                for (const [tag, mm] of this.baseLangSysRecords) {
                    mm.rectifyPointAttachment(rec, horizontal);
                }
            }
        }
    }

    export class BaseValuesT<G, X>
        implements Rectify.Glyph.RectifiableT<G>, Rectify.Coord.RectifiableT<X> {
        public defaultBaselineIndex: number = 0;
        public baseValues: Map<Tag, CoordT<G, X>> = new Map();

        public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
            this.baseValues = RectifyImpl.mapSomeT(
                rec,
                this.baseValues,
                RectifyImpl.Id,
                BaseSubParts.rectifyBaseCoordCoord
            );
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
            this.baseValues = RectifyImpl.mapSomeT(
                rec,
                this.baseValues,
                RectifyImpl.Id,
                BaseSubParts.rectifyBaseCoordGlyph
            );
        }
    }

    export class MinMaxTableT<G, X>
        implements Rectify.Glyph.RectifiableT<G>, Rectify.Coord.RectifiableT<X> {
        constructor(
            public defaultMinMax: MinMaxValueT<G, X>,
            public featMinMax: Map<Tag, MinMaxValueT<G, X>>
        ) {}
        public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
            this.defaultMinMax = BaseSubParts.rectifyMinMaxValueCoord(rec, this.defaultMinMax);
            this.featMinMax = RectifyImpl.mapSomeT(
                rec,
                this.featMinMax,
                RectifyImpl.Id,
                BaseSubParts.rectifyMinMaxValueCoord
            );
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
            this.defaultMinMax = BaseSubParts.rectifyMinMaxValueGlyph(rec, this.defaultMinMax);
            this.featMinMax = RectifyImpl.mapSomeT(
                rec,
                this.featMinMax,
                RectifyImpl.Id,
                BaseSubParts.rectifyMinMaxValueGlyph
            );
        }
        public rectifyPointAttachment(
            rec: Rectify.PointAttach.RectifierT<G, X>,
            horizontal: boolean
        ) {
            this.defaultMinMax = BaseSubParts.rectifyMinMaxValuePointAttach(
                rec,
                this.defaultMinMax,
                horizontal
            );
            this.featMinMax = RectifyImpl.mapSomeT(
                rec,
                this.featMinMax,
                RectifyImpl.Id,
                (rec, lc) => BaseSubParts.rectifyMinMaxValuePointAttach(rec, lc, horizontal)
            );
        }
    }

    // Min-max value pair
    export type MinMaxValueT<G, X> = BaseSubParts.MinMaxValueT<G, X>;

    // Base coord
    export type CoordT<G, X> = BaseSubParts.CoordT<G, X>;
}
