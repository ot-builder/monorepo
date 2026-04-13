export enum TvhSetFlags {
    SHARED_POINT_NUMBERS = 0x8000,
    Reserved = 0x7000,
    COUNT_MASK = 0x0fff
}

export enum TvhFlags {
    EMBEDDED_PEAK_TUPLE = 0x8000,
    INTERMEDIATE_REGION = 0x4000,
    PRIVATE_POINT_NUMBERS = 0x2000,
    Reserved = 0x1000,
    TUPLE_INDEX_MASK = 0x0fff
}
