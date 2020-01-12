import { Read, Write } from "@ot-builder/bin-util";

type Cons<X, T extends unknown[]> = ((x: X, ...t: T) => void) extends (...t: infer R) => void
    ? R
    : never;

export function SimpleArray<TR, AR extends unknown[], TW, AW extends unknown[]>(
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

export function ExtCountArray<TR, AR extends unknown[], TW, AW extends unknown[]>(
    r: Read<TR, AR> & Write<TW, AW>
): Read<TR[], Cons<number, AR>> & Write<readonly TW[], Cons<number, AW>> {
    return {
        read: (view, n, ...ar) => {
            return view.array(n, r, ...(ar as AR));
        },
        write: (frag, t, n, ...aw) => {
            frag.arrayN(r, n, t, ...(aw as AW));
        }
    };
}
