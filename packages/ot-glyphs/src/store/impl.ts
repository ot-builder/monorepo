import * as ImpLib from "@ot-builder/common-impl";

import { OtGlyph } from "../ot-glyph";

export const OtListGlyphStoreFactory = new ImpLib.Order.ListStoreFactoryWithDefault(
    `Glyphs`,
    () => new OtGlyph()
);
