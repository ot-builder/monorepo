import { Data, Ot, Rectify } from "ot-builder";

import { StdPointAttachRectifier } from "../point-rectifier";

import { DesignSpaceUnifier, DesignUnifierSession } from "./design-unifier";
import { GlyphHasher, GlyphSharing, SharedGlyphStore } from "./glyph-hasher";

export class FontProcessor {
    private session = new DesignUnifierSession();
    private sharedGs = new SharedGlyphStore();
    public fonts: Ot.Font<SharedGlyphStore>[] = [];

    public addFont(font: Ot.Font) {
        const id = this.fonts.length;
        if (id > 0) {
            this.unifyDesignSpace(font);
        }
        this.fonts[id] = this.unifyGlyphByHash(id, font);
    }

    private unifyDesignSpace(font: Ot.Font) {
        const fvar0 = this.fonts[0].fvar;
        const fvarI = font.fvar;
        if (fvar0 && fvarI) {
            const du = new DesignSpaceUnifier(this.session, fvar0, fvarI);
            Rectify.rectifyFontCoords(du, du, new StdPointAttachRectifier(), font);
        } else if (fvarI) {
            throw new Error("Cannot unify variable font with static font");
        }
    }

    private unifyGlyphByHash(id: number, font: Ot.Font): Ot.Font<SharedGlyphStore> {
        const hasher = new GlyphHasher(this.session);
        const gOrd = font.glyphs.decideOrder();
        const sharing = new GlyphSharing(this.sharedGs);
        for (let gid = 0; gid < gOrd.length; gid++) {
            const g = gOrd.at(gid);
            const hash = hasher.compute(g);
            sharing.put(g, hash, id, gid);
        }

        Rectify.rectifyFontGlyphs(sharing, font, Ot.ListGlyphStoreFactory);
        return { ...font, glyphs: this.sharedGs };
    }
}
