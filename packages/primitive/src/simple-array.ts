import { Read, Write } from "@ot-builder/bin-util";
import { Data } from "@ot-builder/prelude";

export function SimpleArray<TR, AR extends any[], TW, AW extends any[]>(
    n: Read<number, []> & Write<number, []>,
    r: Read<TR, AR> & Write<TW, AW>
): Read<TR[], AR> & Write<readonly TW[], AW> {
    return {
        read: (view, ...ar) => {
            const conditionCount = view.next(n);
            return view.array(conditionCount, r, ...ar);
        },
        write: (frag, t, ...aw) => {
            frag.push(n, t.length);
            frag.array(r, t, ...aw);
        }
    };
}

export function ExtCountArray<TR, AR extends any[], TW, AW extends any[]>(
    r: Read<TR, AR> & Write<TW, AW>
): Read<TR[], Data.Cons<number, AR>> & Write<readonly TW[], Data.Cons<number, AW>> {
    return {
        read: (view, n, ...ar) => {
            return view.array(n, r, ...(ar as AR));
        },
        write: (frag, t, n, ...aw) => {
            frag.arrayN(r, n, t, ...(aw as AW));
        }
    };
}
