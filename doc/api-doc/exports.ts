import { createTopLevelExport, setPage, TyRep } from "./tyrep";

export const Data = createTopLevelExport("Data");
setPage(Data, "Prelude");
export const Sigma = createTopLevelExport("Sigma");
setPage(Sigma, "Prelude");
export const Tag = createTopLevelExport("Tag");
setPage(Tag, "Primitives");

export const Ot = createTopLevelExport("Ot");
setPage(Ot, "Index");
setPage(Ot.Sfnt);
setPage(Ot.Font);
setPage(Ot.Var);
setPage(Ot.Glyph);
setPage(Ot.ListGlyphStore, "Ot.Glyph");
setPage(Ot.ListGlyphStoreFactory, "Ot.Glyph");
setPage(Ot.GlyphStore, "Ot.Glyph");
setPage(Ot.GlyphStoreFactory, "Ot.Glyph");
setPage(Ot.GlyphStoreFactoryWithDefault, "Ot.Glyph");
setPage(Ot.GlyphNamingSource, "Ot.Glyph");
setPage(Ot.GlyphNamer, "Ot.Glyph");
setPage(Ot.StandardGlyphNamer, "Ot.Glyph");

setPage(Ot.Head);
setPage(Ot.Fvar);
setPage(Ot.Maxp);
setPage(Ot.Post);
setPage(Ot.Os2);
setPage(Ot.MetricHead, "Ot.Metric-Head");
setPage(Ot.Avar);
setPage(Ot.Gasp);
setPage(Ot.Vdmx);

setPage(Ot.Cff);
setPage(Ot.Fpgm);
setPage(Ot.Prep);
setPage(Ot.Cvt);

setPage(Ot.Cmap);

setPage(Ot.Name);
setPage(Ot.Stat);
setPage(Ot.Meta);

setPage(Ot.Gdef);
setPage(Ot.Base);
setPage(Ot.GsubGpos, "Ot.Gsub-Gpos");
setPage(Ot.Gsub, "Ot.Gsub-Gpos");
setPage(Ot.Gpos, "Ot.Gsub-Gpos");

export const FontIo = createTopLevelExport("FontIo");
setPage(FontIo, "font-io");

export const Rectify = createTopLevelExport("Rectify");
setPage(Rectify);

export const Trace = createTopLevelExport("Trace");
setPage(Trace);

export const CliProc = createTopLevelExport("CliProc");
setPage(CliProc);

export const string = "string";
export const number = "number";
export const boolean = "boolean";
export const map = (...ts: TyRep[]): TyRep => ({ generic: "Map", args: ts });
export const set = (...ts: TyRep[]): TyRep => ({ generic: "Set", args: ts });
export const iterable = (...ts: TyRep[]): TyRep => ({ generic: "Iterable", args: ts });
export const array = (ts: TyRep): TyRep => ({ array: ts });
