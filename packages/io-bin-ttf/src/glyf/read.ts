import { Read } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { F2D14, UInt16 } from "@ot-builder/primitive";

import { LocaTable } from "./loca";
import { ComponentFlag, SimpleGlyphFlag } from "./shared";

const PointFlags = Read((view, numberOfCoordinates: number) => {
    const flags: number[] = [];
    let ixFlag = 0;
    while (ixFlag < numberOfCoordinates) {
        const flag = view.uint8();
        flags.push(flag);
        ixFlag++;

        // Repeat flag?
        if (flag & SimpleGlyphFlag.REPEAT_FLAG && ixFlag < numberOfCoordinates) {
            // number of repeats
            const repeat = view.uint8();
            for (let ixRepeat = 0; ixRepeat < repeat; ixRepeat++) {
                flags.push(flag);
                ixFlag++;
            }
        }
    }
    return flags;
});

const XCoordinates = Read((view, flags: number[]) => {
    const coordinatesX: Array<number> = [];
    let prevX = 0;
    for (const flag of flags) {
        let x = 0;

        // Pos 1
        // If set, the corresponding y-coordinate is 1 byte long, not 2
        if (flag & SimpleGlyphFlag.X_SHORT_VECTOR) {
            // Pos 5
            x = view.uint8();
            x = flag & SimpleGlyphFlag.X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR ? x : -1 * x;
        } else if (flag & SimpleGlyphFlag.X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR) {
            // Same as previous byte
            x = 0;
        } else {
            // new value
            x = view.int16();
        }

        prevX += x;
        coordinatesX.push(prevX);
    }
    return coordinatesX;
});

const YCoordinates = Read((view, flags: number[]) => {
    const coordinatesY: Array<number> = [];
    let prevY = 0;
    for (const flag of flags) {
        let y = 0;

        if (flag & SimpleGlyphFlag.Y_SHORT_VECTOR) {
            // Pos 5
            y = view.uint8();
            y = flag & SimpleGlyphFlag.Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR ? y : -1 * y;
        } else if (flag & SimpleGlyphFlag.Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR) {
            y = 0;
        } else {
            y = view.int16();
        }

        prevY += y;
        coordinatesY.push(prevY);
    }
    return coordinatesY;
});

const SimpleGlyph = Read((view, numberOfContours: number) => {
    const endPtsOfContours = view.array(numberOfContours, UInt16);
    const instructionLength = view.uint16();
    const instructions = view.bytes(instructionLength);
    const numberOfCoordinates = endPtsOfContours[endPtsOfContours.length - 1] + 1;
    const flags = view.next(PointFlags, numberOfCoordinates);
    const coordinatesX = view.next(XCoordinates, flags);
    const coordinatesY = view.next(YCoordinates, flags);

    const coordinates: Array<OtGlyph.Point> = [];
    for (let zid = 0; zid < flags.length; zid++) {
        coordinates[zid] = OtGlyph.Point.create(
            coordinatesX[zid] || 0,
            coordinatesY[zid] || 0,
            flags[zid] & SimpleGlyphFlag.ON_CURVE_POINT
                ? OtGlyph.PointType.Corner
                : OtGlyph.PointType.Quad
        );
    }

    const contours: Array<Array<OtGlyph.Point>> = [];
    if (coordinates.length) {
        for (let m = 0; m < endPtsOfContours.length; m++) {
            contours.push(
                coordinates.slice(
                    m === 0 ? 0 : endPtsOfContours[m - 1] + 1,
                    endPtsOfContours[m] + 1
                )
            );
        }
    }

    return {
        geometry: OtGlyph.ContourSet.create(contours),
        instructions
    };
});

const ComponentArgs = Read((view, flags: number) => {
    let arg1 = 0;
    let arg2 = 0;
    if (ComponentFlag.ARGS_ARE_XY_VALUES & flags) {
        if (ComponentFlag.ARG_1_AND_2_ARE_WORDS & flags) {
            arg1 = view.int16();
            arg2 = view.int16();
        } else {
            arg1 = view.int8();
            arg2 = view.int8();
        }
    } else {
        if (ComponentFlag.ARG_1_AND_2_ARE_WORDS & flags) {
            arg1 = view.uint16();
            arg2 = view.uint16();
        } else {
            arg1 = view.uint8();
            arg2 = view.uint8();
        }
    }
    return [arg1, arg2];
});

const ComponentTransformMatrix = Read((view, flags: number) => {
    let scaleX = 1;
    let scaleY = 1;
    let scale01 = 0;
    let scale10 = 0;
    if (ComponentFlag.WE_HAVE_A_SCALE & flags) {
        scaleX = view.next(F2D14);
        scaleY = scaleX;
    } else if (ComponentFlag.WE_HAVE_AN_X_AND_Y_SCALE & flags) {
        scaleX = view.next(F2D14);
        scaleY = view.next(F2D14);
    } else if (ComponentFlag.WE_HAVE_A_TWO_BY_TWO & flags) {
        scaleX = view.next(F2D14);
        scale01 = view.next(F2D14);
        scale10 = view.next(F2D14);
        scaleY = view.next(F2D14);
    }
    return { scaleX, scaleY, scale01, scale10 };
});

const CompositeGlyph = Read((view, gOrd: Data.Order<OtGlyph>) => {
    const references: OtGlyph.TtReference[] = [];
    let instructions: Data.Maybe<Buffer> = null;

    let flags = 0;

    // Read one reference
    do {
        flags = view.uint16();
        const glyphIndex = view.uint16();
        const subGlyf = gOrd.at(glyphIndex);

        const [arg1, arg2] = view.next(ComponentArgs, flags);
        const { scaleX, scaleY, scale01, scale10 } = view.next(ComponentTransformMatrix, flags);

        const ref = OtGlyph.TtReference.create(subGlyf, {
            scaledOffset: !!(flags & ComponentFlag.SCALED_COMPONENT_OFFSET),
            xx: scaleX,
            yx: scale01,
            xy: scale10,
            yy: scaleY,
            dx: 0,
            dy: 0
        });

        ref.roundXyToGrid = !!(ComponentFlag.ROUND_XY_TO_GRID & flags);
        ref.useMyMetrics = !!(ComponentFlag.USE_MY_METRICS & flags);
        ref.overlapCompound = !!(ComponentFlag.OVERLAP_COMPOUND & flags);

        if (ComponentFlag.ARGS_ARE_XY_VALUES & flags) {
            ref.transform = { ...ref.transform, dx: arg1, dy: arg2 };
        } else {
            ref.pointAttachment = { outer: { pointIndex: arg1 }, inner: { pointIndex: arg2 } };
        }

        references.push(ref);
    } while (ComponentFlag.MORE_COMPONENTS & flags);

    if (ComponentFlag.WE_HAVE_INSTRUCTIONS & flags) {
        const length = view.uint16();
        instructions = view.bytes(length);
    }
    return { references, instructions };
});

export const GlyfTableRead = Read(
    (view, loca: LocaTable, gOrd: Data.Order<OtGlyph>, coStat: OtGlyph.CoStat.Source) => {
        for (let gid = 0; gid < gOrd.length; gid++) {
            const glyph = gOrd.at(gid);
            const offset = loca.glyphOffsets[gid];
            const nextOffset = loca.glyphOffsets[gid + 1];
            const bound: OtGlyph.Stat.BoundingBox = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
            if (nextOffset > offset) {
                const vGlyph = view.lift(offset);
                const numberOfContours = vGlyph.int16();
                bound.xMin = vGlyph.int16();
                bound.yMin = vGlyph.int16();
                bound.xMax = vGlyph.int16();
                bound.yMax = vGlyph.int16();
                if (numberOfContours >= 0) {
                    const { geometry, instructions } = vGlyph.next(SimpleGlyph, numberOfContours);
                    glyph.geometry = geometry;
                    if (instructions && instructions.byteLength) {
                        glyph.hints = OtGlyph.TtInstruction.create(instructions);
                    }
                } else {
                    const r = vGlyph.next(CompositeGlyph, gOrd);
                    glyph.geometry = OtGlyph.GeometryList.create(r.references);
                    if (r.instructions && r.instructions.byteLength) {
                        glyph.hints = OtGlyph.TtInstruction.create(r.instructions);
                    }
                }
            }

            const hm = coStat.getHMetric(gid, bound);
            if (hm) glyph.horizontal = hm;
            const vm = coStat.getVMetric(gid, bound);
            if (vm) glyph.vertical = vm;
        }
    }
);
