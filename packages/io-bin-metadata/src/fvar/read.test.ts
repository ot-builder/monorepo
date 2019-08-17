import { BinaryView } from "@ot-builder/bin-util";
import { Fvar } from "@ot-builder/ft-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { FvarIo } from ".";

test("Reading : FVAR", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const fvar = new BinaryView(sfnt.tables.get(Fvar.Tag)!).next(FvarIo);
    expect(fvar.axes.length).toBe(1);
    expect(fvar.axes[0].tag).toBe("wght");
    expect(fvar.instances.length).toBe(6);
    expect(fvar.instances[0].coordinates!.get(fvar.axes[0])).toBe(200);
});
