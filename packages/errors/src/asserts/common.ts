import * as Errors from "../errors";

export const VersionSupported = (kind1: string, actual: number, ...expected: number[]) => {
    for (const x of expected) if (actual === x) return;
    throw Errors.VersionNotSupported(kind1, actual);
};
export const SubVersionSupported = (
    kind1: string,
    major: number,
    minor: number,
    ...expected: [number, number][]
) => {
    for (const [eMaj, eMin] of expected) if (major === eMaj && minor === eMin) return;
    throw Errors.VersionNotSupported(kind1, `${major}.${minor}`);
};
export const FormatSupported = (kind1: string, actual: number, ...expected: number[]) => {
    for (const x of expected) if (actual === x) return;
    throw Errors.FormatNotSupported(kind1, actual, ...expected);
};
export const SizeMatch = (kind1: string, actual: number, ...expected: number[]) => {
    for (const x of expected) if (actual === x) return;
    throw Errors.SizeMismatch(kind1, actual, ...expected);
};
export const TagMatch = (kind1: string, actual: string, ...expected: string[]) => {
    for (const x of expected) if (actual === x) return;
    throw Errors.TagMismatch(kind1, actual, ...expected);
};
export const OffsetMatch = (kind1: string, actual: number, ...expected: number[]) => {
    for (const x of expected) if (actual === x) return;
    throw Errors.OffsetMismatch(kind1, actual, ...expected);
};
export const NotOverflow = (kind1: string, actual: number, limit: number) => {
    if (actual < limit) return;
    throw Errors.OffsetMismatch(kind1, actual);
};
export function NoGap<A>(kind: string, arr: readonly A[]) {
    for (let index = 0; index < arr.length; index++) {
        if (arr[index] === undefined) throw new TypeError(`Gap found in array ${kind}`);
    }
}
