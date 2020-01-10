import { OtGlyph } from "@ot-builder/ft-glyphs";

export enum InitialGeometryType {
    ContourSet,
    TtReference,
    GeometryList
}
export type InitialContourSet = {
    type: InitialGeometryType.ContourSet;
    leaf: OtGlyph.ContourSetProps;
};
export type InitialTtReference = {
    type: InitialGeometryType.TtReference;
    leaf: OtGlyph.TtReferenceProps;
};
export type InitialGeometryList = {
    type: InitialGeometryType.GeometryList;
    children: InitialGeometry[];
};
export type InitialGeometry = InitialContourSet | InitialTtReference | InitialGeometryList;
export const GeometryToInitial: OtGlyph.GeometryAlg<InitialGeometry> = {
    contourSet: cs => ({
        type: InitialGeometryType.ContourSet,
        leaf: OtGlyph.ContourSet.create(cs.contours)
    }),
    ttReference: re => ({
        type: InitialGeometryType.TtReference,
        leaf: OtGlyph.TtReference.create(re.to, re.transform)
    }),
    geometryList: gs => ({ type: InitialGeometryType.GeometryList, children: gs })
};

export enum InitialHintType {
    TtInstr,
    CffHints
}
export type InitialTtInstr = { type: InitialHintType.TtInstr; leaf: OtGlyph.TtInstructionProps };
export type InitialCffHints = { type: InitialHintType.CffHints; leaf: OtGlyph.CffHintProps };
export type InitialHints = InitialTtInstr | InitialCffHints;
export const HintsToInitial: OtGlyph.HintAlg<InitialHints> = {
    ttInstructions: tt => ({ type: InitialHintType.TtInstr, leaf: tt }),
    cffHint: ch => ({ type: InitialHintType.CffHints, leaf: ch })
};
