import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Meta } from "@ot-builder/ft-name";

import { MetaTableIo } from "./index";

test("Meta table read-write roundtrip", () => {
    const mockTable = new Meta.Table();
    mockTable.data.push([`dlng`, `en-US`]);
    mockTable.data.push([`TEST`, `This is some test`]);

    const bufMeta = Frag.packFrom(MetaTableIo, mockTable);
    const meta = new BinaryView(bufMeta).next(MetaTableIo);

    expect(new Map(meta.data).get(`dlng`)).toBe("en-US");
    expect((new Map(meta.data).get(`TEST`)! as Buffer).toString("utf-8")).toBe(
        "This is some test"
    );
});
