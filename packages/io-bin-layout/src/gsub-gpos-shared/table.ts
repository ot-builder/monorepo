import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef, GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { OtlStat } from "../stat";

import { FeatureList } from "./feature-list";
import { FeatureVariations } from "./feature-variation";
import { LookupReaderFactory, LookupWriterFactory } from "./general";
import { LookupReadContext, ReadLookupList } from "./read-lookup-list";
import { ScriptList } from "./script-lang";
import { setLookupTricks } from "./trick";
import { LookupWriteContext, WriteLookupList } from "./write-lookup-list";

///////////////////////////////////////////////////////////////////////////////////////////////////

export interface TableReadContext {
    gOrd: Data.Order<OtGlyph>;
    gdef?: Data.Maybe<Gdef.Table>;
    axes?: Data.Maybe<Data.Order<OtVar.Axis>>;
    ivs?: Data.Maybe<ReadTimeIVS>;
}
export interface TableWriteContext {
    gOrd: Data.Order<OtGlyph>;
    axes?: Data.Maybe<Data.Order<OtVar.Axis>>;
    gdef?: Data.Maybe<Gdef.Table>;
    ivs?: Data.Maybe<WriteTimeIVS>;
    stat?: Data.Maybe<OtlStat>;
}

export const GsubGposTable = {
    read(view: BinaryView, lrf: LookupReaderFactory<GsubGpos.Lookup>, trc: TableReadContext) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("Table", majorVersion, minorVersion, [1, 0], [1, 1]);

        const vScriptList = view.ptr16();
        const vFeatureList = view.ptr16();
        const vLookupList = view.ptr16();
        const vFeatureVariation = minorVersion > 0 ? view.ptr32Nullable() : null;

        const lrc: LookupReadContext = { ...trc };
        const lookups = vLookupList.next(ReadLookupList, lrf, lrc);
        const lOrd = Data.Order.fromList(`Lookups`, lookups);
        const features = vFeatureList.next(FeatureList, lOrd);
        const fOrd = Data.Order.fromList(`Features`, features);
        const scripts = vScriptList.next(ScriptList, fOrd);

        const featureVariations =
            vFeatureVariation && trc.axes && trc.axes.length
                ? vFeatureVariation.next(FeatureVariations, trc.axes, fOrd, lOrd)
                : null;

        return new GsubGpos.Table(scripts, features, lookups, featureVariations);
    },
    write(
        frag: Frag,
        table: GsubGpos.Table,
        lwf: LookupWriterFactory<GsubGpos.Lookup>,
        twc: TableWriteContext
    ) {
        const lwc: LookupWriteContext = { ...twc, tricks: setLookupTricks(table) };
        const fLookups = Frag.solidFrom(WriteLookupList, table.lookups, lwf, lwc);
        const lOrd = Data.Order.fromList(`Lookups`, table.lookups);
        const fFeatures = Frag.solidFrom(FeatureList, table.features, lOrd);
        const fOrd = Data.Order.fromList(`Features`, table.features);
        const fScripts = Frag.solidFrom(ScriptList, table.scripts, fOrd);
        const fFeatureVariations =
            !table.FeatureVariations || !twc.axes || !twc.axes.length
                ? null
                : Frag.solidFrom(FeatureVariations, table.FeatureVariations, twc.axes, fOrd, lOrd);

        // Write it!
        const minorVersion = fFeatureVariations ? 1 : 0;
        frag.uint16(1).uint16(minorVersion);
        frag.ptr16(fScripts);
        frag.ptr16(fFeatures);
        frag.ptr16(fLookups);
        if (minorVersion) frag.ptr32(fFeatureVariations);
    }
};
