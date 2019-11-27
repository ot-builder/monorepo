import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";

import { rectifyGlyphOrder } from "./rectify";

describe("GLYF data rectification", () => {
    test("Rectify point attachments", () => {
        const to = new OtGlyph();
        to.geometry = new OtGlyph.ContourSet([[new OtGlyph.Point(1, 1, OtGlyph.PointType.Corner)]]);
        const from = new OtGlyph();
        const ref1 = new OtGlyph.TtReference(to, OtGlyph.Transform2X3.Neutral());
        const ref2 = new OtGlyph.TtReference(to, OtGlyph.Transform2X3.Scale(2));
        ref2.pointAttachment = { inner: { pointIndex: 0 }, outer: { pointIndex: 0 } };
        from.geometry = new OtGlyph.TtReferenceList([ref1, ref2]);

        const gOrd = ImpLib.Order.fromList(`Glyphs`, [from, to]);
        rectifyGlyphOrder(gOrd);

        expect(ref2.transform.dx).toBe(-1);
        expect(ref2.transform.dy).toBe(-1);
    });
    test("Rectify point attachments, nested", () => {
        const sp = new OtGlyph();
        sp.geometry = new OtGlyph.ContourSet([[new OtGlyph.Point(1, 1, OtGlyph.PointType.Corner)]]);
        const spr = new OtGlyph();
        spr.geometry = new OtGlyph.TtReferenceList([
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
        from.geometry = new OtGlyph.TtReferenceList([ref1, ref2]);

        const gOrd = ImpLib.Order.fromList(`Glyphs`, [from, sp]);
        rectifyGlyphOrder(gOrd);

        expect(ref2.transform.dx).toBe(6);
        expect(ref2.transform.dy).toBe(6);
    });
});
