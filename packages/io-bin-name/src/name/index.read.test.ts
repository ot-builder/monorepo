import { BinaryView } from "@ot-builder/bin-util";
import { readSfntBuf } from "@ot-builder/io-bin-sfnt";
import { Name } from "@ot-builder/ot-name";
import { TestFont } from "@ot-builder/test-util";

import { NameIo } from "./index";

test("Reading : name", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = readSfntBuf(bufFont);
    const name = new BinaryView(sfnt.tables.get(Name.Tag)!).next(NameIo);
    for (const r of name.records) {
        if (r.platformID === 3 && r.encodingID === 1 && r.languageID === 1033 && r.nameID === 1) {
            expect(r.value).toBe(`Source Serif Variable`);
        }
        if (
            r.platformID === 3 &&
            r.encodingID === 1 &&
            r.languageID === 1033 &&
            r.nameID === 270
        ) {
            expect(r.value).toBe(`SourceSerifRoman-Black`);
        }
    }
});
