import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Meta, Name, OtNameData, Stat } from "@ot-builder/ft-name";
import { Sfnt } from "@ot-builder/ft-sfnt";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";

import { MetaTableIo } from "../meta";
import { NameIo } from "../name";
import { StatRead } from "../stat/read";
import { StatWrite } from "../stat/write";

export function readNames(sfnt: Sfnt): OtNameData {
    const bufName = sfnt.tables.get(Name.Tag);
    const name = bufName ? new BinaryView(bufName).next(NameIo) : null;
    const bufStat = sfnt.tables.get(Stat.Tag);
    const stat = bufStat ? new BinaryView(bufStat).next(StatRead) : null;
    const bufMeta = sfnt.tables.get(Meta.Tag);
    const meta = bufMeta ? new BinaryView(bufMeta).next(MetaTableIo) : null;
    return { name, stat, meta };
}

export function writeNames(sink: SfntIoTableSink, nd: OtNameData) {
    if (nd.name) sink.add(Name.Tag, Frag.packFrom(NameIo, nd.name));
    if (nd.stat) sink.add(Stat.Tag, Frag.packFrom(StatWrite, nd.stat));
    if (nd.meta) sink.add(Meta.Tag, Frag.packFrom(MetaTableIo, nd.meta));
}
