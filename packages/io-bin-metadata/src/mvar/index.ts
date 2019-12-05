import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { MetricHead, Os2, OtFontMetadata, Post } from "@ot-builder/ft-metadata";
import { Gasp } from "@ot-builder/ft-metadata/lib/gasp";
import { Access, Data } from "@ot-builder/prelude";
import { Tag, UInt16 } from "@ot-builder/primitive";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

export const MvarTag = "MVAR";

class MvarPropAccess<Table, K extends keyof Table> implements Access<Table[K]> {
    constructor(private table: Table, private key: K) {}
    public get() {
        return this.table[this.key];
    }
    public set(x: Table[K]) {
        this.table[this.key] = x;
    }
}

interface MvarLensSource {
    entries(): Iterable<[string, Access<OtVar.Value>]>;
}

class HheaMvarLensSource implements MvarLensSource {
    constructor(private hhea: MetricHead.Table) {}
    public *entries(): IterableIterator<[string, Access<OtVar.Value>]> {
        // yield ["????", new MvarPropAccess(this.hhea, "ascender")];
        // yield ["????", new MvarPropAccess(this.hhea, "descender")];
        // yield ["????", new MvarPropAccess(this.hhea, "lineGap")];
        yield ["hcrs", new MvarPropAccess(this.hhea, "caretSlopeRise")];
        yield ["hcrn", new MvarPropAccess(this.hhea, "caretSlopeRun")];
        yield ["hcof", new MvarPropAccess(this.hhea, "caretSlopeRun")];
    }
}
class VheaMvarLensSource implements MvarLensSource {
    constructor(private vhea: MetricHead.Table) {}
    public *entries(): IterableIterator<[string, Access<OtVar.Value>]> {
        yield ["vasc", new MvarPropAccess(this.vhea, "ascender")];
        yield ["vdsc", new MvarPropAccess(this.vhea, "descender")];
        yield ["vlgp", new MvarPropAccess(this.vhea, "lineGap")];
        yield ["vcrs", new MvarPropAccess(this.vhea, "caretSlopeRise")];
        yield ["vcrn", new MvarPropAccess(this.vhea, "caretSlopeRun")];
        yield ["vcof", new MvarPropAccess(this.vhea, "caretOffset")];
    }
}
class PostMvarLensSource implements MvarLensSource {
    constructor(private post: Post.Table) {}
    public *entries(): IterableIterator<[string, Access<OtVar.Value>]> {
        yield ["unds", new MvarPropAccess(this.post, "underlineThickness")];
        yield ["undo", new MvarPropAccess(this.post, "underlinePosition")];
    }
}
class Os2MvarLensSource implements MvarLensSource {
    constructor(private os2: Os2.Table) {}
    public *entries(): IterableIterator<[string, Access<OtVar.Value>]> {
        yield ["hasc", new MvarPropAccess(this.os2, "sTypoAscender")];
        yield ["hdsc", new MvarPropAccess(this.os2, "sTypoDescender")];
        yield ["hlgp", new MvarPropAccess(this.os2, "sTypoLineGap")];
        yield ["hcla", new MvarPropAccess(this.os2, "usWinAscent")];
        yield ["hcld", new MvarPropAccess(this.os2, "usWinDescent")];
        yield ["xhgt", new MvarPropAccess(this.os2, "sxHeight")];
        yield ["cpht", new MvarPropAccess(this.os2, "sCapHeight")];
        yield ["sbxs", new MvarPropAccess(this.os2, "ySubscriptXSize")];
        yield ["sbys", new MvarPropAccess(this.os2, "ySubscriptYSize")];
        yield ["sbxo", new MvarPropAccess(this.os2, "ySubscriptXOffset")];
        yield ["sbyo", new MvarPropAccess(this.os2, "ySubscriptYOffset")];
        yield ["spxs", new MvarPropAccess(this.os2, "ySuperscriptXSize")];
        yield ["spys", new MvarPropAccess(this.os2, "ySuperscriptYSize")];
        yield ["spxo", new MvarPropAccess(this.os2, "ySuperscriptXOffset")];
        yield ["spyo", new MvarPropAccess(this.os2, "ySuperscriptYOffset")];
        yield ["strs", new MvarPropAccess(this.os2, "yStrikeoutSize")];
        yield ["stro", new MvarPropAccess(this.os2, "yStrikeoutPosition")];
    }
}
class GaspMvarLensSource implements MvarLensSource {
    constructor(private gasp: Gasp.Table) {}
    public *entries(): IterableIterator<[string, Access<OtVar.Value>]> {
        for (let ri = 0; ri < 10 && ri < this.gasp.ranges.length; ri++) {
            yield [`gsp${ri}`, new MvarPropAccess(this.gasp.ranges[ri], "maxPPEM")];
        }
    }
}

function* lensSourcesFromMd(md: OtFontMetadata): IterableIterator<[string, Access<OtVar.Value>]> {
    if (md.hhea) yield* new HheaMvarLensSource(md.hhea).entries();
    if (md.vhea) yield* new VheaMvarLensSource(md.vhea).entries();
    if (md.post) yield* new PostMvarLensSource(md.post).entries();
    if (md.os2) yield* new Os2MvarLensSource(md.os2).entries();
    if (md.gasp) yield* new GaspMvarLensSource(md.gasp).entries();
}

export const MvarTableIo = {
    read(view: BinaryView, axes: Data.Order<OtVar.Axis>, md: OtFontMetadata) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("MvarTable", majorVersion, minorVersion, [1, 0]);
        const reserved = view.uint16();

        const valueRecordSize = view.uint16();
        Assert.SizeMatch("MvarTable::valueRecordSize", valueRecordSize, Tag.size + UInt16.size * 2);

        const valueRecordCount = view.uint16();
        const pIVS = view.ptr16Nullable();
        if (!pIVS) return;

        const ivs = pIVS.next(ReadTimeIVS, axes);
        const lenses = new Map(lensSourcesFromMd(md));
        for (let rid = 0; rid < valueRecordCount; rid++) {
            const tag = view.next(Tag);
            const deltaSetOuterIndex = view.uint16();
            const deltaSetInnerIndex = view.uint16();
            const value = ivs.queryValue(deltaSetOuterIndex, deltaSetInnerIndex);
            const lens = lenses.get(tag);
            if (lens) {
                const current = lens.get();
                lens.set(OtVar.Ops.add(current, value));
            }
        }
    },
    write(frag: Frag, axes: Data.Order<OtVar.Axis>, md: OtFontMetadata, afEmpty?: Access<boolean>) {
        const ivs = WriteTimeIVS.create(OtVar.Create.MasterSet());
        const lenses = new Map(lensSourcesFromMd(md));
        let rec: [string, number, number][] = [];
        for (const [tag, lens] of lenses) {
            const r = ivs.valueToInnerOuterID(lens.get());
            if (r) rec.push([tag, r.outer, r.inner]);
        }

        frag.uint16(1)
            .uint16(0)
            .uint16(0)
            .uint16(Tag.size + UInt16.size * 2)
            .uint16(rec.length);
        if (rec.length) {
            frag.ptr16(Frag.solidFrom(WriteTimeIVS, ivs, axes));
            for (const [tag, outer, inner] of rec) {
                frag.push(Tag, tag)
                    .uint16(outer)
                    .uint16(inner);
            }
        } else {
            if (afEmpty) afEmpty.set(true);
            frag.uint16(0);
        }
    }
};
