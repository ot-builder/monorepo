import * as Ot from "@ot-builder/ot";
import * as Rectify from "@ot-builder/rectify";

import { DesignUnifierSession, unifyDesignSpacesImpl } from "../support/design-unifier";
import {
    GlyphHasher,
    GlyphSharingRectifier,
    SharedGlyphStore
} from "../support/share-glyph-set/glyph-hasher";

export type ShareGlyphSetOptions = {
    unifyGlyphList?: boolean;
};

export class GlyphSharer<GS extends Ot.GlyphStore> {
    constructor(private readonly gsf: Ot.GlyphStoreFactory<GS>) {}
    private readonly session = new DesignUnifierSession();
    private readonly sharedGs = new SharedGlyphStore();

    public fonts: Ot.Font<GS>[] = [];

    public addFont(inputFont: Ot.Font<GS>) {
        if (this.fonts.length > 0) unifyDesignSpacesImpl(this.session, this.fonts[0], inputFont);
        unifyGlyphByHash(inputFont, this.gsf, this.session, this.sharedGs, this.fonts.length);
        this.fonts.push(inputFont);
    }

    public unifyGlyphList() {
        for (const font of this.fonts) {
            font.glyphs = this.gsf.createStoreFromList(this.sharedGs.decideOrder());
        }
    }

    public getGlyphList() {
        return Array.from(this.sharedGs.decideOrder());
    }
}

export function shareGlyphSet<GS extends Ot.GlyphStore>(
    fonts: Ot.Font<GS>[],
    gsf: Ot.GlyphStoreFactory<GS>,
    options: ShareGlyphSetOptions = { unifyGlyphList: false }
) {
    const sharer = new GlyphSharer<GS>(gsf);
    for (const font of fonts) sharer.addFont(font);
    if (options.unifyGlyphList) sharer.unifyGlyphList();
}

function unifyGlyphByHash<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    gsf: Ot.GlyphStoreFactory<GS>,
    session: DesignUnifierSession,
    sharedGs: SharedGlyphStore,
    id: number
) {
    const hasher = new GlyphHasher(session);
    const gOrd = font.glyphs.decideOrder();
    const sharing = new GlyphSharingRectifier(sharedGs);
    const result: Ot.Glyph[] = [];

    for (let gid = 0; gid < gOrd.length; gid++) {
        const g = gOrd.at(gid);
        const hash = hasher.compute(g);
        const sharedGlyph = sharing.put(g, hash, id, gid);
        result[gid] = sharedGlyph;
    }

    Rectify.rectifyFontGlyphReferences(sharing, font);
    font.glyphs = gsf.createStoreFromList(result);
}
