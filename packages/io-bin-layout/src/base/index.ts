import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph, OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { Base } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { NonNullablePtr16, NullablePtr16, SimpleArray, Tag, UInt16 } from "@ot-builder/primitive";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";
import { OtVarMasterSet } from "@ot-builder/variance/lib/otvar-impl";

import { BaseCoord, Ptr16BaseCoord, Ptr16BaseCoordNullable } from "./coord";

export const BaseTableIo = {
    read(view: BinaryView, gOrd: OtGlyphOrder, axes?: Data.Maybe<Data.Order<OtVar.Axis>>) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("BASETable", majorVersion, minorVersion, [1, 0], [1, 1]);
        const pHorizontalAxis = view.ptr16Nullable();
        const pVerticalAxis = view.ptr16Nullable();
        let ivs: null | ReadTimeIVS = null;
        if (minorVersion === 1) {
            const pIVS = view.ptr32Nullable();
            if (pIVS && axes) ivs = ReadTimeIVS.read(pIVS, axes);
        }

        const base = new Base.Table();
        if (pHorizontalAxis) base.horizontal = pHorizontalAxis.next(AxisTable, gOrd, ivs);
        if (pVerticalAxis) base.vertical = pVerticalAxis.next(AxisTable, gOrd, ivs);
        return base;
    },
    write(
        frag: Frag,
        table: Base.Table,
        gOrd: OtGlyphOrder,
        axes?: Data.Maybe<Data.Order<OtVar.Axis>>
    ) {
        const ivs: null | WriteTimeIVS = axes ? WriteTimeIVS.create(new OtVarMasterSet()) : null;
        frag.uint16(1);
        const hMinorVersion = frag.reserve(UInt16);
        frag.push(Ptr16AxisTableNullable, table.horizontal, gOrd, ivs);
        frag.push(Ptr16AxisTableNullable, table.vertical, gOrd, ivs);
        if (axes && ivs && !ivs.isEmpty()) {
            hMinorVersion.fill(1);
            frag.ptr32New().push(WriteTimeIVS, ivs, axes);
        } else {
            hMinorVersion.fill(0);
        }
    }
};

const AxisTable = {
    read(view: BinaryView, gOrd: OtGlyphOrder, ivs: Data.Maybe<ReadTimeIVS>) {
        const ax = new Base.AxisTable();
        ax.baselineTags = view.next(Ptr16BaseTagListNullable);
        ax.scripts = new Map(view.next(Ptr16BaseScriptList, ax.baselineTags, gOrd, ivs));
        return ax;
    },
    write(frag: Frag, ax: Base.AxisTable, gOrd: OtGlyphOrder, ivs: Data.Maybe<WriteTimeIVS>) {
        const sortedTags = ax.baselineTags ? [...ax.baselineTags].sort() : null;
        frag.push(Ptr16BaseTagListNullable, sortedTags);
        const baseScriptList = [...ax.scripts].sort(byTagOrder);
        frag.push(Ptr16BaseScriptList, baseScriptList, sortedTags, gOrd, ivs);
    }
};
const Ptr16AxisTableNullable = NullablePtr16(AxisTable);

const BaseTagList = {
    read(view: BinaryView) {
        const baseTagCount = view.uint16();
        let tags: Tag[] = [];
        for (let tid = 0; tid < baseTagCount; tid++) tags[tid] = view.next(Tag);
        return tags;
    },
    write(frag: Frag, tags: ReadonlyArray<Tag>) {
        Assert.NoGap("BaseTagList", tags);
        frag.uint16(tags.length);
        for (let tid = 0; tid < tags.length; tid++) frag.push(Tag, tags[tid]);
    }
};
const Ptr16BaseTagListNullable = NullablePtr16(BaseTagList);

const BaseScriptRecord = {
    read(
        view: BinaryView,
        baseTags: Data.Maybe<ReadonlyArray<Tag>>,
        gOrd: OtGlyphOrder,
        ivs: Data.Maybe<ReadTimeIVS>
    ): [Tag, Base.Script] {
        const tag = view.next(Tag);
        const baseScript = view.next(Ptr16BaseScript, baseTags, gOrd, ivs);
        return [tag, baseScript];
    },
    write(
        frag: Frag,
        [tag, bs]: [Tag, Base.Script],
        sortedBaseTags: Data.Maybe<ReadonlyArray<Tag>>,
        gOrd: OtGlyphOrder,
        ivs: Data.Maybe<WriteTimeIVS>
    ) {
        frag.push(Tag, tag);
        frag.push(Ptr16BaseScript, bs, sortedBaseTags, gOrd, ivs);
    }
};
const Ptr16BaseScriptList = NonNullablePtr16(SimpleArray(UInt16, BaseScriptRecord));

const BaseScript = {
    read(
        view: BinaryView,
        baseTags: Data.Maybe<ReadonlyArray<Tag>>,
        gOrd: OtGlyphOrder,
        ivs: Data.Maybe<ReadTimeIVS>
    ) {
        const script = new Base.Script();
        script.baseValues = view.next(Ptr16BaseValuesNullable, baseTags, gOrd, ivs);
        script.defaultMinMax = view.next(Ptr16MinMaxTableNullable, gOrd, ivs);

        const baseLangSysCount = view.uint16();
        for (let lid = 0; lid < baseLangSysCount; lid++) {
            const tag = view.next(Tag);
            const mmt = view.next(Ptr16MinMaxTable, gOrd, ivs);
            if (!script.baseLangSysRecords) script.baseLangSysRecords = new Map();
            script.baseLangSysRecords.set(tag, mmt);
        }
        return script;
    },
    write(
        frag: Frag,
        script: Base.Script,
        sortedBaseTags: Data.Maybe<ReadonlyArray<Tag>>,
        gOrd: OtGlyphOrder,
        ivs: Data.Maybe<WriteTimeIVS>
    ) {
        frag.push(Ptr16BaseValuesNullable, script.baseValues, sortedBaseTags, gOrd, ivs);
        frag.push(Ptr16MinMaxTableNullable, script.defaultMinMax, gOrd, ivs);
        if (script.baseLangSysRecords && script.baseLangSysRecords.size) {
            const baseLangSysList = [...script.baseLangSysRecords].sort(byTagOrder);
            frag.uint16(baseLangSysList.length);
            for (const [tag, mmt] of baseLangSysList) {
                frag.push(Tag, tag);
                frag.push(Ptr16MinMaxTable, mmt, gOrd, ivs);
            }
        } else {
            frag.uint16(0);
        }
    }
};
const Ptr16BaseScript = NonNullablePtr16(BaseScript);

const BaseValues = {
    read(
        view: BinaryView,
        baseTags: Data.Maybe<ReadonlyArray<Tag>>,
        gOrd: OtGlyphOrder,
        ivs: Data.Maybe<ReadTimeIVS>
    ) {
        if (!baseTags) throw Errors.NullPtr(`AxisTable::baseTagListOffset`);
        const bv = new Base.BaseValues();
        bv.defaultBaselineIndex = view.uint16();
        const baseCoordCount = view.uint16();
        Assert.SizeMatch(`BaseValues::baseCoordCount`, baseCoordCount, baseTags.length);
        for (let cid = 0; cid < baseCoordCount; cid++) {
            bv.baseValues.set(baseTags[cid], view.ptr16().next(BaseCoord, gOrd, ivs));
        }
        return bv;
    },
    write(
        frag: Frag,
        bv: Base.BaseValues,
        sortedBaseTags: Data.Maybe<ReadonlyArray<Tag>>,
        gOrd: OtGlyphOrder,
        ivs: Data.Maybe<WriteTimeIVS>
    ) {
        if (!sortedBaseTags) throw Errors.NullPtr(`AxisTable::baseTagListOffset`);
        frag.uint16(bv.defaultBaselineIndex);
        frag.uint16(sortedBaseTags.length);
        for (const tag of sortedBaseTags) {
            const coord = bv.baseValues.get(tag);
            if (!coord) throw Errors.NullPtr(`BaseValues::baseCoords @ ${tag}`);
            frag.push(Ptr16BaseCoord, coord, gOrd, ivs);
        }
    }
};
const Ptr16BaseValuesNullable = NullablePtr16(BaseValues);

const MinMaxTable = {
    read(view: BinaryView, gOrd: OtGlyphOrder, ivs: Data.Maybe<ReadTimeIVS>) {
        const defaultMinMax = view.next(MinMaxValue, gOrd, ivs);
        const featMinMaxCount = view.uint16();
        const featMinMax = new Map<Tag, Base.MinMaxValue>();
        for (let fid = 0; fid < featMinMaxCount; fid++) {
            const featureTableTag = view.next(Tag);
            const mm = view.next(MinMaxValue, gOrd, ivs);
            featMinMax.set(featureTableTag, mm);
        }
        return new Base.MinMaxTable(defaultMinMax, featMinMax);
    },
    write(frag: Frag, mmt: Base.MinMaxTable, gOrd: OtGlyphOrder, ivs: Data.Maybe<WriteTimeIVS>) {
        frag.push(MinMaxValue, mmt.defaultMinMax, gOrd, ivs);
        if (mmt.featMinMax && mmt.featMinMax.size) {
            const fmmList = [...mmt.featMinMax].sort(byTagOrder);
            frag.uint16(fmmList.length);
            for (const [tag, mm] of fmmList) {
                frag.push(Tag, tag);
                frag.push(MinMaxValue, mm, gOrd, ivs);
            }
        } else {
            frag.uint16(0);
        }
    }
};
const Ptr16MinMaxTable = NonNullablePtr16(MinMaxTable);
const Ptr16MinMaxTableNullable = NullablePtr16(MinMaxTable);

const MinMaxValue = {
    read(view: BinaryView, gOrd: OtGlyphOrder, ivs: Data.Maybe<ReadTimeIVS>): Base.MinMaxValue {
        return {
            minCoord: view.next(Ptr16BaseCoordNullable, gOrd, ivs),
            maxCoord: view.next(Ptr16BaseCoordNullable, gOrd, ivs)
        };
    },
    write(frag: Frag, mm: Base.MinMaxValue, gOrd: OtGlyphOrder, ivs: Data.Maybe<WriteTimeIVS>) {
        frag.push(Ptr16BaseCoordNullable, mm.minCoord, gOrd, ivs);
        frag.push(Ptr16BaseCoordNullable, mm.maxCoord, gOrd, ivs);
    }
};

function byTagOrder<T>(a: [Tag, T], b: [Tag, T]) {
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
}
