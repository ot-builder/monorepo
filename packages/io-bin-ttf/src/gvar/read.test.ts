import { BinaryView } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Data } from "@ot-builder/prelude";
import { TestFont } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { DefaultTtfCfgProps } from "../cfg";
import { LocaTableIo, LocaTag } from "../glyf/loca";
import { GlyfTableRead } from "../glyf/read";
import { GlyfTag } from "../glyf/shared";
import { rectifyGlyphOrder } from "../rectify/rectify";

import { GvarTableRead } from "./read";
import { GvarTag } from "./shared";

test("Reading : TTF, variable", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = Config.create({ ttf: DefaultTtfCfgProps, fontMetadata: {} });
    const { head, maxp, fvar } = readOtMetadata(sfnt, cfg);
    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const gOrd = gs.decideOrder();
    const loca = new BinaryView(sfnt.tables.get(LocaTag)!).next(LocaTableIo, head, maxp);
    const glyf = new BinaryView(sfnt.tables.get(GlyfTag)!).next(
        GlyfTableRead,
        loca,
        gOrd,
        new OtGlyph.CoStat.Forward()
    );
    const gvar = new BinaryView(sfnt.tables.get(GvarTag)!).next(
        GvarTableRead,
        gOrd,
        cfg,
        {},
        Data.Order.fromList("Axes", fvar!.axes)
    );
    const thin = OtVar.Create.Master([{ axis: fvar!.axes[0], min: -1, peak: -1, max: 0 }]);
    const bold = OtVar.Create.Master([{ axis: fvar!.axes[0], min: 0, peak: +1, max: +1 }]);
    const cr = OtVar.Ops.Creator();
    rectifyGlyphOrder(gOrd);
    {
        const notDef = gOrd.at(0);
        expect(notDef.geometry).toBeTruthy();
        const outlines = notDef.geometry as OtGlyph.ContourSet;
        expect(OtVar.Ops.equal(outlines.contours[0][0].x, 80)).toBe(true);
        expect(
            OtVar.Ops.equal(outlines.contours[0][1].x, cr.make(500, [thin, 35], [bold, -40]))
        ).toBe(true);
    }
    {
        const a = gOrd.at(2);
        // Note: we don't read HMTX yet so the default advance **should be** 0
        expect(OtVar.Ops.equal(a.horizontal.end, cr.make(0, [thin, -10], [bold, +17]))).toBe(true);
    }
    {
        const g300 = gOrd.at(300);
        expect(g300.geometry).toBeTruthy();
        expect(g300.geometry).toBeInstanceOf(OtGlyph.TtReferenceList);

        const geom = g300.geometry as OtGlyph.TtReferenceList;
        expect(geom.references.length).toBe(2);
        const base = geom.references[0];
        const diacritic = geom.references[1];
        expect(base.to).toBe(gOrd.at(302));
        expect(diacritic.to).toBe(gOrd.at(806));
        expect(OtVar.Ops.equal(diacritic.transform.dx, cr.make(148, [thin, +3], [bold, +14]))).toBe(
            true
        );
        expect(OtVar.Ops.equal(diacritic.transform.dy, 0)).toBe(true);
    }
});
