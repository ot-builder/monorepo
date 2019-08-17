import { SubtableHandler } from "./general";
import { UnicodeBmp } from "./unicode-bmp";
import { UnicodeFull } from "./unicode-full";
import { UnicodeVS } from "./unicode-vs";

export type SubtableHandlerFactory = () => SubtableHandler;

export const SubtableHandlers: SubtableHandlerFactory[] = [
    () => new UnicodeBmp(),
    () => new UnicodeFull(),
    () => new UnicodeVS()
];
