import * as Ot from "@ot-builder/font";
import { CffCoGlyphs, TtfCoGlyphs } from "@ot-builder/ft-glyphs";
import { OtFontIoMetadata } from "@ot-builder/ft-metadata";
import { Sfnt } from "@ot-builder/ft-sfnt";
import { readEncoding } from "@ot-builder/io-bin-encoding";
import { ReadCffGlyphs, readGlyphStore, ReadTtfGlyphs } from "@ot-builder/io-bin-glyph-store";
import { readOtl } from "@ot-builder/io-bin-layout";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readNames } from "@ot-builder/io-bin-name";
import { Data } from "@ot-builder/prelude";
import { StandardOtGlyphNamer } from "@ot-builder/standard-glyph-namer";

import { createConfig, FontIoCfgFinal, FontIoConfig } from "./config";

export function readFont<GS extends Data.OrderStore<Ot.Glyph>>(
    sfnt: Sfnt,
    gsf: Data.OrderStoreFactoryWithDefault<Ot.Glyph, GS>,
    config: FontIoConfig = {}
): Ot.Font<GS> {
    const fullCfg = createConfig(config);
    const md = readOtMetadata(sfnt, fullCfg);
    const names = readNames(sfnt);

    let gOrd: Data.Order<Ot.Glyph>,
        glyphs: GS,
        coGlyphs: TtfCoGlyphs | CffCoGlyphs,
        cffGlyphNaming: Data.Maybe<Data.Naming.Source<Ot.Glyph>> = null;
    if (sfnt.tables.has(Ot.Cff.Tag1) || sfnt.tables.has(Ot.Cff.Tag2)) {
        const r = readGlyphStore(sfnt, fullCfg, md, gsf, ReadCffGlyphs);
        gOrd = r.gOrd;
        glyphs = r.glyphs;
        coGlyphs = { cff: r.coGlyphs.cff };
        cffGlyphNaming = r.coGlyphs.cffGlyphNaming;
    } else {
        const r = readGlyphStore(sfnt, fullCfg, md, gsf, ReadTtfGlyphs);
        gOrd = r.gOrd;
        glyphs = r.glyphs;
        coGlyphs = r.coGlyphs;
    }

    const encoding = readEncoding(sfnt, fullCfg, gOrd, md);
    const otl = readOtl(sfnt, gOrd, md);

    // Glyph name
    nameGlyphs(md, gOrd, cffGlyphNaming, encoding, fullCfg);

    return { ...md, ...names, glyphs, ...coGlyphs, ...encoding, ...otl };
}

function nameGlyphs(
    md: OtFontIoMetadata,
    gOrd: Data.Order<Ot.Glyph>,
    cffGlyphNaming: Data.Maybe<Data.Naming.Source<Ot.Glyph>>,
    encoding: Ot.Encoding,
    cfg: FontIoCfgFinal
) {
    const namingSource: Ot.GlyphNamingSource = {
        post: md.postGlyphNaming ? new PostGlyphNamingWrapper(md.postGlyphNaming, gOrd) : null,
        cff: cffGlyphNaming,
        encoding: new CmapNameIndexSource(encoding)
    };
    const namer = cfg.glyphNaming.namer || new StandardOtGlyphNamer();
    for (let gid = 0; gid < gOrd.length; gid++) {
        const glyph = gOrd.at(gid);
        glyph.name = namer.nameGlyph(namingSource, gid, glyph);
    }
}

class PostGlyphNamingWrapper implements Data.Naming.Source<Ot.Glyph> {
    constructor(
        private postNaming: Data.Naming.Source<number>,
        private gOrd: Data.Order<Ot.Glyph>
    ) {}
    public getName(glyph: Ot.Glyph) {
        const gid = this.gOrd.tryReverse(glyph);
        if (gid == null) return undefined;
        else return this.postNaming.getName(gid);
    }
}

class CmapNameIndexSource implements Data.Naming.IndexSource<Ot.Glyph> {
    constructor(encoding: Ot.Encoding) {
        if (encoding.cmap) {
            const encodingList = [...encoding.cmap.unicode.entries()].sort((a, b) => a[0] - b[0]);
            for (const [uni, g] of encodingList) {
                if (!this.reverse.has(g)) this.reverse.set(g, uni);
            }
            const varEncodingList = [...encoding.cmap.vs.entries()].sort(
                (a, b) => a[0] - b[0] || a[1] - b[1]
            );
            for (const [uni, vs, g] of varEncodingList) {
                if (!this.reverse.has(g)) this.reverseVar.set(g, [uni, vs]);
            }
        }
    }
    private reverse: Map<Ot.Glyph, number> = new Map();
    private reverseVar: Map<Ot.Glyph, number[]> = new Map();

    public getIndex(glyph: Ot.Glyph) {
        return this.reverse.get(glyph);
    }
    public getVariantIndex(glyph: Ot.Glyph) {
        return this.reverseVar.get(glyph);
    }
}
