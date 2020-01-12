import { Data } from "@ot-builder/prelude";

import { Avar } from "./avar";
import { Fvar } from "./fvar";
import { Gasp } from "./gasp";
import { Head } from "./head";
import { Maxp } from "./maxp";
import { MetricHead } from "./metric-head";
import { Os2 } from "./os2";
import { Post } from "./post";
import { Vdmx } from "./vdmx";

export * from "./fvar";
export * from "./head";
export * from "./maxp";
export * from "./os2";
export * from "./post";
export * from "./metric-head";
export * from "./avar";
export * from "./gasp";
export * from "./vdmx";

export interface OtFontMetadata {
    head: Head.Table;
    maxp: Maxp.Table;
    fvar?: Data.Maybe<Fvar.Table>;
    post?: Data.Maybe<Post.Table>;
    os2?: Data.Maybe<Os2.Table>;
    hhea?: Data.Maybe<MetricHead.Table>;
    vhea?: Data.Maybe<MetricHead.Table>;
    avar?: Data.Maybe<Avar.Table>;
    gasp?: Data.Maybe<Gasp.Table>;
    vdmx?: Data.Maybe<Vdmx.Table>;
}

export interface OtFontIoMetadata extends OtFontMetadata {
    readonly postGlyphNaming?: Data.Maybe<Data.Naming.Source<number>>;
}
