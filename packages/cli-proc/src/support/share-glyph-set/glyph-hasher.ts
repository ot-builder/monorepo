import * as Crypto from "crypto";

import * as Ot from "@ot-builder/ot";
import * as Rectify from "@ot-builder/rectify";

import { DesignUnifierSession } from "../design-unifier";
import { ValueProcessor } from "../design-unifier/value-process";

import { Hasher, HashRep } from "./hash-rep";

class SharedGlyphProp {
    constructor(
        public readonly glyph: Ot.Glyph,
        public readonly fid: number,
        public readonly priority: number
    ) {}
    public compare(b: SharedGlyphProp) {
        return this.fid - b.fid || this.priority - b.priority;
    }
}

export class SharedGlyphStore implements Ot.GlyphStore {
    public mapping: Map<string, SharedGlyphProp> = new Map();
    public decideOrder() {
        return Ot.ListGlyphStoreFactory.createStoreFromList(
            Array.from(this.mapping.values())
                .sort((a, b) => a.compare(b))
                .map(g => g.glyph)
        ).decideOrder();
    }
}

export class GlyphSharingRectifier implements Rectify.GlyphReferenceRectifier {
    private rankMap = new Map<string, number>();
    private mapping = new Map<Ot.Glyph, Ot.Glyph>();

    constructor(public readonly gs: SharedGlyphStore) {}

    private amendHashByRank(rawHash: string) {
        const rank = this.rankMap.get(rawHash) || 0;
        this.rankMap.set(rawHash, rank + 1);
        return rawHash + "/" + rank;
    }
    public put(g: Ot.Glyph, rawHash: string, fid: number, priority: number) {
        const hash = this.amendHashByRank(rawHash);
        const existing = this.gs.mapping.get(hash);
        if (existing) {
            this.mapping.set(g, existing.glyph);
            this.mapping.set(existing.glyph, existing.glyph);
            return existing.glyph;
        } else {
            this.gs.mapping.set(hash, new SharedGlyphProp(g, fid, priority));
            this.mapping.set(g, g);
            return g;
        }
    }
    public glyphRef(a: Ot.Glyph) {
        return this.mapping.get(a);
    }
}

export class GlyphHasher {
    constructor(private readonly session: DesignUnifierSession) {}

    private readonly computed: Map<Ot.Glyph, string> = new Map();
    private readonly reverse: Map<string, Ot.Glyph> = new Map();

    public get(glyph: Ot.Glyph) {
        return this.computed.get(glyph);
    }
    public compute(glyph: Ot.Glyph): string {
        const existing = this.computed.get(glyph);
        if (existing) return existing;

        const hash = Crypto.createHash("sha256");
        this.computeImpl(glyph).transfer(hash);
        const result = hash.digest("hex");

        for (let suffix = 0; ; suffix++) {
            const decidedHash = result + "." + suffix;
            if (!this.reverse.has(decidedHash)) {
                this.computed.set(glyph, decidedHash);
                this.reverse.set(decidedHash, glyph);
                return decidedHash;
            }
        }
    }
    public computeImpl(glyph: Ot.Glyph) {
        const geomAlg = new HashGeometry(this, this.session.vp);
        const hintAlg = new HashHinting(this, this.session.vp);

        const hr = new Hasher();
        const hrMetrics = hr.begin();
        hrMetrics.numbers(this.session.vp.toArrayRep(glyph.horizontal.start));
        hrMetrics.numbers(this.session.vp.toArrayRep(glyph.horizontal.end));
        hrMetrics.numbers(this.session.vp.toArrayRep(glyph.vertical.start));
        hrMetrics.numbers(this.session.vp.toArrayRep(glyph.vertical.end));
        hr.include(glyph.geometry ? geomAlg.process(glyph.geometry) : geomAlg.empty());
        hr.include(glyph.hints ? hintAlg.process(glyph.hints) : hintAlg.empty());
        return hr;
    }
}

class HashGeometry {
    constructor(private readonly gh: GlyphHasher, private readonly vp: ValueProcessor) {}
    public process(geom: Ot.Glyph.Geometry): HashRep {
        switch (geom.type) {
            case Ot.Glyph.GeometryType.ContourSet:
                return this.contourSet(geom);
            case Ot.Glyph.GeometryType.GeometryList:
                return this.geometryList(geom.items.map(item => this.process(item)));
            case Ot.Glyph.GeometryType.TtReference:
                return this.ttReference(geom);
        }
    }
    public empty() {
        const hr = new Hasher();
        hr.string("Empty");
        return hr;
    }
    public contourSet(cs: Ot.Glyph.ContourSetProps) {
        const hrCs = new Hasher();
        hrCs.string("ContourSet");
        hrCs.number(cs.contours.length);
        for (const c of cs.contours) {
            const hrC = hrCs.begin();
            hrC.string("Contour");
            hrC.number(c.length);
            for (const z of c) {
                hrC.number(z.kind);
                hrC.numbers(this.vp.toArrayRep(z.x));
                hrC.numbers(this.vp.toArrayRep(z.y));
            }
        }
        return hrCs;
    }
    public ttReference(ref: Ot.Glyph.TtReferenceProps) {
        const hr = new Hasher();
        hr.string("TTReference");
        hr.string(this.gh.compute(ref.to));
        hr.number(ref.transform.xx, ref.transform.xy, ref.transform.yx, ref.transform.yy);
        hr.numbers(this.vp.toArrayRep(ref.transform.dx));
        hr.numbers(this.vp.toArrayRep(ref.transform.dy));
        hr.flag(!!ref.transform.scaledOffset, !!ref.useMyMetrics, !!ref.pointAttachment);
        if (ref.pointAttachment) {
            hr.begin().number(
                ref.pointAttachment.outer.pointIndex,
                ref.pointAttachment.inner.pointIndex
            );
        }
        return hr;
    }
    public geometryList(items: HashRep[]) {
        const hr = new Hasher();
        hr.string("GeometryList");
        hr.number(items.length);
        for (const item of items) hr.include(item);
        return hr;
    }
}

class HashHinting {
    constructor(private readonly gh: GlyphHasher, private readonly vp: ValueProcessor) {}
    public process(geom: Ot.Glyph.Hint): HashRep {
        switch (geom.type) {
            case Ot.Glyph.HintType.TtInstruction:
                return this.ttInstructions(geom);
            case Ot.Glyph.HintType.CffHint:
                return this.cffHint(geom);
        }
    }
    public empty() {
        const hr = new Hasher();
        hr.string("Empty");
        return hr;
    }
    public ttInstructions(tt: Ot.Glyph.TtInstructionProps) {
        const hr = new Hasher();
        hr.string("TTInstructions");
        hr.buffer(tt.instructions);
        return hr;
    }

    public cffHint(hint: Ot.Glyph.CffHintProps) {
        const hr = new Hasher();
        hr.string("CFFHint");
        hr.include(this.stems("HStem", hint.hStems));
        hr.include(this.stems("VStem", hint.vStems));
        hr.include(this.masks("HintMasks", hint.hintMasks));
        hr.include(this.masks("CounterMasks", hint.counterMasks));
        return hr;
    }
    private stems(title: string, stems: ReadonlyArray<Ot.Glyph.CffHintStem>) {
        const hr = new Hasher();
        hr.string(title);
        hr.number(stems.length);
        for (const stem of stems) {
            hr.numbers(this.vp.toArrayRep(stem.start));
            hr.numbers(this.vp.toArrayRep(stem.end));
        }
        return hr;
    }
    private masks(title: string, masks: ReadonlyArray<Ot.Glyph.CffHintMask>) {
        const hr = new Hasher();
        hr.string(title);
        hr.number(masks.length);
        for (const mask of masks) {
            const hrM = hr.begin();
            hrM.number(mask.at.geometry, mask.at.geometry, mask.at.index);
            hrM.include(this.stems("MaskH", [...mask.maskH]));
            hrM.include(this.stems("MaskV", [...mask.maskV]));
        }
        return hr;
    }
}
