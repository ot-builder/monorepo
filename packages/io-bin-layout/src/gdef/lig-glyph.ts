import { Read, Write } from "@ot-builder/bin-util";
import { Gdef } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";

import { CaretValue } from "./lig-caret-value";

export const LigGlyph = {
    ...Read((view, ivs?: Data.Maybe<ReadTimeIVS>) => {
        const caretCount = view.uint16();
        const carets = view.array(
            caretCount,
            { ...Read((view, ivs?: Data.Maybe<ReadTimeIVS>) => view.ptr16().next(CaretValue)) },
            ivs
        );
        return carets;
    }),
    ...Write((frag, carets: Gdef.LigCaret[], ivs?: Data.Maybe<WriteTimeIVS>) => {
        frag.uint16(carets.length);
        for (const caret of carets) {
            frag.ptr16New().push(CaretValue, caret, ivs);
        }
    })
};
