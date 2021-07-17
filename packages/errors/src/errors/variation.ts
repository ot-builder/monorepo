export const IndexOverflow = (kind: string, index: number) =>
    new RangeError(`Index ${kind} overflow: ${index}`);
export const NoAxes = () => new Error(`No axes found in font`);
export const MissingPoints = () => new Error(`No point list defined`);
export const MissingPeakTuple = () => new Error(`Cannot find peak tuple`);
export const TooManyMasters = () => new RangeError("Too many masters are involved");
