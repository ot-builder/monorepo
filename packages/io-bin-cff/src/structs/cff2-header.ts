import { Read, Write } from "@ot-builder/bin-util";
import { UInt16, UInt8 } from "@ot-builder/primitive";

export type Cff2Header = {
    majorVersion: UInt8;
    minorVersion: UInt8;
    headerSize: UInt8;
    topDictLength: UInt16;
};

export const Cff2Header = {
    ...Read<Cff2Header>(view => {
        return {
            majorVersion: view.uint8(),
            minorVersion: view.uint8(),
            headerSize: view.uint8(),
            topDictLength: view.uint16()
        };
    }),
    ...Write<Cff2Header>((frag, header) => {
        frag.uint8(header.majorVersion);
        frag.uint8(header.minorVersion);
        frag.uint8(header.headerSize);
        frag.uint16(header.topDictLength);
    })
};
