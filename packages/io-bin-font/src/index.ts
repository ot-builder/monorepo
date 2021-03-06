export { FontIoConfig } from "./config";
export { readFont } from "./read";
export { writeFont } from "./write";
export {
    readSfntOtf,
    readSfntTtc,
    TableSlice,
    TableSliceCollection,
    writeSfntOtf,
    writeSfntOtfFromTableSlices,
    writeSfntTtc,
    writeSfntTtcFromTableSlices
} from "@ot-builder/io-bin-sfnt";
