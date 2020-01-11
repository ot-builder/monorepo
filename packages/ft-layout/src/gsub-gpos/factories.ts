import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import * as GeneralGsubGpos from "./general/shared";
import { TableImpl } from "./shared-impl";

export function CreateTable<L>() {
    return {
        create: function createTable(
            scripts: Map<Tag, GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value, L>> = new Map(),
            features: Array<GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value, L>> = [],
            lookups: Array<L> = [],
            featureVariations: Data.Maybe<
                Array<GeneralGsubGpos.FeatureVariationT<OtVar.Dim, OtGlyph, OtVar.Value, L>>
            > = undefined
        ): GeneralGsubGpos.TableT<OtVar.Dim, OtGlyph, OtVar.Value, L> {
            return new TableImpl(scripts, features, lookups, featureVariations);
        }
    };
}

export type CaseType<Tag, Props> = { type: Tag } & Props;
export function CaseCreator<Tag, Props>(tag: Tag, defaultProps: () => Props) {
    return {
        create(props?: Props): CaseType<Tag, Props> {
            return { type: tag, ...(props || defaultProps()) };
        }
    };
}
