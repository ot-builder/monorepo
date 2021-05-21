import { OtGlyph, OtGlyphNamer, OtGlyphNamingSource } from "@ot-builder/ot-glyphs";
import * as AglfnData from "aglfn";

const AglfnMap = new Map(AglfnData.map(x => [parseInt(x.unicodeValue, 16), x.glyphName]));

export class OtStandardGlyphNamer implements OtGlyphNamer {
    private existingNames: Set<string> = new Set();
    private avoidCollide(name: string) {
        if (!this.existingNames.has(name)) {
            this.existingNames.add(name);
            return name;
        }

        let suffix = 2;
        for (;;) {
            const amendedName = name + "." + suffix;
            if (!this.existingNames.has(amendedName)) {
                this.existingNames.add(amendedName);
                return name;
            }
            suffix += 1;
        }
    }
    private nameByPost(source: OtGlyphNamingSource, gid: number, glyph: OtGlyph) {
        if (!source.post) return null;
        return source.post.getName(glyph);
    }
    private nameByCff(source: OtGlyphNamingSource, gid: number, glyph: OtGlyph) {
        if (!source.cff) return null;
        return source.cff.getName(glyph);
    }

    private formatHex(code: number) {
        let hex = code.toString(16).toUpperCase();
        while (hex.length < 4) hex = "0" + hex;
        return hex;
    }
    private nameByEncoding(source: OtGlyphNamingSource, gid: number, glyph: OtGlyph) {
        if (!source.encoding) return null;
        const code = source.encoding.getIndex(glyph);
        if (code != null) {
            const aglfnName = AglfnMap.get(code);
            if (aglfnName) return aglfnName;
            return "uni" + this.formatHex(code);
        }

        const variantCode = source.encoding.getVariantIndex(glyph);
        if (variantCode && variantCode.length) {
            return "uni" + variantCode.map(k => this.formatHex(k)).join("_");
        }

        return null;
    }
    private nameByGid(source: OtGlyphNamingSource, gid: number, glyph: OtGlyph) {
        return `.gid${gid}`;
    }
    public nameGlyph(source: OtGlyphNamingSource, gid: number, glyph: OtGlyph) {
        if (gid === 0) return `.notdef`;
        return this.avoidCollide(
            this.nameByPost(source, gid, glyph) ||
                this.nameByCff(source, gid, glyph) ||
                this.nameByEncoding(source, gid, glyph) ||
                this.nameByGid(source, gid, glyph)
        );
    }
}
