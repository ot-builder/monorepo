import { BinaryView, BufferWriter, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Name } from "@ot-builder/ft-name";
import * as iconv from "iconv-lite";

// TODO: add more encodings
function SupportedEncoding(platformID: number, encodingID: number): null | string {
    if (platformID === 3 && encodingID === 1) return `utf16-be`;
    if (platformID === 3 && encodingID === 10) return `utf32-be`;
    return null;
}

class NameOffsetAllocator {
    private bw = new BufferWriter();
    private offsetMap: Map<string, number> = new Map();
    public add(buf: Buffer) {
        const hash = buf.toString("base64");
        const existing = this.offsetMap.get(hash);
        if (existing !== undefined) return existing;
        const offset = this.bw.currentOffset;
        this.offsetMap.set(hash, offset);
        this.bw.bytes(buf);
        return offset;
    }
    public getBuffer() {
        return this.bw.toBuffer();
    }
}

const NameRecord = {
    read(view: BinaryView, strings: BinaryView): Name.Record {
        const platformID = view.uint16();
        const encodingID = view.uint16();
        const languageID = view.uint16();
        const nameID = view.uint16();
        const length = view.uint16();
        const offset = view.uint16();
        const buf = Buffer.from(strings.lift(offset).bytes(length));
        const encName = SupportedEncoding(platformID, encodingID);
        const value = encName ? iconv.decode(buf, encName) : buf;
        return { platformID, encodingID, languageID, nameID, value };
    },
    write(frag: Frag, rec: Name.Record, alloc: NameOffsetAllocator) {
        frag.uint16(rec.platformID);
        frag.uint16(rec.encodingID);
        frag.uint16(rec.languageID);
        frag.uint16(rec.nameID);
        let buf: null | Buffer = null;
        if (typeof rec.value === "string") {
            let enc = SupportedEncoding(rec.platformID, rec.encodingID);
            if (enc) buf = iconv.encode(rec.value, enc);
        } else {
            buf = rec.value;
        }
        if (!buf) throw Errors.Name.EncodingNotSupported(rec.platformID, rec.encodingID);
        frag.uint16(buf.byteLength);
        frag.uint16(alloc.add(buf));
    }
};

const LangTagRecord = {
    read(view: BinaryView, strings: BinaryView) {
        const length = view.uint16();
        const offset = view.uint16();
        const buf = Buffer.from(strings.lift(offset).bytes(length));
        return iconv.decode(buf, `utf16-be`);
    },
    write(frag: Frag, ltr: string, alloc: NameOffsetAllocator) {
        let buf = iconv.encode(ltr, `utf16-be`);
        frag.uint16(buf.byteLength);
        frag.uint16(alloc.add(buf));
    }
};

export const NameIo = {
    read(view: BinaryView) {
        const format = view.uint16();
        Assert.FormatSupported("NameTable", format, 0, 1);
        const count = view.uint16();
        const strings = view.ptr16();

        const table = new Name.Table();
        for (let rid = 0; rid < count; rid++) {
            table.records.push(view.next(NameRecord, strings));
        }

        if (format >= 1) {
            table.langTagMap = [];
            const langTagCount = view.uint16();
            for (let lidOffset = 0; lidOffset < langTagCount; lidOffset++) {
                table.langTagMap.push(view.next(LangTagRecord, strings));
            }
        }

        return table;
    },
    write(frag: Frag, table: Name.Table) {
        const format = table.langTagMap && table.langTagMap.length ? 1 : 0;
        const frStrings = new Frag();
        const noa = new NameOffsetAllocator();
        frag.uint16(format);
        frag.uint16(table.records.length);
        frag.ptr16(frStrings);
        for (const rec of table.records) {
            frag.push(NameRecord, rec, noa);
        }
        if (format === 1) {
            if (!table.langTagMap || !table.langTagMap.length) throw Errors.Unreachable();
            frag.uint16(table.langTagMap.length);
            for (const lt of table.langTagMap) frag.push(LangTagRecord, lt, noa);
        }
        noa.add(iconv.encode("\n", "utf-8")); // Ensure that the frStrings will not be empty
        frStrings.bytes(noa.getBuffer());
    }
};
