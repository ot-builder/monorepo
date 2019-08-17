export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
};
export type DeepWritable<T> = {
    -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U>
        ? DeepWritable<U>[]
        : DeepWritable<T[P]>;
};
