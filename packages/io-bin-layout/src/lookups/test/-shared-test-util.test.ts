import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { Disorder } from "@ot-builder/test-util";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { LookupReader, LookupWriter, SubtableWriteContext } from "../../gsub-gpos-shared/general";
import { EmptyStat } from "../../stat";

export interface LookupRoundTripConfig<L, C extends L> {
    gOrd: Data.Order<OtGlyph>;
    reader: (type: number) => LookupReader<L, C>;
    writer: () => LookupWriter<L, C>;
    lOrd?: Data.Order<L>;
    trick?: number;
    validate(gOrd: Data.Order<OtGlyph>, lOrd: Data.Order<L>, a: C, b: C): void;
    variation?: Data.Maybe<TestVariation>;
}

export function LookupRoundTripTest<L, C extends L>(
    expected: C,
    cfg: LookupRoundTripConfig<L, C>
) {
    const lOrd = cfg.lOrd || ImpLib.Order.fromList(`Lookups`, []);
    const writer = cfg.writer();
    const swc: SubtableWriteContext<L> = {
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
                ImpLib.Order.fromList("Axes", cfg.variation.designSpace)
            )
        );
        ivsR = new BinaryView(bufIvs).next(
            ReadTimeIVS,
            ImpLib.Order.fromList("Axes", cfg.variation.designSpace)
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

export function TuGlyphSet<G>(gOrd: Data.Order<G>, ...ids: number[]) {
    return Disorder.shuffleSet(new Set(ids.map(gid => gOrd.at(gid))));
}

export type TestVariation = { designSpace: OtVar.Dim[]; ivs: WriteTimeIVS };
export function SetupVariation() {
    const ds: OtVar.Dim[] = [
        { tag: "wght", min: 0, default: 400, max: 1000 },
        { tag: "wdth", min: 0, default: 100, max: 200 }
    ];
    const [wght, wdth] = ds;
    const masters = {
        bold: OtVar.Create.Master([{ dim: wght, min: 0, peak: 1, max: 1 }]),
        wide: OtVar.Create.Master([{ dim: wdth, min: 0, peak: 1, max: 1 }])
    };
    const ms = OtVar.Create.MasterSet();
    const ivs = WriteTimeIVS.create(ms);
    const cr = OtVar.Create.ValueFactory(ms);
    const create = (...xs: (number | [OtVar.Master, number])[]) => cr.make(...xs);
    return { designSpace: ds, masters, ivs, masterSet: ms, create };
}

// Jest needs this :(
test("Dummy for test util", () => {});
