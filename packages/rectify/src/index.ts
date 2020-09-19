export * from "./interface";

// Font rectification
export { inPlaceRectifyFont } from "./procs/rectify-font";
export { inPlaceRectifyFontGlyphReferences } from "./procs/rectify-glyphs";
export { inPlaceRectifyFontAxes, inPlaceRectifyFontCoords } from "./procs/rectify-coords";

// Single table rectification
export { rectifyExtPrivateTable, rectifyCmapTable } from "./encoding";
export { inPlaceRectifyGlyphStore } from "./glyph";
export { rectifyCffTable } from "./glyph-store/cff";
export { rectifyCvtTable } from "./glyph-store/cvt";
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
