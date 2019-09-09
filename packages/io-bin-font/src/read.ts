import { Config } from "@ot-builder/cfg-log";
import { OtFont } from "@ot-builder/font";
import { OtEncoding } from "@ot-builder/ft-encoding";
import { Cff, OtGlyph, OtGlyphNamingSource } from "@ot-builder/ft-glyphs";
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

export function readFont<GS extends Data.OrderStore<OtGlyph>>(
    sfnt: Sfnt,
    gsf: Data.OrderStoreFactory<OtGlyph, GS>,
    partialConfig: Config<FontIoConfig>
): OtFont<GS> {
    const cfg = createConfig(partialConfig);
    const md = readOtMetadata(sfnt, cfg);
    const names = readNames(sfnt);

    let gOrd,
        glyphs,
        coGlyphs,
        cffGlyphNaming: Data.Maybe<Data.Naming.Source<OtGlyph>> = null;
    if (sfnt.tables.has(Cff.Tag1) || sfnt.tables.has(Cff.Tag2)) {
        const r = readGlyphStore(sfnt, cfg, md, gsf, ReadCffGlyphs);
        gOrd = r.gOrd;
        glyphs = r.glyphs;
        coGlyphs = r.coGlyphs;
        cffGlyphNaming = r.coGlyphs.cffGlyphNaming;
    } else {
        const r = readGlyphStore(sfnt, cfg, md, gsf, ReadTtfGlyphs);
        gOrd = r.gOrd;
        glyphs = r.glyphs;
        coGlyphs = r.coGlyphs;
    }

    const encoding = readEncoding(sfnt, cfg, gOrd, md);
    const otl = readOtl(sfnt, gOrd, md);

    // Glyph name
    nameGlyphs(md, gOrd, cffGlyphNaming, encoding, cfg);

    return { ...md, ...names, glyphs, ...coGlyphs, ...encoding, ...otl };
}

function nameGlyphs(
    md: OtFontIoMetadata,
    gOrd: Data.Order<OtGlyph>,
    cffGlyphNaming: Data.Maybe<Data.Naming.Source<OtGlyph>>,
    encoding: OtEncoding,
    cfg: Config<FontIoCfgFinal>
) {
    const namingSource: OtGlyphNamingSource = {
        post: md.postGlyphNaming ? new PostGlyphNamingWrapper(md.postGlyphNaming, gOrd) : null,
        cff: cffGlyphNaming,
        encoding: new CmapNameIndexSource(encoding)
    };
    const namer = cfg.glyphNaming.Namer ? cfg.glyphNaming.Namer() : new StandardOtGlyphNamer();
    for (let gid = 0; gid < gOrd.length; gid++) {
        const glyph = gOrd.at(gid);
        glyph.name = namer.nameGlyph(namingSource, gid, glyph);
    }
}

class PostGlyphNamingWrapper implements Data.Naming.Source<OtGlyph> {
    constructor(
        private postNaming: Data.Naming.Source<number>,
        private gOrd: Data.Order<OtGlyph>
    ) {}
    public getName(glyph: OtGlyph) {
        let gid = this.gOrd.tryReverse(glyph);
        if (gid == null) return undefined;
        else return this.postNaming.getName(gid);
    }
}

class CmapNameIndexSource implements Data.Naming.IndexSource<OtGlyph> {
    constructor(encoding: OtEncoding) {
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
    private reverse: Map<OtGlyph, number> = new Map();
    private reverseVar: Map<OtGlyph, number[]> = new Map();

    public getIndex(glyph: OtGlyph) {
        return this.reverse.get(glyph);
    }
    public getVariantIndex(glyph: OtGlyph) {
        return this.reverseVar.get(glyph);
    }
}
