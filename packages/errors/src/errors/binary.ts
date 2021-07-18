export const PointerUnderflow = () => new Error("Critical! Unreachable: Pointer underflow");
export const UnresolvableFragOverflow = () =>
    new Error("Unresolvable pointer flow happened during packing binary fragments");
export const UnknownPointerType = () => new TypeError("Unknown pointer type");
