import { Write } from "@ot-builder/bin-util";
import { Cmap } from "@ot-builder/ft-encoding";
import { OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { Comparison } from "@ot-builder/prelude/lib/control";

import { SubtableAssignment } from "./general";
import { SubtableHandlers } from "./handlers";

const ByPlatform = Comparison<SubtableAssignment>((a, b) => {
    return a.platform - b.platform || a.encoding - b.encoding;
});

export const WriteCmap = Write((frag, cmap: Cmap.Table, gOrd: OtGlyphOrder) => {
    let assignments: SubtableAssignment[] = [];
    for (const handlerF of SubtableHandlers) {
        const handler = handlerF();
        const fgSubtable = handler.writeOpt(cmap, gOrd);
        if (fgSubtable) {
            let handlerAsg = handler.createAssignments(fgSubtable);
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
});
