import { Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Base, Gdef, Gpos, Gsub, OtFontLayoutData } from "@ot-builder/ft-layout";
import { OtFontMetadata } from "@ot-builder/ft-metadata";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { Data } from "@ot-builder/prelude";
import { WriteTimeIVS } from "@ot-builder/var-store";
import { OtVarMasterSet } from "@ot-builder/variance/lib/otvar-impl";

import { BaseTableIo } from "../base";
import { GdefTableIo } from "../gdef";
import { GposTableIo } from "../gpos";
import { GsubTableIo } from "../gsub";
import { TableWriteContext } from "../gsub-gpos-shared/table";
import { EmptyStat, Os2Stat } from "../stat";

export function writeOtl(
    // out
    outSink: SfntIoTableSink,
    // inOut
    // in
    otl: OtFontLayoutData,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
) {
    let { gsub, gpos, gdef } = otl;
    const axes = md.fvar ? Data.Order.fromList("Axes", md.fvar.axes) : null;
    const ivs = md.fvar ? WriteTimeIVS.create(new OtVarMasterSet()) : null;
    if (ivs && !gdef) gdef = new Gdef.Table();
    const stat = md.os2 ? new Os2Stat(md.os2) : new EmptyStat();

    const twc: TableWriteContext = { gOrd, gdef, axes, ivs, stat };
    if (gsub) outSink.add(Gsub.Tag, Frag.packFrom(GsubTableIo, gsub, twc));
    if (gpos) outSink.add(Gpos.Tag, Frag.packFrom(GposTableIo, gpos, twc));
    if (gdef) outSink.add(Gdef.Tag, Frag.packFrom(GdefTableIo, gdef, gOrd, ivs, axes));
    stat.settle();

    if (otl.base) outSink.add(Base.Tag, Frag.packFrom(BaseTableIo, otl.base, gOrd, axes));
}
