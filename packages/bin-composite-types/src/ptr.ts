import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { Data } from "@ot-builder/prelude";

export function NullablePtr16<TR, AR extends unknown[], TW, AW extends unknown[]>(
    r: Read<TR, AR> & Write<TW, AW>
): Read<undefined | null | TR, AR> & Write<undefined | null | TW, AW> {
    return {
        read: (view, ...ar) => {
            const p = view.ptr16Nullable();
            if (!p) return null;
            else return p.next(r, ...ar);
        },
        write: (frag, t, ...aw) => {
            if (t == null) frag.ptr16(null);
            else frag.ptr16New().push(r, t, ...aw);
        }
    };
}
export function NonNullablePtr16<TR, AR extends unknown[], TW, AW extends unknown[]>(
    r: Read<TR, AR> & Write<TW, AW>
): Read<TR, AR> & Write<TW, AW> {
    return {
        read: (view, ...ar) => {
            const p = view.ptr16();
            return p.next(r, ...ar);
        },
        write: (frag, t, ...aw) => {
            frag.ptr16(Frag.from(r, t, ...aw));
        }
    };
}
export function NullablePtr32<TR, AR extends unknown[], TW, AW extends unknown[]>(
    r: Read<TR, AR> & Write<TW, AW>
): Read<undefined | null | TR, AR> & Write<undefined | null | TW, AW> {
    return {
        read: (view, ...ar) => {
            const p = view.ptr32Nullable();
            if (!p) return null;
            else return p.next(r, ...ar);
        },
        write: (frag, t, ...aw) => {
            if (t == null) frag.ptr32(null);
            else frag.ptr32New().push(r, t, ...aw);
        }
    };
}
export function NonNullablePtr32<TR, AR extends unknown[], TW, AW extends unknown[]>(
    r: Read<TR, AR> & Write<TW, AW>
): Read<TR, AR> & Write<TW, AW> {
    return {
        read: (view, ...ar) => {
            const p = view.ptr32();
            return p.next(r, ...ar);
        },
        write: (frag, t, ...aw) => {
            frag.ptr32(Frag.from(r, t, ...aw));
        }
    };
}
export const Ptr16 = {
    read: (p: BinaryView) => p.ptr16(),
    write(frag: Frag, f: Data.Maybe<Frag>) {
        frag.ptr16(f || null);
    }
};
