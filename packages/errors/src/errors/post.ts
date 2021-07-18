export const MissingName = (gid: number | string) =>
    new Error(`Glyph name undefined for glyph #${gid}`);
