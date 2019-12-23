import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef, GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { OtlStat } from "../stat";

import { CFeatureList } from "./feature-list";
import { CFeatureVariations } from "./feature-variation";
import { LookupReaderFactory, LookupWriterFactory } from "./general";
import { CReadLookupList, LookupReadContext } from "./read-lookup-list";
import { CScriptList } from "./script-lang";
import { setLookupTricks } from "./trick";
import { LookupWriteContext, WriteLookupList } from "./write-lookup-list";

///////////////////////////////////////////////////////////////////////////////////////////////////

export interface TableReadContext {
    gOrd: Data.Order<OtGlyph>;
    gdef?: Data.Maybe<Gdef.Table>;
    designSpace?: Data.Maybe<OtVar.DesignSpace>;
    ivs?: Data.Maybe<ReadTimeIVS>;
}
export interface TableWriteContext {
    gOrd: Data.Order<OtGlyph>;
    designSpace?: Data.Maybe<OtVar.DesignSpace>;
    gdef?: Data.Maybe<Gdef.Table>;
    ivs?: Data.Maybe<WriteTimeIVS>;
    stat?: Data.Maybe<OtlStat>;
}

export class CGsubGposTable<L extends GsubGpos.LookupProp> {
    public read(view: BinaryView, lrf: LookupReaderFactory<L>, trc: TableReadContext) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("Table", majorVersion, minorVersion, [1, 0], [1, 1]);

        const vScriptList = view.ptr16();
        const vFeatureList = view.ptr16();
        const vLookupList = view.ptr16();
        const vFeatureVariation = minorVersion > 0 ? view.ptr32Nullable() : null;

        const lrc: LookupReadContext = { ...trc };
        const lookups = vLookupList.next(new CReadLookupList<L>(), lrf, lrc);
        const lOrd = ImpLib.Order.fromList(`Lookups`, lookups);
        const features = vFeatureList.next(new CFeatureList<L>(), lOrd);
        const fOrd = ImpLib.Order.fromList(`Features`, features);
        const scripts = vScriptList.next(new CScriptList<L>(), fOrd);

        const featureVariations =
            vFeatureVariation && trc.designSpace && trc.designSpace.length
                ? vFeatureVariation.next(new CFeatureVariations<L>(), trc.designSpace, fOrd, lOrd)
                : null;

        return { scripts, features, lookups, featureVariations };
    }
    public write(
        frag: Frag,
        table: GsubGpos.TableT<L>,
        lwf: LookupWriterFactory<L>,
        twc: TableWriteContext
    ) {
        const lwc: LookupWriteContext<L> = { ...twc, tricks: setLookupTricks(table) };
        const fLookups = Frag.solidFrom(WriteLookupList, table.lookups, lwf, lwc);
        const lOrd = ImpLib.Order.fromList(`Lookups`, table.lookups);
        const fFeatures = Frag.solidFrom(new CFeatureList<L>(), table.features, lOrd);
        const fOrd = ImpLib.Order.fromList(`Features`, table.features);
        const fScripts = Frag.solidFrom(new CScriptList<L>(), table.scripts, fOrd);
        const fFeatureVariations =
            !table.featureVariations || !twc.designSpace || !twc.designSpace.length
                ? null
                : Frag.solidFrom(
                      new CFeatureVariations<L>(),
                      table.featureVariations,
                      twc.designSpace,
                      fOrd,
                      lOrd
                  );

        // Write it!
        const minorVersion = fFeatureVariations ? 1 : 0;
        frag.uint16(1).uint16(minorVersion);
        frag.ptr16(fScripts);
        frag.ptr16(fFeatures);
        frag.ptr16(fLookups);
        if (minorVersion) frag.ptr32(fFeatureVariations);
    }
}
