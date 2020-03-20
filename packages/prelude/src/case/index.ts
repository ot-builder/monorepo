/* eslint-disable @typescript-eslint/no-explicit-any */
export type CaseType<Tag, Props> = { readonly type: Tag } & Props;
export type CaseCtorType<Tag, Props, A extends any[]> = {
    new (...args: A): CaseType<Tag, Props>;
};
export type CaseClassType<Tag, Props, A extends any[]> = {
    readonly Type: Tag;
    new (...args: A): CaseType<Tag, Props>;
};

export function CaseCreator<Tag, Props, A extends any[]>(
    typeTag: Tag,
    fn: (...args: A) => Props
): CaseClassType<Tag, Props, A> {
    const CtorImpl = CaseCtorImpl(typeTag, fn);
    return Object.assign(CtorImpl, { Type: typeTag });
}
function CaseCtorImpl<Tag, Props, A extends any[]>(
    typeTag: Tag,
    fn: (...args: A) => Props
): CaseCtorType<Tag, Props, A> {
    return function(this: any, ...args: A) {
        initialize(this, typeTag, fn(...args));
    } as any;
}
function initialize<Tag, Props>(obj: any, tag: Tag, props: Props) {
    obj.type = tag;
    Object.assign(obj, props);
}

export function FallbackPropCreator<Props>(fn: () => Props) {
    return (props?: Props): Props => props || fn();
}
