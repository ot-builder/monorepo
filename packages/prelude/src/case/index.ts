export type CaseType<Tag, Props> = { readonly type: Tag } & Props;
export function CaseCreator<Tag, Props>(tag: Tag, defaultProps: () => Props) {
    return {
        create(props?: Props): CaseType<Tag, Props> {
            return { type: tag, ...(props || defaultProps()) };
        }
    };
}
