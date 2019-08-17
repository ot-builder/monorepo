import { ReadCff1 } from "./main/read-cff1";
import { ReadCff2 } from "./main/read-cff2";
import { WriteCff1 } from "./main/write-cff1";
import { WriteCff2 } from "./main/write-cff2";

export const Cff1Io = { ...ReadCff1, ...WriteCff1 };
export const Cff2Io = { ...ReadCff2, ...WriteCff2 };

export * from "./cfg";
