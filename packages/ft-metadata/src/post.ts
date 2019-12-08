import { F16D16, UInt16, UInt32 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export namespace Post {
    export const Tag = "post";
    export class Table {
        public majorVersion: UInt16 = 3;
        public minorVersion: UInt16 = 0;
        public italicAngle: F16D16 = 0;
        public underlinePosition: OtVar.Value = 0;
        public underlineThickness: OtVar.Value = 0;
        public isFixedPitch: boolean = false;
        public minMemType42: UInt32 = 0;
        public maxMemType42: UInt32 = 0;
        public minMemType1: UInt32 = 0;
        public maxMemType1: UInt32 = 0;
    }
}
