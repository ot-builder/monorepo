import { Write } from "@ot-builder/bin-util";
import { Cmap } from "@ot-builder/ot-encoding";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { EncodingCfg } from "../cfg";

import { SubtableAssignment, SubtableWriteOptions } from "./general";
import { SubtableHandlers } from "./handlers";

function ByPlatform(a: SubtableAssignment, b: SubtableAssignment) {
    return a.platform - b.platform || a.encoding - b.encoding;
}

export const WriteCmap = Write(
    (frag, cmap: Cmap.Table, gOrd: Data.Order<OtGlyph>, cfg: EncodingCfg) => {
        const assignments: SubtableAssignment[] = [];
        const options: SubtableWriteOptions = { ...cfg };
        for (const handlerF of SubtableHandlers) {
            const handler = handlerF();
            const fgSubtable = handler.writeOpt(cmap, gOrd, options);
            if (fgSubtable) {
                const handlerAsg = handler.createAssignments(fgSubtable);
                for (const asg of handlerAsg) assignments.push(asg);
            }
        }
        assignments.sort(ByPlatform);

        frag.uint16(0); // Version
        frag.uint16(assignments.length);
        for (const asg of assignments) {
            frag.uint16(asg.platform);
            frag.uint16(asg.encoding);
            frag.ptr32(asg.frag);
        }
    }
);
