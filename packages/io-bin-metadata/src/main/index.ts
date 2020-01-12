import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import {
    Avar,
    Fvar,
    Head,
    Maxp,
    MetricHead,
    Os2,
    OtFontIoMetadata,
    Post
} from "@ot-builder/ft-metadata";
import { Sfnt } from "@ot-builder/ft-sfnt";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";

import { AvarIo } from "../avar";
import { FontMetadataCfg } from "../cfg";
import { FvarIo } from "../fvar";
import { HeadIo } from "../head";
import { MaxpIo } from "../maxp";
import { MetricHeadIo } from "../metric-head";
import { MvarTableIo, MvarTag } from "../mvar";
import { Os2TableIo } from "../os2";
import { PostAndNameIo } from "../post";

export function readOtMetadata(sfnt: Sfnt, cfg: FontMetadataCfg): OtFontIoMetadata {
    const bHead = sfnt.tables.get(Head.Tag);
    if (!bHead) throw Errors.MissingKeyTable(Head.Tag);
    const head = new BinaryView(bHead).next(HeadIo);

    const bMaxp = sfnt.tables.get(Maxp.Tag);
    if (!bMaxp) throw Errors.MissingKeyTable(Maxp.Tag);
    const maxp = new BinaryView(bMaxp).next(MaxpIo);

    const bFvar = sfnt.tables.get(Fvar.Tag);
    const fvar = bFvar ? new BinaryView(bFvar).next(FvarIo) : null;

    const bHhea = sfnt.tables.get(MetricHead.TagHhea);
    const hhea = bHhea ? new BinaryView(bHhea).next(MetricHeadIo, false) : null;

    const bVhea = sfnt.tables.get(MetricHead.TagVhea);
    const vhea = bVhea ? new BinaryView(bVhea).next(MetricHeadIo, true) : null;

    const bPost = sfnt.tables.get(Post.Tag);
    const postResult = bPost ? new BinaryView(bPost).next(PostAndNameIo) : null;
    const post = postResult ? postResult.post : null;
    const postGlyphNaming = postResult ? postResult.naming : null;

    const bOs2 = sfnt.tables.get(Os2.Tag);
    const os2 = bOs2 ? new BinaryView(bOs2).next(Os2TableIo) : null;

    const bAvar = sfnt.tables.get(Avar.Tag);
    const avar = bAvar && fvar ? new BinaryView(bAvar).next(AvarIo, fvar.getDesignSpace()) : null;

    const md = { head, maxp, fvar, hhea, vhea, post, postGlyphNaming, os2, avar };

    const bMvar = sfnt.tables.get(MvarTag);
    if (fvar && bMvar) {
        new BinaryView(bMvar).next(MvarTableIo, fvar.getDesignSpace(), md);
    }

    return md;
}

export function writeOtMetadata(
    sink: SfntIoTableSink,
    cfg: FontMetadataCfg,
    md: OtFontIoMetadata
) {
    if (md.fvar && md.avar) {
        sink.add(Avar.Tag, Frag.packFrom(AvarIo, md.avar, md.fvar.getDesignSpace()));
    }
    if (md.fvar) {
        const sfEmpty = new ImpLib.State(false);
        const bMvar = Frag.packFrom(MvarTableIo, md.fvar.getDesignSpace(), md, sfEmpty);
        if (!sfEmpty.get()) sink.add(MvarTag, bMvar);
    }
    if (md.os2) sink.add(Os2.Tag, Frag.packFrom(Os2TableIo, md.os2));
    if (md.post) {
        sink.add(
            Post.Tag,
            Frag.packFrom(PostAndNameIo, md.post, md.maxp.numGlyphs, md.postGlyphNaming)
        );
    }
    if (md.vhea) sink.add(MetricHead.TagVhea, Frag.packFrom(MetricHeadIo, md.vhea));
    if (md.hhea) sink.add(MetricHead.TagHhea, Frag.packFrom(MetricHeadIo, md.hhea));
    if (md.fvar) sink.add(Fvar.Tag, Frag.packFrom(FvarIo, md.fvar));
    sink.add(Maxp.Tag, Frag.packFrom(MaxpIo, md.maxp));
    sink.add(Head.Tag, Frag.packFrom(HeadIo, md.head));
}
