import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { F2D14, NonNullablePtr32, SimpleArray, UInt16, UInt32 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import { FeatureTable } from "./feature-list";

type Feature = GsubGpos.Feature;
type Lookup = GsubGpos.Lookup;
type Condition = GsubGpos.FeatureVariationCondition;
type FeatureVariation = GsubGpos.FeatureVariation;

const FeatureTableSubstitution = {
    read(view: BinaryView, fOrd: Data.Order<Feature>, lOrd: Data.Order<Lookup>) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("FeatureTableSubstitution", majorVersion, minorVersion, [1, 0]);
        const subst = new Map<Feature, Feature>();
        const count = view.uint16();
        for (let iFs = 0; iFs < count; iFs++) {
            const feature = fOrd.at(view.uint16());
            const altFeature = view.ptr32().next(FeatureTable, lOrd, feature.tag);
            subst.set(feature, altFeature);
        }
        return subst;
    },
    write(
        frag: Frag,
        subst: ReadonlyMap<Feature, Feature>,
        fOrd: Data.Order<Feature>,
        lOrd: Data.Order<Lookup>
    ) {
        frag.uint16(1)
            .uint16(0)
            .uint16(subst.size);
        for (const [from, to] of subst) {
            frag.uint16(fOrd.reverse(from));
            frag.ptr32New().push(FeatureTable, to, lOrd);
        }
    }
};

const ConditionTable = {
    read(view: BinaryView, axes: Data.Order<OtVar.Axis>): Condition {
        const format = view.uint16();
        Assert.FormatSupported(`ConditionTable`, format, 1);
        const axis = axes.at(view.uint16());
        const min = view.next(F2D14);
        const max = view.next(F2D14);
        return { axis, min, max };
    },
    write(frag: Frag, condition: Condition, axes: Data.Order<OtVar.Axis>) {
        frag.uint16(1)
            .uint16(axes.reverse(condition.axis))
            .push(F2D14, condition.min)
            .push(F2D14, condition.max);
    }
};
const Ptr32Condition = NonNullablePtr32(ConditionTable);
const ConditionSet = SimpleArray(UInt16, Ptr32Condition);

const FeatureVariationRecord = {
    read(
        view: BinaryView,
        axes: Data.Order<OtVar.Axis>,
        fOrd: Data.Order<Feature>,
        lOrd: Data.Order<Lookup>
    ): FeatureVariation {
        const conditions = view.ptr32().next(ConditionSet, axes);
        const substitutions = view.ptr32().next(FeatureTableSubstitution, fOrd, lOrd);
        return { conditions, substitutions };
    },
    write(
        frag: Frag,
        fv: FeatureVariation,
        axes: Data.Order<OtVar.Axis>,
        fOrd: Data.Order<Feature>,
        lOrd: Data.Order<Lookup>
    ) {
        frag.ptr32New().push(ConditionSet, fv.conditions, axes);
        frag.ptr32New().push(FeatureTableSubstitution, fv.substitutions, fOrd, lOrd);
    }
};
const FeatureVariationRecordList = SimpleArray(UInt32, FeatureVariationRecord);

export const FeatureVariations = {
    read(
        view: BinaryView,
        axes: Data.Order<OtVar.Axis>,
        fOrd: Data.Order<Feature>,
        lOrd: Data.Order<Lookup>
    ) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("FeatureTableSubstitution", majorVersion, minorVersion, [1, 0]);
        return view.next(FeatureVariationRecordList, axes, fOrd, lOrd);
    },
    write(
        frag: Frag,
        fv: readonly FeatureVariation[],
        axes: Data.Order<OtVar.Axis>,
        fOrd: Data.Order<Feature>,
        lOrd: Data.Order<Lookup>
    ) {
        frag.uint16(1).uint16(0);
        frag.push(FeatureVariationRecordList, fv, axes, fOrd, lOrd);
    }
};
