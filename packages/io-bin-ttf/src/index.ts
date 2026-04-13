import { type LocaTable, LocaTableIo, LocaTag } from "./glyf/loca";
import { GlyfTableRead } from "./glyf/read";
import { GlyfTag } from "./glyf/shared";
import { GlyfTableWrite } from "./glyf/write";
import { GvarTableRead } from "./gvar/read";
import { GvarTag } from "./gvar/shared";
import { GvarTableWrite } from "./gvar/write";

export * from "./cfg/index";
export * from "./cvar/index";
export * from "./cvt/index";
export * from "./extra-info-sink/index";
export * from "./fpgm-prep/index";
export * from "./glyf/shared";
export * from "./rectify/rectify";

export namespace Loca {
    export type Table = LocaTable;
    export const Tag = LocaTag;
    export const Io = LocaTableIo;
}

export namespace Glyf {
    export const Tag = GlyfTag;
    export const Read = GlyfTableRead;
    export const Write = GlyfTableWrite;
}
export namespace Gvar {
    export const Tag = GvarTag;
    export const Read = GvarTableRead;
    export const Write = GvarTableWrite;
}
