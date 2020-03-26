import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert } from "@ot-builder/errors";
import { Cvt } from "@ot-builder/ot-glyphs";
import {
    TupleVariationBuildContext,
    TupleVariationBuildSource,
    TupleVariationGeometryClient,
    TupleVariationRead,
    TupleVariationWriteOpt,
    TvdAccess
} from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { CumulativeTvd } from "../shared/tvd-access";

export const CvarIo = {
    read(view: BinaryView, cvt: Cvt.Table, designSpace: OtVar.DesignSpace) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("CvarTable", majorVersion, minorVersion, [1, 0]);

        const client = new CvtTvhClient(cvt);
        view.next(TupleVariationRead, client, { designSpace, sharedTuples: [] });
    },
    write(
        frag: Frag,
        cvt: Cvt.Table,
        designSpace: OtVar.DesignSpace,
        acEmpty?: ImpLib.Access<boolean>
    ) {
        frag.uint16(1).uint16(0);
        const context: TupleVariationBuildContext = {
            designSpace: designSpace,
            forceEmbedPeak: true // This is CVAR so force embedding
        };
        const source = new CvtTupleVariationSource(cvt);
        const tvd = TupleVariationWriteOpt.writeOpt(source, context);
        if (tvd) {
            frag.embed(tvd);
        } else {
            // Oops the CVAR table is completely empty
            frag.uint16(0).uint16(0);
            // Tell the outside that we are writing something empty
            if (acEmpty) acEmpty.set(true);
        }
    }
};

class CvtTvhClient implements TupleVariationGeometryClient {
    constructor(cvt: Cvt.Table) {
        const ms = OtVar.Create.MasterSet();
        this.contours = this.createContours(ms, cvt);
    }

    public readonly dimensions = 1;
    public readonly contours: TvdAccess<OtVar.Master>[][];

    private createContours(ms: OtVar.MasterSet, cvt: Cvt.Table) {
        const cs: TvdAccess<OtVar.Master>[][] = [];
        for (let cvtId = 0; cvtId < cvt.items.length; cvtId++) {
            cs.push([new CvtTvdAccess(ms, cvt, cvtId)]);
        }
        return cs;
    }
    public finish() {
        for (const c of this.contours) for (const z of c) z.finish();
    }
}
class CvtTvdAccess extends CumulativeTvd implements TvdAccess<OtVar.Master> {
    constructor(ms: OtVar.MasterSet, readonly cvt: Cvt.Table, readonly cvtId: number) {
        super(ms);
        this.original = OtVar.Ops.originOf(cvt.items[cvtId] || 0);
    }
    public readonly original: number;
    public finish() {
        const cv = this.cvt.items[this.cvtId] || 0;
        this.cvt.items[this.cvtId] = this.collectTo(cv);
    }
}

class CvtTupleVariationSource implements TupleVariationBuildSource {
    constructor(cvt: Cvt.Table) {
        const cs: OtVar.Value[][] = [];
        for (const entry of cvt.items) cs.push([entry]);
        this.data = cs;
    }
    public readonly dimensions = 1;
    public readonly data: OtVar.Value[][];
}
