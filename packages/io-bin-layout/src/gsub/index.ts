import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Gsub, GsubGpos } from "@ot-builder/ft-layout";

import {
    LookupReader,
    LookupReaderFactory,
    LookupWriter,
    LookupWriterFactory
} from "../gsub-gpos-shared/general";
import { GsubGposTable, TableReadContext, TableWriteContext } from "../gsub-gpos-shared/table";
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

const gsub: LookupReaderFactory<GsubGpos.Lookup> & LookupWriterFactory<GsubGpos.Lookup> = {
    extendedFormat: 7,
    isExtendedFormat: x => x === 7,
    createReader(x: number): LookupReader<GsubGpos.Lookup, any> {
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
    *writers(): IterableIterator<LookupWriter<GsubGpos.Lookup, any>> {
        yield new GsubSingleWriter();
        yield new GsubMultiWriter();
        yield new GsubAlternateWriter();
        yield new GsubLigatureWriter();
        yield new GsubChainingContextualWriter();
        yield new GsubReverseWriter();
    }
};

export const GsubTableIo = {
    read(view: BinaryView, trc: TableReadContext) {
        const o = view.next(GsubGposTable, gsub, trc);
        return new Gsub.Table(o.scripts, o.features, o.lookups, o.featureVariations);
    },
    write(frag: Frag, table: Gsub.Table, twc: TableWriteContext) {
        return frag.push(GsubGposTable, table, gsub, twc);
    }
};
