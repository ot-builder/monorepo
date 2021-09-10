import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Gsub } from "@ot-builder/ot-layout";

import { LayoutCfg } from "../cfg";
import {
    LookupReader,
    LookupReaderFactory,
    LookupWriter,
    LookupWriterFactory
} from "../gsub-gpos-shared/general";
import { CGsubGposTable, TableReadContext, TableWriteContext } from "../gsub-gpos-shared/table";
import { GsubChainingReader, GsubContextualReader } from "../lookups/contextual-read";
import { GsubChainingContextualWriter } from "../lookups/contextual-write";
import { GsubLigatureReader, GsubLigatureWriter } from "../lookups/gsub-ligature";
import {
    GsubAlternateReader,
    GsubAlternateWriter,
    GsubMultiReader,
    GsubMultiWriter
} from "../lookups/gsub-multi-alternate";
import { GsubReverseReader, GsubReverseWriter } from "../lookups/gsub-reverse";
import { GsubSingleReader, GsubSingleWriter } from "../lookups/gsub-single";

const gsub: LookupReaderFactory<Gsub.Lookup> & LookupWriterFactory<Gsub.Lookup> = {
    extendedFormat: 7,
    isExtendedFormat: x => x === 7,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createReader(x: number): LookupReader<Gsub.Lookup, any> {
        switch (x) {
            case 1:
                return new GsubSingleReader();
            case 2:
                return new GsubMultiReader();
            case 3:
                return new GsubAlternateReader();
            case 4:
                return new GsubLigatureReader();
            case 5:
                return new GsubContextualReader();
            case 6:
                return new GsubChainingReader();
            case 8:
                return new GsubReverseReader();
            default:
                throw Errors.FormatNotSupported(`GSUB lookup`, x);
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    *writers(): IterableIterator<LookupWriter<Gsub.Lookup, any>> {
        yield new GsubSingleWriter();
        yield new GsubMultiWriter();
        yield new GsubAlternateWriter();
        yield new GsubLigatureWriter();
        yield new GsubChainingContextualWriter();
        yield new GsubReverseWriter();
    },
    queryDependencies(lookup: Gsub.Lookup) {
        if (lookup.type !== Gsub.LookupType.Chaining) return [];
        const sink: Gsub.Lookup[] = [];
        for (const rule of lookup.rules) for (const app of rule.applications) sink.push(app.apply);
        return sink;
    }
};

export const GsubTableIo = {
    read(view: BinaryView, cfg: LayoutCfg, trc: TableReadContext) {
        const o = view.next(new CGsubGposTable<Gsub.Lookup>(), cfg, gsub, trc);
        return new Gsub.Table(o.scripts, o.features, o.lookups, o.featureVariations);
    },
    write(frag: Frag, table: Gsub.Table, cfg: LayoutCfg, twc: TableWriteContext) {
        return frag.push(new CGsubGposTable<Gsub.Lookup>(), table, cfg, gsub, twc);
    }
};
