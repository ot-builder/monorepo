import * as ImpLib from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ot-glyphs";

import { rectifyGlyphOrder } from "./rectify";

describe("GLYF data rectification", () => {
    test("Rectify point attachments", () => {
        const to = new OtGlyph();
        to.geometry = new OtGlyph.ContourSet([
            [OtGlyph.Point.create(1, 1, OtGlyph.PointType.Corner)]
        ]);
        const from = new OtGlyph();
        const ref1 = new OtGlyph.TtReference(to, OtGlyph.Transform2X3.Identity);
        const ref2 = new OtGlyph.TtReference(to, OtGlyph.Transform2X3.Scale(2));
        ref2.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 0 } };
        from.geometry = new OtGlyph.GeometryList([ref1, ref2]);

        const gOrd = ImpLib.Order.fromList(`Glyphs`, [from, to]);
        rectifyGlyphOrder(gOrd);

        // Geometry is changed after rectification
        const ref2a = (from.geometry as OtGlyph.GeometryList).items[1] as OtGlyph.TtReference;
        expect(ref2a.transform.dx).toBe(-1);
        expect(ref2a.transform.dy).toBe(-1);
    });

    test("Rectify point attachments, nested", () => {
        const sp = new OtGlyph();
        sp.geometry = new OtGlyph.ContourSet([
            [OtGlyph.Point.create(1, 1, OtGlyph.PointType.Corner)]
        ]);
        const spr = new OtGlyph();
        spr.geometry = new OtGlyph.GeometryList([
            new OtGlyph.TtReference(sp, {
                scaledOffset: true,
                xx: 2,
                xy: 0,
                yx: 0,
                yy: 2,
                dx: 2,
                dy: 2
            })
        ]);

        const from = new OtGlyph();
        const ref1 = new OtGlyph.TtReference(spr, OtGlyph.Transform2X3.Scale(2));
        const ref2 = new OtGlyph.TtReference(spr, OtGlyph.Transform2X3.Scale(1));
        ref2.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 0 } };
        from.geometry = new OtGlyph.GeometryList([ref1, ref2]);

        const gOrd = ImpLib.Order.fromList(`Glyphs`, [from, sp]);
        rectifyGlyphOrder(gOrd);

        // Geometry is changed after rectification
        const ref2a = (from.geometry as OtGlyph.GeometryList).items[1] as OtGlyph.TtReference;
        expect(ref2a.transform.dx).toBe(6);
        expect(ref2a.transform.dy).toBe(6);
    });

    test("Rectify point attachments, cascade", () => {
        const to = new OtGlyph();
        to.geometry = new OtGlyph.ContourSet([
            [OtGlyph.Point.create(0, 0), OtGlyph.Point.create(0, 1)]
        ]);
        const from = new OtGlyph();
        const ref1 = new OtGlyph.TtReference(to, OtGlyph.Transform2X3.Identity);
        const ref2 = new OtGlyph.TtReference(to, OtGlyph.Transform2X3.Identity);
        ref2.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 1 } };
        const ref3 = new OtGlyph.TtReference(to, OtGlyph.Transform2X3.Identity);
        ref3.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 3 } };
        from.geometry = new OtGlyph.GeometryList([ref1, ref2, ref3]);

        const gOrd = ImpLib.Order.fromList(`Glyphs`, [from, to]);
        rectifyGlyphOrder(gOrd);

        // Geometry is changed after rectification
        const ref2a = (from.geometry as OtGlyph.GeometryList).items[1] as OtGlyph.TtReference;
        const ref3a = (from.geometry as OtGlyph.GeometryList).items[2] as OtGlyph.TtReference;
        expect(ref2a.transform.dx).toBe(0), expect(ref2a.transform.dy).toBe(1);
        expect(ref3a.transform.dx).toBe(0), expect(ref3a.transform.dy).toBe(2);
    });
});
