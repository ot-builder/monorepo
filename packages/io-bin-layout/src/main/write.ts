import { Frag } from "@ot-builder/bin-util";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Base, Gdef, Gpos, Gsub, Math as OtMath, OtFontLayoutData } from "@ot-builder/ot-layout";
import { OtFontMetadata } from "@ot-builder/ot-metadata";
import { Data } from "@ot-builder/prelude";
import { WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { BaseTableIo } from "../base";
import { LayoutCfg } from "../cfg";
import { GdefTableIo } from "../gdef";
import { GposTableIo } from "../gpos";
import { GsubTableIo } from "../gsub";
import { TableWriteContext } from "../gsub-gpos-shared/table";
import { MathTableIo } from "../math";
import { EmptyStat, Os2MaxContextStat } from "../stat";

export function writeOtl(
    // out
    outSink: SfntIoTableSink,
    // inOut
    // in
    otl: OtFontLayoutData,
    cfg: LayoutCfg,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
) {
    let { gsub, gpos, gdef } = otl;
    const designSpace = md.fvar ? md.fvar.getDesignSpace() : null;
    const ivs = md.fvar ? WriteTimeIVS.create(new OtVar.MasterSet()) : null;
    const stat = md.os2 ? new Os2MaxContextStat(md.os2) : new EmptyStat();

    if (gsub || gpos) {
        if (ivs && !gdef) gdef = new Gdef.Table();
        const twc: TableWriteContext = { gOrd, gdef, designSpace, ivs, stat };
        if (gsub) outSink.add(Gsub.Tag, Frag.packFrom(GsubTableIo, gsub, cfg, twc));
        if (gpos) outSink.add(Gpos.Tag, Frag.packFrom(GposTableIo, gpos, cfg, twc));
    }
    if (gdef) outSink.add(Gdef.Tag, Frag.packFrom(GdefTableIo, gdef, cfg, gOrd, ivs, designSpace));
    stat.settle();

    if (otl.base) outSink.add(Base.Tag, Frag.packFrom(BaseTableIo, otl.base, gOrd, designSpace));
    if (otl.math) outSink.add(OtMath.Tag, Frag.packFrom(MathTableIo, otl.math, gOrd));
}
