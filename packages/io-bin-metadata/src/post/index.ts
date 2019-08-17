import { BinaryView, Frag, Write } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Post } from "@ot-builder/ft-metadata";
import { Data } from "@ot-builder/prelude";
import { F16D16 } from "@ot-builder/primitive";
import { OV } from "@ot-builder/variance";

import macGlyphNames from "./mac-glyph-names";

const coMacGlyphNames: Map<string, number> = (function() {
    const m = new Map<string, number>();
    for (let nid = 0; nid < macGlyphNames.length; nid++) {
        m.set(macGlyphNames[nid], nid);
    }
    return m;
})();

class PostFormat1Names implements Data.Naming.Source<number> {
    public getName(gid: number) {
        return macGlyphNames[gid];
    }
}

class PostFormat2Names implements Data.Naming.Source<number> {
    constructor(private mapping: ReadonlyMap<number, string>) {}
    public getName(gid: number) {
        return this.mapping.get(gid) || "";
    }
}

const PascalString = {
    read(bp: BinaryView) {
        const pascalStringLength = bp.uint8();
        const buf = bp.bytes(pascalStringLength);
        return buf.toString("utf-8");
    },
    write(b: Frag, name: string) {
        const buf = Buffer.from(name, "utf-8");
        b.uint8(buf.length);
        b.bytes(buf);
    }
};

function nameGlyphPostVersion2(bp: BinaryView) {
    const numGlyphs = bp.uint16();
    let glyphNameIDList = [];
    let extraGlyphNameMap = new Map<number, string>();
    let maxNewGlyphNameID = -1;
    for (let gid = 0; gid < numGlyphs; gid++) {
        glyphNameIDList[gid] = bp.uint16();
        if (glyphNameIDList[gid] >= macGlyphNames.length) {
            const newGlyphID = glyphNameIDList[gid] - macGlyphNames.length;
            if (newGlyphID > maxNewGlyphNameID) maxNewGlyphNameID = newGlyphID;
        }
    }
    if (maxNewGlyphNameID >= 0) {
        for (let id = 0; id <= maxNewGlyphNameID; id++) {
            const name = bp.next(PascalString);
            extraGlyphNameMap.set(id, name);
        }
    }

    let glyphNames = new Map<number, string>();

    for (let gid = 0; gid < numGlyphs; gid++) {
        const nameID = glyphNameIDList[gid];
        if (nameID < macGlyphNames.length) {
            glyphNames.set(gid, macGlyphNames[nameID]);
        } else {
            const ngn = extraGlyphNameMap.get(nameID - macGlyphNames.length);
            if (ngn) glyphNames.set(gid, ngn);
        }
    }
    return new PostFormat2Names(glyphNames);
}

export const PostAndNameIo = {
    read(view: BinaryView) {
        const table = new Post.Table();
        table.majorVersion = view.uint16();
        table.minorVersion = view.uint16();
        table.italicAngle = view.next(F16D16);
        table.underlinePosition = view.int16();
        table.underlineThickness = view.int16();
        table.isFixedPitch = !!view.uint32();
        table.minMemType42 = view.uint32();
        table.maxMemType42 = view.uint32();
        table.minMemType1 = view.uint32();
        table.maxMemType1 = view.uint32();

        let naming: Data.Maybe<Data.Naming.Source<number>> = null;
        if (table.majorVersion === 1 && table.minorVersion === 0) {
            naming = new PostFormat1Names();
        } else if (table.majorVersion === 2 && table.minorVersion === 0) {
            naming = nameGlyphPostVersion2(view);
        }
        return { post: table, naming };
    },
    write(
        frag: Frag,
        post: Post.Table,
        glyphCount?: Data.Maybe<number>,
        nameSource?: Data.Maybe<Data.Naming.Source<number>>,
        keepMemorySettings?: Data.Maybe<boolean>
    ) {
        frag.uint16(post.majorVersion);
        frag.uint16(post.minorVersion);
        frag.push(F16D16, post.italicAngle);
        frag.int16(OV.originOf(post.underlinePosition));
        frag.int16(OV.originOf(post.underlineThickness));
        frag.uint32(post.isFixedPitch ? 1 : 0);
        if (keepMemorySettings) {
            frag.uint32(post.minMemType42);
            frag.uint32(post.maxMemType42);
            frag.uint32(post.minMemType1);
            frag.uint32(post.maxMemType1);
        } else {
            frag.uint32(0);
            frag.uint32(0);
            frag.uint32(0);
            frag.uint32(0);
        }
        if (post.majorVersion === 2 && post.minorVersion === 0 && glyphCount && nameSource) {
            frag.push(PostVersion2NameList, glyphCount, nameSource);
        }
    }
};

const PostVersion2NameList = Write(
    (frag: Frag, glyphCount: number, nameSource: Data.Naming.Source<number>) => {
        frag.uint16(glyphCount);
        // Collect "new" glyph names
        let glyphNameMap = new Map<string, number>(coMacGlyphNames);
        let newGlyphNames: string[] = [];
        // glyphNameIndex
        for (let gid = 0; gid < glyphCount; gid++) {
            const glyphName = nameSource.getName(gid);
            if (!glyphName) throw Errors.Post.MissingName(gid);
            let nid = glyphNameMap.get(glyphName);
            if (nid === undefined) {
                nid = glyphNameMap.size;
                glyphNameMap.set(glyphName, nid);
                if (nid >= macGlyphNames.length) {
                    newGlyphNames[nid - macGlyphNames.length] = glyphName;
                }
            }
            frag.uint16(nid);
        }
        // names
        for (const name of newGlyphNames) frag.push(PascalString, name);
    }
);
