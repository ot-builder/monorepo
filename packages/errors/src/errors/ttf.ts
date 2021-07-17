export const MixedGlyph = (gid: number) =>
    new TypeError(`Cannot classify glyph#${gid}. May be a mixed glyph.`);
export const MissingSharedTuples = () => new Error("GVARHeader->SharedTuples record not exist.");
export const InvalidPointAttachment = (zOut: number, zIn: number) =>
    new Error(`Invalid point attachment ${zOut} >< ${zIn}.`);
