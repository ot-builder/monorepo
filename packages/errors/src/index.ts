export namespace Errors {
    export const Unreachable = () => new Error("Unreachable");
    export const NullPtr = (reason?: string) =>
        new TypeError(`Null pointer detected${reason ? " : " + reason : ""}`);
    export const FormatNotSupported = (what: string, ver: number | string) =>
        new TypeError(`${what} format unsupported : ${ver}`);
    export const SizeMismatch = (what: string, ver: number | string) =>
        new TypeError(`${what} size mismatch : ${ver}`);
    export const OffsetMismatch = (what: string, ver: number | string) =>
        new TypeError(`${what} offset mismatch : ${ver}`);
    export const VersionNotSupported = (what: string, ver: number | string) =>
        new TypeError(`${what} version unsupported : ${ver}`);
    export const MissingKeyTable = (tag: string) => new TypeError(`Table ${tag} missing.`);

    export const GlyphNotFound = (where: string) => new RangeError(`Glyph not found in ${where}`);
    export const GlyphCountMismatch = (where: string) =>
        new RangeError(`Glyph count mismatch at ${where}`);

    export namespace Binary {
        export const PointerUnderflow = () => new Error("Critical! Unreachable: Pointer underflow");
        export const UnresolvableFragOverflow = () =>
            new Error("Unresolvable pointer flow happened during packing binary fragments");
        export const UnknownPointerType = () => new TypeError("Unknown pointer type");
    }

    export namespace Primitives {
        export const UnsupportedIntSize = () => new TypeError("Unsupported integer size");
    }

    export namespace Variation {
        export const IndexOverflow = (kind: string, index: number) =>
            new RangeError(`Index ${kind} overflow: ${index}`);
        export const NoAxes = () => new Error(`No axes found in font`);
        export const MissingPoints = () => new Error(`No point list defined`);
        export const MissingPeakTuple = () => new Error(`Cannot find peak tuple`);
        export const TooManyMasters = () => new RangeError("Too many masters are involved");
    }

    export namespace Fvar {
        export const MixedPostScriptNamePresence = () =>
            new Error("fvar::InstanceRecord::postScriptNameID presence mixed across instances");
    }

    export namespace Post {
        export const MissingName = (gid: number | string) =>
            new Error(`Glyph name undefined for glyph #${gid}`);
    }

    export namespace Cff {
        export const OperatorNotSupported = (opCode: number) =>
            new TypeError(`OpCode 0x${opCode.toString(16)} is not supported here`);
        export const StackInsufficient = (actual: number, expected: number) =>
            new RangeError(`Stack height insufficient: Expected ${expected}, Actual ${actual}`);
        export const NotVariable = () => new RangeError(`Cannot use variation here`);
        export const FdSelectSentinelMismatch = (actual: number, expected: number) =>
            new RangeError(`FDSelect sentinel mismatch: ${actual} ~ ${expected}`);
        export const FdSelect4NotSupported = () =>
            new TypeError(
                "This font requires format 4 FDSelect, but it is not supported in CFF version 1."
            );
        export const FdIdOverflow = (actual: number, limit: number) =>
            new RangeError(`FDSelect FD Id overflow: ${actual} >= ${limit}`);
        export const TransientInvalid = (index: number) =>
            new TypeError("Transient[" + index + "] is invalid.");
        export const SubroutineNotFound = (kind: string, index: number) =>
            new RangeError(`CFF subroutine not found: ${kind} ${index}`);
        export const StringsDisallowed = () =>
            new TypeError("Cannot use string in newer CFF version");
        export const ShouldHaveStrings = () =>
            new TypeError("Unreachable. Should support strings.");
        export const MissingPrivateDict = (fdId: number) =>
            new Error(`Private dict missing for FD ${fdId}`);
        export const ShouldHaveFdArray = () => new Error(`FDArray should be present`);
        export const UnknownToken = () => new TypeError("Unrecognized token type");
        export const ReferencesNotSupported = () =>
            new TypeError("CFF does not support references.");
    }

    export namespace Ttf {
        export const MixedGlyph = (gid: number) =>
            new TypeError(`Cannot classify glyph#${gid}. May be a mixed glyph.`);
        export const MissingSharedTuples = () =>
            new Error("GVARHeader->SharedTuples record not exist.");
    }

    export namespace Layout {
        export const EmptyExtensionLookup = () =>
            new TypeError("Extension lookup have no subtables. Cannot decide lookup type.");
    }

    export namespace Name {
        export const EncodingNotSupported = (platformID: number, encodingID: number) =>
            new TypeError(`Name encoding not supported for platform ${platformID} : ${encodingID}`);
    }

    export namespace STAT {
        export const UnknownAxisValueFormat = () => new TypeError(`Unknown axis value format`);
    }

    export namespace Avar {
        export const MissingMapping = (tag: string) =>
            new TypeError(`Missing AVAR mapping for ${tag}`);
    }
}

export namespace Assert {
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
        throw Errors.FormatNotSupported(kind1, actual);
    };
    export const SizeMatch = (kind1: string, actual: number, ...expected: number[]) => {
        for (const x of expected) if (actual === x) return;
        throw Errors.SizeMismatch(kind1, actual);
    };
    export const OffsetMatch = (kind1: string, actual: number, ...expected: number[]) => {
        for (const x of expected) if (actual === x) return;
        throw Errors.OffsetMismatch(kind1, actual);
    };
    export function NoGap<A>(kind: string, arr: readonly A[]) {
        for (let index = 0; index < arr.length; index++) {
            if (arr[index] === undefined) throw new TypeError(`Gap found in array ${kind}`);
        }
    }
    export namespace Variation {
        export const AxesCountMatch = (
            kind1: string,
            actual: number,
            kind2: string,
            expected: number
        ) => {
            if (actual !== expected) {
                throw new TypeError(
                    `Axis count mismatch : ${kind1} ${actual} <> ${kind2} ${expected}`
                );
            }
        };
    }

    export namespace Cff {
        export const OnlyOneTopDictAllowed = <A>(a: A[]) => {
            if (a.length !== 1) throw new RangeError("Only one top dict is allowed in OpenType");
        };
    }
}
