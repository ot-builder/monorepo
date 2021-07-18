export const EncodingNotSupported = (platformID: number, encodingID: number) =>
    new TypeError(`Name encoding not supported for platform ${platformID} : ${encodingID}`);
