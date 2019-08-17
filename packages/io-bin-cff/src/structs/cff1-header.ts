import { Read, Write } from "@ot-builder/bin-util";
import { UInt8 } from "@ot-builder/primitive";

export type Cff1Header = {
    majorVersion: UInt8;
    minorVersion: UInt8;
    headerSize: UInt8;
    offSize: UInt8;
};

export const Cff1Header = {
    ...Read<Cff1Header>(view => {
        return {
            majorVersion: view.uint8(),
            minorVersion: view.uint8(),
            headerSize: view.uint8(),
            offSize: view.uint8()
        };
    }),
    ...Write<Cff1Header>((frag, header) => {
        frag.uint8(header.majorVersion);
        frag.uint8(header.minorVersion);
        frag.uint8(header.headerSize);
        frag.uint8(header.offSize);
    })
};
