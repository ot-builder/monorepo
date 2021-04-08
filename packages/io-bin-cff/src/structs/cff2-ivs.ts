import { Frag, Read, Write } from "@ot-builder/bin-util";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

export const Cff2IVS = {
    ...Read((view, designSpace: OtVar.DesignSpace) => {
        view.uint16(); // IVS length -- not used
        return view.liftRelative(0).next(ReadTimeIVS, designSpace);
    }),
    ...Write((frag, ivs: WriteTimeIVS, designSpace: OtVar.DesignSpace) => {
        const bContent = Frag.pack(Frag.from(WriteTimeIVS, ivs, { designSpace }));
        frag.uint16(bContent.byteLength).bytes(bContent);
    })
};
