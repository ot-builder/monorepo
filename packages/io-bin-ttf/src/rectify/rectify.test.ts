import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";

import { rectifyGlyphOrder } from "./rectify";

describe("GLYF data rectification", () => {
    test("Rectify point attachments", () => {
        const to = OtGlyph.create();
        to.geometry = OtGlyph.ContourSet.create([
            [OtGlyph.Point.create(1, 1, OtGlyph.PointType.Corner)]
        ]);
        const from = OtGlyph.create();
        const ref1 = OtGlyph.TtReference.create(to, OtGlyph.Transform2X3.Neutral());
        const ref2 = OtGlyph.TtReference.create(to, OtGlyph.Transform2X3.Scale(2));
        ref2.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 0 } };
        from.geometry = OtGlyph.GeometryList.create([ref1, ref2]);

        const gOrd = ImpLib.Order.fromList(`Glyphs`, [from, to]);
        rectifyGlyphOrder(gOrd);

        // Geometry is changed after rectification
        const ref2a = (from.geometry as OtGlyph.GeometryList).items[1] as OtGlyph.TtReference;
        expect(ref2a.transform.dx).toBe(-1);
        expect(ref2a.transform.dy).toBe(-1);
    });

    test("Rectify point attachments, nested", () => {
        const sp = OtGlyph.create();
        sp.geometry = OtGlyph.ContourSet.create([
            [OtGlyph.Point.create(1, 1, OtGlyph.PointType.Corner)]
        ]);
        const spr = OtGlyph.create();
        spr.geometry = OtGlyph.GeometryList.create([
            OtGlyph.TtReference.create(sp, {
                scaledOffset: true,
                xx: 2,
                xy: 0,
                yx: 0,
                yy: 2,
                dx: 2,
                dy: 2
            })
        ]);

        const from = OtGlyph.create();
        const ref1 = OtGlyph.TtReference.create(spr, OtGlyph.Transform2X3.Scale(2));
        const ref2 = OtGlyph.TtReference.create(spr, OtGlyph.Transform2X3.Scale(1));
        ref2.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 0 } };
        from.geometry = OtGlyph.GeometryList.create([ref1, ref2]);

        const gOrd = ImpLib.Order.fromList(`Glyphs`, [from, sp]);
        rectifyGlyphOrder(gOrd);

        // Geometry is changed after rectification
        const ref2a = (from.geometry as OtGlyph.GeometryList).items[1] as OtGlyph.TtReference;
        expect(ref2a.transform.dx).toBe(6);
        expect(ref2a.transform.dy).toBe(6);
    });

    test("Rectify point attachments, cascade", () => {
        const to = OtGlyph.create();
        to.geometry = OtGlyph.ContourSet.create([
            [OtGlyph.Point.create(0, 0), OtGlyph.Point.create(0, 1)]
        ]);
        const from = OtGlyph.create();
        const ref1 = OtGlyph.TtReference.create(to, OtGlyph.Transform2X3.Neutral());
        const ref2 = OtGlyph.TtReference.create(to, OtGlyph.Transform2X3.Neutral());
        ref2.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 1 } };
        const ref3 = OtGlyph.TtReference.create(to, OtGlyph.Transform2X3.Neutral());
        ref3.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 3 } };
        from.geometry = OtGlyph.GeometryList.create([ref1, ref2, ref3]);

        const gOrd = ImpLib.Order.fromList(`Glyphs`, [from, to]);
        rectifyGlyphOrder(gOrd);

        // Geometry is changed after rectification
        const ref2a = (from.geometry as OtGlyph.GeometryList).items[1] as OtGlyph.TtReference;
        const ref3a = (from.geometry as OtGlyph.GeometryList).items[2] as OtGlyph.TtReference;
        expect(ref2a.transform.dx).toBe(0), expect(ref2a.transform.dy).toBe(1);
        expect(ref3a.transform.dx).toBe(0), expect(ref3a.transform.dy).toBe(2);
    });
});
