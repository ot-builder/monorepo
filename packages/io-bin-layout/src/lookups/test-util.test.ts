import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { LookupReader, LookupWriter, SubtableWriteContext } from "../gsub-gpos-shared/general";
import { EmptyStat } from "../stat";

export interface LookupRoundTripConfig<C extends GsubGpos.Lookup> {
    gOrd: OtGlyphOrder;
    reader: (type: number) => LookupReader<GsubGpos.Lookup, C>;
    writer: () => LookupWriter<GsubGpos.Lookup, C>;
    lOrd?: Data.Order<GsubGpos.Lookup>;
    trick?: number;
    validate(gOrd: OtGlyphOrder, lOrd: Data.Order<GsubGpos.Lookup>, a: C, b: C): void;
    variation?: Data.Maybe<TestVariation>;
}

export function LookupRoundTripTest<C extends GsubGpos.Lookup>(
    expected: C,
    cfg: LookupRoundTripConfig<C>
) {
    const lOrd = cfg.lOrd || Data.Order.fromList(`Lookups`, []);
    const writer = cfg.writer();
    const swc: SubtableWriteContext<GsubGpos.Lookup> = {
        gOrd: cfg.gOrd,
        crossReferences: lOrd,
        trick: cfg.trick || 0,
        ivs: cfg.variation ? cfg.variation.ivs : null,
        stat: new EmptyStat()
    };
    const buffers = writer.createSubtableFragments(expected, swc).map(frag => Frag.pack(frag));

    const lt = writer.getLookupType(expected);

    let ivsR: Data.Maybe<ReadTimeIVS> = null;
    if (cfg.variation) {
        const bufIvs = Frag.pack(
            Frag.from(
                WriteTimeIVS,
                cfg.variation.ivs,
                Data.Order.fromList("Axes", cfg.variation.axes)
            )
        );
        ivsR = new BinaryView(bufIvs).next(
            ReadTimeIVS,
            Data.Order.fromList("Axes", cfg.variation.axes)
        );
    }

    const reader = cfg.reader(lt);
    if (!reader) throw Errors.Unreachable;
    const actual = reader.createLookup();
    for (const buffer of buffers) {
        expect(buffer.byteLength).toBeLessThan(0x10000);
        reader.parseSubtable(new BinaryView(buffer), actual, {
            gOrd: cfg.gOrd,
            crossReferences: lOrd,
            ivs: ivsR
        });
    }
    cfg.validate(cfg.gOrd, lOrd, expected, actual);
}

export function shuffleArray<T>(a: T[]) {
    let itemR: number, temp: T, itemF: number;
    for (itemF = a.length - 1; itemF > 0; itemF--) {
        itemR = Math.floor(Math.random() * (itemF + 1));
        temp = a[itemF];
        a[itemF] = a[itemR];
        a[itemR] = temp;
    }
    return a;
}

export function TuGlyphSet<G>(gOrd: Data.Order<G>, ...ids: number[]) {
    return new Set(ids.map(gid => gOrd.at(gid)));
}

export type TestVariation = { axes: OtVar.Axis[]; ivs: WriteTimeIVS };
export function SetupVariation() {
    const axes: OtVar.Axis[] = [
        { tag: "wght", min: 0, default: 400, max: 1000 },
        { tag: "wdth", min: 0, default: 100, max: 200 }
    ];
    const [wght, wdth] = axes;
    const masters = {
        bold: new OtVar.Master([{ axis: wght, min: 0, peak: 1, max: 1 }]),
        wide: new OtVar.Master([{ axis: wdth, min: 0, peak: 1, max: 1 }])
    };
    const ms = new OtVar.MasterSet();
    const ivs = WriteTimeIVS.create(ms);
    const cr = OtVar.Ops.Creator(ms);
    const create = (...xs: (number | [OtVar.Master, number])[]) => cr.make(...xs);
    return { axes, masters, ivs, masterSet: ms, create };
}

// Jest needs this :(
test("Dummy for test util", () => {});
