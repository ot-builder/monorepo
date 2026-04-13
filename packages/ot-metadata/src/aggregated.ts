import type { Data } from "@ot-builder/prelude";

import type * as Avar from "./tables/avar";
import type * as Fvar from "./tables/fvar";
import type * as Gasp from "./tables/gasp";
import type * as Head from "./tables/head";
import type * as Maxp from "./tables/maxp";
import type * as MetricHead from "./tables/metric-head";
import type * as Os2 from "./tables/os2";
import type * as Post from "./tables/post";
import type * as Vdmx from "./tables/vdmx";

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
