import * as Ot from "@ot-builder/ot";
import * as Rectify from "@ot-builder/rectify";

import { DesignUnifierSession, unifyDesignSpacesImpl } from "../support/design-unifier";
import {
    GlyphHasher,
    GlyphSharing,
    SharedGlyphStore
} from "../support/share-glyph-set/glyph-hasher";

export type ShareGlyphSetOptions = {
    unifyGlyphList?: boolean;
};

export function shareGlyphSet<GS extends Ot.GlyphStore>(
    fonts: Ot.Font<GS>[],
    gsf: Ot.GlyphStoreFactory<GS>,
    options: ShareGlyphSetOptions = { unifyGlyphList: false }
) {
    const session = new DesignUnifierSession();
    const sharedGs = new SharedGlyphStore();

    for (let fid = 0; fid < fonts.length; fid++) {
        const inputFont = fonts[fid];
        if (fid > 0) unifyDesignSpacesImpl(session, fonts[0], inputFont);
        unifyGlyphByHash(inputFont, gsf, session, sharedGs, fid);
    }

    if (options.unifyGlyphList) {
        for (const font of fonts) {
            font.glyphs = gsf.createStoreFromList(sharedGs.decideOrder());
        }
    }
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
    const sharing = new GlyphSharing(sharedGs);
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
