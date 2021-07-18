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
export const StringsDisallowed = () => new TypeError("Cannot use string in newer CFF version");
export const ShouldHaveStrings = () => new TypeError("Unreachable. Should support strings.");
export const MissingPrivateDict = (fdId: number) =>
    new Error(`Private dict missing for FD ${fdId}`);
export const ShouldHaveFdArray = () => new Error(`FDArray should be present`);
export const UnknownToken = () => new TypeError("Unrecognized token type");
export const ReferencesNotSupported = () => new TypeError("CFF does not support references.");
