import * as Ot from "@ot-builder/font";
import * as Rectify from "@ot-builder/rectify-font";

import { DesignUnifierSession, unifyDesignSpacesImpl } from "../support/design-unifier";
import {
    GlyphHasher,
    GlyphSharing,
    SharedGlyphStore
} from "../support/share-glyph-set/glyph-hasher";

export function shareGlyphSet<GS extends Ot.GlyphStore>(
    fonts: Ot.Font<GS>[],
    gsf: Ot.GlyphStoreFactory<GS>
) {
    const session = new DesignUnifierSession();
    const sharedGs = new SharedGlyphStore();

    for (let fid = 0; fid < fonts.length; fid++) {
        const inputFont = fonts[fid];
        if (fid > 0) unifyDesignSpacesImpl(session, fonts[0], inputFont);
        unifyGlyphByHash(session, sharedGs, fid, inputFont);
    }

    for (let fid = 0; fid < fonts.length; fid++) {
        fonts[fid].glyphs = gsf.createStoreFromList(sharedGs.decideOrder());
    }
}

function unifyGlyphByHash(
    session: DesignUnifierSession,
    sharedGs: SharedGlyphStore,
    id: number,
    font: Ot.Font
) {
    const hasher = new GlyphHasher(session);
    const gOrd = font.glyphs.decideOrder();
    const sharing = new GlyphSharing(sharedGs);
    for (let gid = 0; gid < gOrd.length; gid++) {
        const g = gOrd.at(gid);
        const hash = hasher.compute(g);
        sharing.put(g, hash, id, gid);
    }

    Rectify.rectifyFontGlyphReferences(sharing, font);
}
