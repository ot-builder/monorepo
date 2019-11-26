export const GlyfTag = "glyf";

export enum SimpleGlyphFlag {
    ON_CURVE_POINT = 0x01, // on curve ,off curve
    X_SHORT_VECTOR = 0x02, // x-Short Vector
    Y_SHORT_VECTOR = 0x04, // y-Short Vector
    REPEAT_FLAG = 0x08, // next byte is flag repeat count
    X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR = 0x10, // This x is same (Positive x-Short vector)
    Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR = 0x20, // This y is same (Positive y-Short vector)
    OVERLAP_SIMPLE = 0x40,
    Reserved = 0x80
}

export enum ComponentFlag {
    ARG_1_AND_2_ARE_WORDS = 0x01,
    ARGS_ARE_XY_VALUES = 0x02,
    ROUND_XY_TO_GRID = 0x04,
    WE_HAVE_A_SCALE = 0x08,
    RESERVED = 0x10,
    MORE_COMPONENTS = 0x20,
    WE_HAVE_AN_X_AND_Y_SCALE = 0x40,
    WE_HAVE_A_TWO_BY_TWO = 0x80,
    WE_HAVE_INSTRUCTIONS = 0x100,
    USE_MY_METRICS = 0x200,
    OVERLAP_COMPOUND = 0x400,
    SCALED_COMPONENT_OFFSET = 0x800,
    UNSCALED_COMPONENT_OFFSET = 0x1000
}

export const GlyfOffsetAlign = 4;
export const LocaShortOffsetScaling = 2;
