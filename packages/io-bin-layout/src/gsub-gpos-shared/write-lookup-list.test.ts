import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Gsub } from "@ot-builder/ft-layout";

import { LookupReader, LookupReaderFactory, LookupWriter, LookupWriterFactory } from "./general";
import { CReadLookupList } from "./read-lookup-list";
import { WriteLookupList } from "./write-lookup-list";

class MockLookup implements Gsub.Lookup {
    public rightToLeft = false;
    public ignoreGlyphs = null;
    constructor(public count: number) {}
    public apply<E>(alg: Gsub.LookupAlg<E>): E {
        throw new Error("not implemented");
    }
}

class MockLookupReader implements LookupReader<Gsub.Lookup, MockLookup> {
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
class MockLookupReaderFactory implements LookupReaderFactory<Gsub.Lookup> {
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
class MockLookupWriter implements LookupWriter<Gsub.Lookup, MockLookup> {
    public canBeUsed(lookup: Gsub.Lookup): lookup is MockLookup {
        return lookup instanceof MockLookup;
    }
    public getLookupType() {
        return 1;
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
