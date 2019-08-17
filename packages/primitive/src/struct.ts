import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";

export type StructFieldDataTypeOf_<A> = A extends Read<infer T, infer P>
    ? A extends Write<T, infer Q>
        ? T
        : never
    : never;

export type StructDataType<Config> = { [key in keyof Config]: StructFieldDataTypeOf_<Config[key]> };

export function Struct<Config, A extends any[] = [], B extends any[] = A>(
    cfg: Config
): Read<StructDataType<Config>, A> & Write<StructDataType<Config>, B> {
    return {
        read(view: BinaryView, ...args: A) {
            let obj: any = {};
            const _cfg = cfg as any;
            for (const key in _cfg) {
                obj[key] = view.next(_cfg[key]);
            }
            return obj;
        },
        write(frag: Frag, obj: StructDataType<Config>, ...args: B) {
            const _cfg = cfg as any;
            const _obj = obj as any;
            for (const key in _cfg) {
                frag.push(_cfg[key], _obj[key], ...args);
            }
            return obj;
        }
    };
}
