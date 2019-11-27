import { BinaryView } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Base, Gdef, Gpos, Gsub, OtFontLayoutData } from "@ot-builder/ft-layout";
import { OtFontMetadata } from "@ot-builder/ft-metadata";
import { Sfnt } from "@ot-builder/ft-sfnt";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS } from "@ot-builder/var-store";

import { BaseTableIo } from "../base";
import { GdefTableIo } from "../gdef";
import { GposTableIo } from "../gpos";
import { GsubTableIo } from "../gsub";
import { TableReadContext } from "../gsub-gpos-shared/table";

export function readOtl(
    sfnt: Sfnt,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
): OtFontLayoutData {
    let gdef: Data.Maybe<Gdef.Table> = null;
    let ivs: Data.Maybe<ReadTimeIVS> = null;
    const bGdef = sfnt.tables.get(Gdef.Tag);
    const bGsub = sfnt.tables.get(Gsub.Tag);
    const bGpos = sfnt.tables.get(Gpos.Tag);
    const axes = md.fvar ? ImpLib.Order.fromList("Axes", md.fvar.axes) : null;
    if (bGdef) {
        const res = new BinaryView(bGdef).next(GdefTableIo, gOrd, axes);
        gdef = res.gdef;
        ivs = res.ivs;
    }

    let gsub: Data.Maybe<Gsub.Table> = null;
    let gpos: Data.Maybe<Gpos.Table> = null;
    const trc: TableReadContext = { gOrd, gdef, axes, ivs };
    if (bGsub) gsub = new BinaryView(bGsub).next(GsubTableIo, trc);
    if (bGpos) gpos = new BinaryView(bGpos).next(GposTableIo, trc);

    const bBase = sfnt.tables.get(Base.Tag);
    const base = bBase ? new BinaryView(bBase).next(BaseTableIo, gOrd, axes) : null;

    return { gdef, gsub, gpos, base };
}
