import {
    BlockEntry,
    FormatObjectImpl,
    FormatTupleImpl,
    FormatType,
    InlineEntry,
    ObjectComma,
    OnlyKeys,
    RenderRef
} from "./formatter";
import { getParent, isExport, isOptional, TyApplyExport, TyExport, TyRep } from "./tyrep";

export const R = (props: { s: TyRep }) => FormatType(props.s);

export type MethodDeclProps = TyDeclProps & {
    args?: { [key: string]: TyRep };
    long?: boolean;
    returns?: TyRep;
};
export type MemberDeclProps = TyDeclProps & {
    type: TyRep;
};
export type TyDeclProps = {
    static?: boolean;
    readonly?: boolean;
    volatile?: boolean;
    ctor?: boolean;
    optional?: boolean;
    s: TyExport | TyApplyExport;
};

export const Method = (props: MethodDeclProps) => <MethodDeclImpl {...props} member={true} />;
export const Fn = (props: MethodDeclProps) => <MethodDeclImpl {...props} member={false} />;
export const Member = (props: MemberDeclProps) => <MemberDeclImpl {...props} member={true} />;
export const Decl = (props: TyDeclProps) => <TyDeclImpl {...props} member={false} />;
export const Item = (props: TyDeclProps) => <TyDeclImpl {...props} member={true} />;
export const NthBit = (props: { n: number }) => (
    <>
        Bit {props.n} (
        <code>
            1 {"<<"} {props.n}
        </code>
        )
    </>
);

///////////////////////////////////////////////////////////////////////////////////////////////////

const DeclHeader = (props: TyDeclProps & { member: boolean }) => {
    if (isExport(props.s)) {
        return <DeclHeaderImpl {...props} s={props.s} />;
    } else {
        let symbol = props.s.generic;
        if (props.ctor && getParent(symbol)) symbol = getParent(symbol)!;
        return (
            <>
                <DeclHeaderImpl {...props} s={props.s.generic} />
                {FormatTupleImpl(props.s.args, "<", ",", ">")}
            </>
        );
    }
};

export type DeclHeaderImplProps = {
    static?: boolean;
    readonly?: boolean;
    volatile?: boolean;
    ctor?: boolean;
    optional?: boolean;
    member?: boolean;
    s: TyExport;
};

const DeclHeaderImpl = (props: DeclHeaderImplProps) => {
    let prefix = "";
    let suffix = "";
    let dependent = !!props.member;
    let symbol = props.s;

    if (props.static) {
        dependent = false;
    }
    if (props.readonly) prefix += "readonly ";
    if (props.volatile) prefix += "volatile ";

    if (props.ctor && getParent(symbol)) {
        prefix += "new ";
        symbol = getParent(symbol)!;
        dependent = false;
    }

    if (props.optional) {
        suffix += "?";
    }

    return (
        <>
            {prefix ? <span className="api-doc-decl-prefix">{prefix}</span> : null}
            <RenderRef anchor dependent={dependent} s={symbol} />
            {suffix ? <span className="api-doc-delimiter api-doc-operator">{suffix}</span> : null}
        </>
    );
};

const DeclEnclosure = (e: React.ReactNode, eRest?: React.ReactNode) => (
    <>
        <span className="api-doc-declaration">{e}</span>
        {eRest ? <div className="api-doc-declaration">{eRest}</div> : null}
    </>
);

const TyDeclImpl = (props: TyDeclProps & { member: boolean }) =>
    DeclEnclosure(<DeclHeader {...props} />);

const MemberDeclImpl = (props: MemberDeclProps & { member: boolean }) => {
    let ty = props.type;
    let optional = false;
    if (isOptional(ty)) {
        optional = true;
        ty = ty.optional;
    }
    return DeclEnclosure(
        <>
            <DeclHeader {...props} optional={props.optional || optional} />
            <span className="api-doc-delimiter">{":\u200B"}</span>
            {FormatType(ty)}
        </>
    );
};

const MethodDeclImpl = (props: MethodDeclProps & { member: boolean }) =>
    DeclEnclosure(
        <>
            <DeclHeader {...props} />
            {FormatObjectImpl(
                props.args || {},
                "(",
                ObjectComma,
                props.long ? OnlyKeys : InlineEntry,
                ")"
            )}
            {props.returns ? (
                <>
                    <span className="api-doc-delimiter">{":\u200B"}</span>
                    {FormatType(props.returns)}
                </>
            ) : null}
        </>,
        props.long ? FormatObjectImpl(props.args || {}, "", () => null, BlockEntry, "") : null
    );
