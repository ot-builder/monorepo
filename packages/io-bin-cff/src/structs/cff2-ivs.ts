import { Frag, Read, Write } from "@ot-builder/bin-util";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

export const Cff2IVS = {
    ...Read((view, axes: Data.Order<OtVar.Axis>) => {
        view.uint16(); // IVS length -- not used
        return view.liftRelative(0).next(ReadTimeIVS, axes);
    }),
    ...Write((frag, ivs: WriteTimeIVS, axes: Data.Order<OtVar.Axis>) => {
        const bContent = Frag.pack(Frag.from(WriteTimeIVS, ivs, axes));
        frag.uint16(bContent.byteLength).bytes(bContent);
    })
};
