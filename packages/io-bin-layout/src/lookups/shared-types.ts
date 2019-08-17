import { Ptr16, SimpleArray, UInt16 } from "@ot-builder/primitive";

import { Ptr16GlyphCoverage } from "../shared/coverage";

export const SimpleClassIdArray = SimpleArray(UInt16, UInt16);
export const SimpleGidArray = SimpleArray(UInt16, UInt16);
export const SimpleCoverageArray = SimpleArray(UInt16, Ptr16GlyphCoverage);
export const SimpleOffsetArray = SimpleArray(UInt16, Ptr16);
