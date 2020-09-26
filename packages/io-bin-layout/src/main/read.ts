import { BinaryView } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Base, Gdef, Gpos, Gsub, Math as OtMath, OtFontLayoutData } from "@ot-builder/ot-layout";
import { OtFontMetadata } from "@ot-builder/ot-metadata";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS } from "@ot-builder/var-store";

import { BaseTableIo } from "../base";
import { LayoutCfg } from "../cfg";
import { GdefTableIo } from "../gdef";
import { GposTableIo } from "../gpos";
import { GsubTableIo } from "../gsub";
import { TableReadContext } from "../gsub-gpos-shared/table";
import { MathTableIo } from "../math";

export function readOtl(
    sfnt: Sfnt,
    cfg: LayoutCfg,
    gOrd: Data.Order<OtGlyph>,
    md: OtFontMetadata
): OtFontLayoutData {
    let gdef: Data.Maybe<Gdef.Table> = null;
    let ivs: Data.Maybe<ReadTimeIVS> = null;
    const bGdef = sfnt.tables.get(Gdef.Tag);
    const bGsub = sfnt.tables.get(Gsub.Tag);
    const bGpos = sfnt.tables.get(Gpos.Tag);
    const designSpace = md.fvar ? md.fvar.getDesignSpace() : null;
    if (bGdef) {
        const res = new BinaryView(bGdef).next(GdefTableIo, gOrd, designSpace);
        gdef = res.gdef;
        ivs = res.ivs;
    }

    let gsub: Data.Maybe<Gsub.Table> = null;
    let gpos: Data.Maybe<Gpos.Table> = null;
    const trc: TableReadContext = { gOrd, gdef, designSpace, ivs };
    if (bGsub) gsub = new BinaryView(bGsub).next(GsubTableIo, cfg, trc);
    if (bGpos) gpos = new BinaryView(bGpos).next(GposTableIo, cfg, trc);

    const bBase = sfnt.tables.get(Base.Tag);
    const base = bBase ? new BinaryView(bBase).next(BaseTableIo, gOrd, designSpace) : null;

    const bMath = sfnt.tables.get(OtMath.Tag);
    const math = bMath ? new BinaryView(bMath).next(MathTableIo, gOrd) : null;

    return { gdef, gsub, gpos, base, math };
}
