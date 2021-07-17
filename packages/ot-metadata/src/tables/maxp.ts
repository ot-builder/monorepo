import { UInt16, UInt32 } from "@ot-builder/primitive";

export const Tag = "maxp";

export class Table {
    private constructor(public readonly version: UInt32) {}
    public numGlyphs: UInt16 = 0; // VOLATILE (somehow)
    public maxPoints: UInt16 = 0; // VOLATILE
    public maxContours: UInt16 = 0; // VOLATILE
    public maxCompositePoints: UInt16 = 0; // VOLATILE
    public maxCompositeContours: UInt16 = 0; // VOLATILE
    public maxZones: UInt16 = 0;
    public maxTwilightPoints: UInt16 = 0;
    public maxStorage: UInt16 = 0;
    public maxFunctionDefs: UInt16 = 0;
    public maxInstructionDefs: UInt16 = 0;
    public maxStackElements: UInt16 = 0;
    public maxSizeOfInstructions: UInt16 = 0; // VOLATILE
    public maxComponentElements: UInt16 = 0; // VOLATILE
    public maxComponentDepth: UInt16 = 0; // VOLATILE

    public static FromVersion(version: UInt32) {
        return new Table(version);
    }
    public static TrueType() {
        return new Table(0x10000);
    }
    public static Cff() {
        return new Table(0x5000);
    }
}
