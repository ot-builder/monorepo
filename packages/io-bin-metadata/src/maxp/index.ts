import { Read, Write } from "@ot-builder/bin-util";
import { Maxp } from "@ot-builder/ot-metadata";

export const MaxpIo = {
    ...Read<Maxp.Table>(vw => {
        const version = vw.uint32();
        const maxp = Maxp.Table.FromVersion(version);
        maxp.numGlyphs = vw.uint16();
        if (maxp.version >= 0x10000) {
            maxp.maxPoints = vw.uint16();
            maxp.maxContours = vw.uint16();
            maxp.maxCompositePoints = vw.uint16();
            maxp.maxCompositeContours = vw.uint16();
            maxp.maxZones = vw.uint16();
            maxp.maxTwilightPoints = vw.uint16();
            maxp.maxStorage = vw.uint16();
            maxp.maxFunctionDefs = vw.uint16();
            maxp.maxInstructionDefs = vw.uint16();
            maxp.maxStackElements = vw.uint16();
            maxp.maxSizeOfInstructions = vw.uint16();
            maxp.maxComponentElements = vw.uint16();
            maxp.maxComponentDepth = vw.uint16();
        }
        return maxp;
    }),
    ...Write<Maxp.Table>((fr, maxp) => {
        fr.uint32(maxp.version);
        fr.uint16(maxp.numGlyphs);

        if (maxp.version >= 0x10000) {
            fr.uint16(maxp.maxPoints);
            fr.uint16(maxp.maxContours);
            fr.uint16(maxp.maxCompositePoints);
            fr.uint16(maxp.maxCompositeContours);
            fr.uint16(maxp.maxZones);
            fr.uint16(maxp.maxTwilightPoints);
            fr.uint16(maxp.maxStorage);
            fr.uint16(maxp.maxFunctionDefs);
            fr.uint16(maxp.maxInstructionDefs);
            fr.uint16(maxp.maxStackElements);
            fr.uint16(maxp.maxSizeOfInstructions);
            fr.uint16(maxp.maxComponentElements);
            fr.uint16(maxp.maxComponentDepth);
        }
    })
};
