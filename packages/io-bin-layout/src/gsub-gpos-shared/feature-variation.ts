import { NonNullablePtr32, SimpleArray } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { F2D14, UInt16, UInt32 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import { CFeatureTable } from "./feature-list";

type Feature<L> = GsubGpos.FeatureT<L>;
type Condition = GsubGpos.FeatureVariationCondition;
type FeatureVariation<L> = GsubGpos.FeatureVariationT<L>;

class CFeatureTableSubstitution<L> {
    public read(view: BinaryView, fOrd: Data.Order<Feature<L>>, lOrd: Data.Order<L>) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("FeatureTableSubstitution", majorVersion, minorVersion, [1, 0]);
        const subst = new Map<Feature<L>, Feature<L>>();
        const count = view.uint16();
        for (let iFs = 0; iFs < count; iFs++) {
            const feature = fOrd.at(view.uint16());
            const altFeature = view.ptr32().next(new CFeatureTable<L>(), lOrd, feature.tag);
            subst.set(feature, altFeature);
        }
        return subst;
    }
    public write(
        frag: Frag,
        subst: ReadonlyMap<Feature<L>, Feature<L>>,
        fOrd: Data.Order<Feature<L>>,
        lOrd: Data.Order<L>
    ) {
        frag.uint16(1).uint16(0).uint16(subst.size);
        for (const [from, to] of subst) {
            frag.uint16(fOrd.reverse(from));
            frag.ptr32New().push(new CFeatureTable<L>(), to, lOrd);
        }
    }
}

const ConditionTable = {
    read(view: BinaryView, designSpace: OtVar.DesignSpace): Condition {
        const format = view.uint16();
        Assert.FormatSupported(`ConditionTable`, format, 1);
        const dim = designSpace.at(view.uint16());
        const min = view.next(F2D14);
        const max = view.next(F2D14);
        return { dim, min, max };
    },
    write(frag: Frag, condition: Condition, designSpace: OtVar.DesignSpace) {
        frag.uint16(1)
            .uint16(designSpace.reverse(condition.dim))
            .push(F2D14, condition.min)
            .push(F2D14, condition.max);
    }
};
const Ptr32Condition = NonNullablePtr32(ConditionTable);
const ConditionSet = SimpleArray(UInt16, Ptr32Condition);

class CFeatureVariationRecord<L> {
    public read(
        view: BinaryView,
        designSpace: OtVar.DesignSpace,
        fOrd: Data.Order<Feature<L>>,
        lOrd: Data.Order<L>
    ): FeatureVariation<L> {
        const conditions = view.ptr32().next(ConditionSet, designSpace);
        const substitutions = view.ptr32().next(new CFeatureTableSubstitution<L>(), fOrd, lOrd);
        return { conditions, substitutions };
    }
    public write(
        frag: Frag,
        fv: FeatureVariation<L>,
        designSpace: OtVar.DesignSpace,
        fOrd: Data.Order<Feature<L>>,
        lOrd: Data.Order<L>
    ) {
        frag.ptr32New().push(ConditionSet, fv.conditions, designSpace);
        frag.ptr32New().push(new CFeatureTableSubstitution<L>(), fv.substitutions, fOrd, lOrd);
    }
}
function CFeatureVariationRecordList<L>() {
    return SimpleArray(UInt32, new CFeatureVariationRecord<L>());
}

export class CFeatureVariations<L> {
    public read(
        view: BinaryView,
        designSpace: OtVar.DesignSpace,
        fOrd: Data.Order<Feature<L>>,
        lOrd: Data.Order<L>
    ) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("FeatureTableSubstitution", majorVersion, minorVersion, [1, 0]);
        return view.next(CFeatureVariationRecordList<L>(), designSpace, fOrd, lOrd);
    }
    public write(
        frag: Frag,
        fv: readonly FeatureVariation<L>[],
        designSpace: OtVar.DesignSpace,
        fOrd: Data.Order<Feature<L>>,
        lOrd: Data.Order<L>
    ) {
        frag.uint16(1).uint16(0);
        frag.push(CFeatureVariationRecordList<L>(), fv, designSpace, fOrd, lOrd);
    }
}
