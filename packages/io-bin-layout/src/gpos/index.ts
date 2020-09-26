import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Gpos } from "@ot-builder/ot-layout";

import { LayoutCfg } from "../cfg";
import {
    LookupReader,
    LookupReaderFactory,
    LookupWriter,
    LookupWriterFactory
} from "../gsub-gpos-shared/general";
import { CGsubGposTable, TableReadContext, TableWriteContext } from "../gsub-gpos-shared/table";
import { GposChainingReader, GposContextualReader } from "../lookups/contextual-read";
import { GposChainingContextualWriter } from "../lookups/contextual-write";
import { GposCursiveReader, GposCursiveWriter } from "../lookups/gpos-cursive";
import {
    GposMarkToBaseReader,
    GposMarkToLigatureReader,
    GposMarkToMarkReader
} from "../lookups/gpos-mark-read";
import {
    GposMarkToBaseWriter,
    GposMarkToLigatureWriter,
    GposMarkToMarkWriter
} from "../lookups/gpos-mark-write";
import { GposPairReader } from "../lookups/gpos-pair-read";
import { GposPairWriter } from "../lookups/gpos-pair-write";
import { GposSingleReader, GposSingleWriter } from "../lookups/gpos-single";

const gpos: LookupReaderFactory<Gpos.Lookup> & LookupWriterFactory<Gpos.Lookup> = {
    extendedFormat: 9,
    isExtendedFormat: x => x === 9,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createReader(x: number): LookupReader<Gpos.Lookup, any> {
        switch (x) {
            case 1:
                return new GposSingleReader();
            case 2:
                return new GposPairReader();
            case 3:
                return new GposCursiveReader();
            case 4:
                return new GposMarkToBaseReader();
            case 5:
                return new GposMarkToLigatureReader();
            case 6:
                return new GposMarkToMarkReader();
            case 7:
                return new GposContextualReader();
            case 8:
                return new GposChainingReader();
            default:
                throw Errors.FormatNotSupported(`GSUB lookup`, x);
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    *writers(): IterableIterator<LookupWriter<Gpos.Lookup, any>> {
        yield new GposSingleWriter();
        yield new GposPairWriter();
        yield new GposCursiveWriter();
        yield new GposMarkToBaseWriter();
        yield new GposMarkToLigatureWriter();
        yield new GposMarkToMarkWriter();
        yield new GposChainingContextualWriter();
    }
};

export const GposTableIo = {
    read(view: BinaryView, cfg: LayoutCfg, trc: TableReadContext) {
        const o = view.next(new CGsubGposTable<Gpos.Lookup>(), cfg, gpos, trc);
        return new Gpos.Table(o.scripts, o.features, o.lookups, o.featureVariations);
    },
    write(frag: Frag, table: Gpos.Table, cfg: LayoutCfg, twc: TableWriteContext) {
        return frag.push(new CGsubGposTable<Gpos.Lookup>(), table, cfg, gpos, twc);
    }
};
