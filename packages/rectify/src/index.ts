// Single table rectification
export { rectifyCmapTable, rectifyExtPrivateTable } from "./encoding";
export { inPlaceRectifyGlyphStore } from "./glyph";
export { rectifyCffTable } from "./glyph-store/cff";
export { rectifyCvtTable } from "./glyph-store/cvt";
export * from "./interface";
export { rectifyBaseTable } from "./layout/base";
export { rectifyGdefTable } from "./layout/gdef";
export { rectifyGposTable, rectifyGsubTable } from "./layout/gsub-gpos";
export { rectifyMathTable } from "./layout/math";
export { rectifyAvarTable } from "./meta/avar";
export { rectifyFvarTable } from "./meta/fvar";
export { rectifyGaspTable } from "./meta/gasp";
export { rectifyHheaTable, rectifyVheaTable } from "./meta/hhea-vhea";
export { rectifyOs2Table } from "./meta/os2";
export { rectifyPostTable } from "./meta/post";
export { rectifyTSI5Table, rectifyTSI0123Table } from "./private/vtt";
export { inPlaceRectifyFontAxes, inPlaceRectifyFontCoords } from "./procs/rectify-coords";
// Font rectification
export { inPlaceRectifyFont } from "./procs/rectify-font";
export { inPlaceRectifyFontGlyphReferences } from "./procs/rectify-glyphs";
