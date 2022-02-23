export { gcFont } from "./procs/gc";
export { mergeFonts, MergeOptions, consolidateFont } from "./procs/merge-consolidate";
export { rebaseFont } from "./procs/rebase";
export { subsetFont } from "./procs/subset";
export {
    shareGlyphSet,
    GlyphSharer,
    ShareGlyphSetOptions,
    GlyphUnificationResults
} from "./procs/share-glyph-set";
export { inPlaceTransformFontGlyph } from "./procs/transform-glyphs";
export { unifyDesignSpaces } from "./support/design-unifier/index";
