export const Unreachable = () => new Error("Unreachable");
export const NullPtr = (reason?: string) =>
    new TypeError(`Null pointer detected${reason ? " : " + reason : ""}`);
export const FormatNotSupported = (
    what: string,
    ver: number | string,
    ...expected: (number | string)[]
) => new TypeError(`${what} format unsupported : ${ver} (Expected: ${expected})`);
export const VersionNotSupported = (what: string, ver: number | string) =>
    new TypeError(`${what} version unsupported : ${ver}`);
export const SizeMismatch = (what: string, actual: number, ...expected: number[]) =>
    new TypeError(`${what} size mismatch : ${actual} (Expected: ${expected})`);
export const TagMismatch = (what: string, actual: string, ...expected: string[]) =>
    new TypeError(`${what} tag mismatch : ${actual} (Expected: ${expected})`);
export const OffsetMismatch = (what: string, actual: number, ...expected: number[]) =>
    new TypeError(`${what} offset mismatch : ${expected} (Expected: ${expected})`);
export const MissingKeyTable = (tag: string) => new TypeError(`Table ${tag} missing.`);
export const GeneralOverflow = (kind: string, value: number) =>
    new RangeError(`${kind} overflow: ${value}.`);

export const GlyphNotFound = (where: string) => new RangeError(`Glyph not found in ${where}`);
export const GlyphCountMismatch = (where: string) =>
    new RangeError(`Glyph count mismatch at ${where}`);
