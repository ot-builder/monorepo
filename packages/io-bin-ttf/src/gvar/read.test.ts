import { BinaryView } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Data } from "@ot-builder/prelude";
import { TestFont } from "@ot-builder/test-util";
import { OtVar, OV } from "@ot-builder/variance";

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
    const thin = new OtVar.Master([{ axis: fvar!.axes[0], min: -1, peak: -1, max: 0 }]);
    const bold = new OtVar.Master([{ axis: fvar!.axes[0], min: 0, peak: +1, max: +1 }]);
    const cr = OV.Creator();
    rectifyGlyphOrder(gOrd);
    {
        const notDef = gOrd.at(0);
        expect(notDef.geometries.length).toBe(1);
        const outlines = notDef.geometries[0] as OtGlyph.ContourSet;
        expect(OV.equal(outlines.contours[0][0].x, 80)).toBe(true);
        expect(OV.equal(outlines.contours[0][1].x, cr.make(500, [thin, 35], [bold, -40]))).toBe(
            true
        );
    }
    {
        const a = gOrd.at(2);
        // Note: we don't read HMTX yet so the default advance **should be** 0
        expect(OV.equal(a.horizontal.end, cr.make(0, [thin, -10], [bold, +17]))).toBe(true);
    }
    {
        const g300 = gOrd.at(300);
        expect(g300.geometries.length).toBe(2);
        expect(g300.geometries[0]).toBeInstanceOf(OtGlyph.TtReference);
        expect(g300.geometries[1]).toBeInstanceOf(OtGlyph.TtReference);

        const base = g300.geometries[0] as OtGlyph.TtReference;
        const diacritic = g300.geometries[1] as OtGlyph.TtReference;
        expect(base.to).toBe(gOrd.at(302));
        expect(diacritic.to).toBe(gOrd.at(806));
        expect(OV.equal(diacritic.transform.dx, cr.make(148, [thin, +3], [bold, +14]))).toBe(true);
        expect(OV.equal(diacritic.transform.dy, 0)).toBe(true);
    }
});
