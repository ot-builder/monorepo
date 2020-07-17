import { CliProc, Ot } from "ot-builder";

import { decideGlyphClass, GlyphClass } from "./glyph-class";

class SparseSharingEntry {
    constructor(
        public readonly glyph: Ot.Glyph,
        public glyphClass: GlyphClass,
        public usages: number
    ) {}
}

export class SparseGlyphSharer extends CliProc.GlyphSharer<Ot.ListGlyphStore> {
    private createPadGlyph(name: string, commonWidth: number, commonHeight: number) {
        const g = new Ot.Glyph();
        g.name = name;
        g.geometry = new Ot.Glyph.ContourSet([[{ x: 0, y: 0, kind: Ot.Glyph.PointType.Corner }]]);
        g.horizontal = { start: 0, end: commonWidth };
        g.vertical = { start: commonHeight, end: 0 };
        return g;
    }

    private getSparseSharingMap(commonWidth: number, commonHeight: number) {
        const speMap = new Map<Ot.Glyph, SparseSharingEntry>();
        for (const font of this.fonts) {
            for (const [gid, g] of font.glyphs.decideOrder().entries()) {
                if (speMap.has(g)) {
                    speMap.get(g)!.usages++;
                } else {
                    const gk = decideGlyphClass(g, gid, commonWidth, commonHeight);
                    speMap.set(g, new SparseSharingEntry(g, gk, 1));
                }
            }
        }
        return speMap;
    }

    private padSparseSharingList(commonWidth: number, commonHeight: number) {
        const speMap = this.getSparseSharingMap(commonWidth, commonHeight);
        const speList = Array.from(speMap.values());
        const allSharedEntries: SparseSharingEntry[] = [];
        for (const entry of speList) {
            const isSimple =
                entry.glyphClass & GlyphClass.Simple &&
                (entry.glyphClass & GlyphClass.KindMask) === GlyphClass.Normal;
            const isSharable = entry.usages === this.fonts.length;
            if (isSimple && isSharable) allSharedEntries.push(entry);
        }

        // The particular glyph after all spaces must be a simple all-shared glyph
        // Insert a pad glyph if necessary
        let postSpace = allSharedEntries[0] || null;
        if (!postSpace) {
            postSpace = new SparseSharingEntry(
                this.createPadGlyph(".otb-ttc-bundle/post-space", commonWidth, commonHeight),
                GlyphClass.PostSpacePad,
                this.fonts.length
            );
            speList.push(postSpace);
        }
        postSpace.glyphClass = GlyphClass.PostSpacePad;

        // The particular glyph at very end must be a simple all-shared glyph
        // Insert a pad glyph if necessary
        const veryLast: null | SparseSharingEntry = allSharedEntries[allSharedEntries.length - 1];
        if (veryLast && veryLast !== postSpace) veryLast.glyphClass = GlyphClass.VeryLast;

        speList.sort((a, b) => a.glyphClass - b.glyphClass);

        return { speList, postSpace };
    }

    private getGidMap(speList: SparseSharingEntry[]) {
        const sharedGlyphMap = new Map<Ot.Glyph, number>();
        for (let gid = 0; gid < speList.length; gid++) sharedGlyphMap.set(speList[gid].glyph, gid);
        return sharedGlyphMap;
    }

    public sparseSharing(commonWidth: number, commonHeight: number) {
        const { speList, postSpace } = this.padSparseSharingList(commonWidth, commonHeight);

        const sharedGlyphMap = this.getGidMap(speList);

        const sharing: number[][] = [];
        for (let fid = 0; fid < this.fonts.length; fid++) {
            sharing[fid] = [];
            const fontGlyphSet = new Set(this.fonts[fid].glyphs.decideOrder());
            const fontGlyphList: Ot.Glyph[] = [];
            for (const entry of speList) {
                if (!fontGlyphSet.has(entry.glyph) && entry !== postSpace) continue;
                fontGlyphList.push(entry.glyph);
                sharing[fid].push(sharedGlyphMap.get(entry.glyph)!);
            }
            this.fonts[fid].glyphs = Ot.ListGlyphStoreFactory.createStoreFromList(fontGlyphList);
        }
        return sharing;
    }
}
