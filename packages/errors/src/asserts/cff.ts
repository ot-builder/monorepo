export const OnlyOneTopDictAllowed = <A>(a: A[]) => {
    if (a.length !== 1) throw new RangeError("Only one top dict is allowed in OpenType");
};
