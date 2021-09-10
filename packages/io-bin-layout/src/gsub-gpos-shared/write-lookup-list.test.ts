import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { Gsub, GsubGpos } from "@ot-builder/ot-layout";

import { LookupReader, LookupReaderFactory, LookupWriter, LookupWriterFactory } from "./general";
import { CReadLookupList } from "./read-lookup-list";
import { WriteLookupList } from "./write-lookup-list";

const MockLookupType: unique symbol = Symbol();
type MockLookupSymbolType = typeof MockLookupType;
class MockLookup implements GsubGpos.LookupProp {
    public readonly type: MockLookupSymbolType = MockLookupType;
    public rightToLeft = false;
    public ignoreGlyphs = null;
    constructor(public count: number) {}
}

class MockLookupReader implements LookupReader<GsubGpos.LookupProp, MockLookup> {
    public createLookup() {
        return new MockLookup(0);
    }
    public parseSubtable(view: BinaryView, lookup: MockLookup) {
        const count = view.uint32();
        for (let ix = 1; ix < count; ix++) {
            view.uint32();
        }
        lookup.count = count;
    }
}
class MockLookupReaderFactory implements LookupReaderFactory<GsubGpos.LookupProp> {
    public createReader(format: number) {
        switch (format) {
            case 1:
                return new MockLookupReader();
            default:
                throw Errors.Unreachable();
        }
    }
    public isExtendedFormat(format: number) {
        return format === 0x10;
    }
}
class MockLookupWriter implements LookupWriter<GsubGpos.LookupProp, MockLookup> {
    public canBeUsed(lookup: GsubGpos.LookupProp): lookup is MockLookup {
        return lookup instanceof MockLookup;
    }
    public getLookupType() {
        return 1;
    }
    public getLookupTypeSymbol() {
        return MockLookupType;
    }
    public createSubtableFragments(lookup: MockLookup) {
        const frag = new Frag();
        for (let index = 0; index < lookup.count; index++) frag.uint32(lookup.count);
        return [frag];
    }
}
class MockLookupWriterFactory implements LookupWriterFactory<Gsub.Lookup> {
    public extendedFormat = 0x10;
    public writers = () => [new MockLookupWriter()];
    public queryDependencies() {
        return [];
    }
}

describe("Lookup list writer", () => {
    function testLookupListRoundTrip(sizes: number[]) {
        const ls = sizes.map(s => new MockLookup(s));
        const lwf = new MockLookupWriterFactory();
        const gOrd = OtListGlyphStoreFactory.createStoreFromSize(0x1000).decideOrder();
        const bufLookupList = Frag.pack(Frag.from(WriteLookupList, ls, lwf, { gOrd }));

        const lrf = new MockLookupReaderFactory();
        const ls1 = new BinaryView(bufLookupList).next(new CReadLookupList<Gsub.Lookup>(), lrf, {
            gOrd
        });
        expect(ls1).toEqual(ls);
    }

    test("Should work", () => {
        testLookupListRoundTrip([1, 2, 4, 8, 16, 32, 64]);
        testLookupListRoundTrip([0x20000, 0x20001, 0x20002]);
        testLookupListRoundTrip([0x1, 0x2, 0x3, 0x10, 0x100, 0xffff]);
    });
});
