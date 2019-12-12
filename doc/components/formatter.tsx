import {
    getDisplayPath,
    getPagePath,
    getParent,
    isAll,
    isAnnotate,
    isApplyConstrain,
    isArray,
    isEither,
    isExport,
    isGeneric,
    isObject,
    isOptional,
    isProject,
    isReadonly,
    isString,
    isTuple,
    TyAll,
    TyAnnotate,
    TyApply,
    TyApplyConstrain,
    TyArray,
    TyEither,
    TyExport,
    TyObject,
    TyOptional,
    TyProject,
    TyReadonly,
    TyRep,
    TyTuple
} from "./tyrep";

export function FormatType(at: TyRep, long?: boolean): React.ReactNode {
    if (!at) return <span className="api-doc-primitive null-or-undef">{"" + at}</span>;
    if (isString(at)) return <span className="api-doc-primitive">{at}</span>;
    if (isExport(at)) return <RenderRef s={at} />;
    if (isAll(at)) return FormatAll(at, long);
    if (isEither(at)) return FormatEither(at, long);
    if (isArray(at)) return FormatArray(at, long);
    if (isOptional(at)) return FormatOptional(at, long);
    if (isReadonly(at)) return FormatReadonly(at, long);
    if (isTuple(at)) return FormatTuple(at, long);
    if (isObject(at)) return FormatObject(at, long);
    if (isProject(at)) return FormatProject(at, long);
    if (isGeneric(at)) return FormatGeneric(at, long);
    if (isAnnotate(at)) return FormatAnnotation(at, long);
    if (isApplyConstrain(at)) return FormatConstrain(at, long);
    return "?";
}

export function FormatTupleImpl(
    at: TyRep[],
    braceLeft: null | string,
    delim: string,
    braceRight: null | string,
    delimType?: string
) {
    let items: React.ReactNode[] = [];
    let started = false;
    let id = 0;
    for (const part of at) {
        if (started) {
            items.push(
                <span key={"delim-" + id} className={delimType || "api-doc-delimiter"}>
                    {delim + "\u200B"}
                </span>
            );
        }
        items.push(<span key={"item-" + id}>{FormatType(part)}</span>);
        started = true;
        id++;
    }
    return (
        <>
            {!braceLeft ? null : <span className="api-doc-delimiter">{braceLeft}</span>}
            {items}
            {!braceRight ? null : <span className="api-doc-delimiter">{braceRight}</span>}
        </>
    );
}
export function FormatObjectImpl(
    at: { [key: string]: TyRep },
    braceLeft: null | string,
    delim: (key: string) => React.ReactNode,
    wrapElement: (key: string, suffix: string, el: TyRep) => React.ReactNode,
    braceRight: null | string
) {
    let items: React.ReactNode[] = [];
    let started = false;
    for (const key in at) {
        if (started) items.push(delim(key));

        const itemType = at[key];
        if (isOptional(itemType)) {
            items.push(wrapElement(key, "?", itemType.optional));
        } else {
            items.push(wrapElement(key, "", itemType));
        }
        started = true;
    }
    return (
        <>
            {!braceLeft ? null : <span className="api-doc-delimiter">{braceLeft}</span>}
            {items}
            {!braceRight ? null : <span className="api-doc-delimiter">{braceRight}</span>}
        </>
    );
}

function FormatAll(at: TyAll, long?: boolean) {
    return FormatTupleImpl(at.all, "", " & ", "", "api-doc-operator");
}
function FormatEither(at: TyEither, long?: boolean) {
    return FormatTupleImpl(at.either, "", " | ", "", "api-doc-operator");
}
function FormatArray(at: TyArray, long?: boolean) {
    const memberType = at.array;
    const isSimple =
        isString(memberType) ||
        isExport(memberType) ||
        isGeneric(memberType) ||
        isTuple(memberType) ||
        isObject(memberType) ||
        isArray(memberType);
    return (
        <>
            {isSimple ? null : <span className="api-doc-delimiter">{"("}</span>}
            {FormatType(at.array)}
            {isSimple ? null : <span className="api-doc-delimiter">{")"}</span>}
            <span className="api-doc-delimiter api-doc-operator">{"[]"}</span>
        </>
    );
}
function FormatOptional(at: TyOptional, long?: boolean) {
    return (
        <>
            {FormatType(at.optional)}
            <span className="api-doc-delimiter api-doc-operator">{"?"}</span>
        </>
    );
}
function FormatReadonly(at: TyReadonly, long?: boolean) {
    return (
        <>
            <span className="api-doc-operator">{"readonly "}</span>
            {FormatType(at.readonly)}
        </>
    );
}
function FormatTuple(at: TyTuple, long?: boolean) {
    return FormatTupleImpl(at.tuple, "[", ",", "]");
}

function FormatObject(at: TyObject, long?: boolean) {
    return FormatObjectImpl(at.object, "{", ObjectComma, InlineEntry, "}");
}
function FormatProject(at: TyProject, long?: boolean) {
    return (
        <>
            {FormatObjectImpl(at.takes, "(", ObjectComma, InlineEntry, ")")}
            <span className="api-doc-delimiter api-doc-operator">{"=>"}</span>
            {FormatType(at.returns)}
        </>
    );
}
function FormatGeneric(at: TyApply, long?: boolean) {
    return (
        <>
            {FormatType(at.generic)}
            {FormatTupleImpl(at.args, "<", ",", ">")}
        </>
    );
}
function FormatAnnotation(at: TyAnnotate, long?: boolean) {
    return (
        <>
            {FormatType(at.rawType)}
            {long ? <span className="api-doc-ty-annotation"> {at.annotation}</span> : null}
        </>
    );
}
function FormatConstrain(at: TyApplyConstrain, long?: boolean) {
    return (
        <>
            {FormatType(at.left)}
            <span className="api-doc-operator">{" " + at.operator + " "}</span>
            {FormatType(at.right)}
        </>
    );
}

///////////////////////////////////////////////////////////////////////////////////////////////////

export const ObjectComma = (key: string) => (
    <span key={"delim-" + key} className="api-doc-delimiter">
        {",\u200B"}
    </span>
);
export const InlineEntry = (key: string, suffix: string, el: TyRep) => (
    <span key={"item-" + key}>
        <span className="api-doc-function-arg">{key}</span>
        {suffix ? <span className="api-doc-delimiter">{suffix}</span> : null}
        <span className="api-doc-delimiter">{":"}</span>
        {FormatType(el)}
    </span>
);
export const BlockEntry = (key: string, suffix: string, el: TyRep) => (
    <div className="api-doc-method-param" key={"item-" + key}>
        <span className="api-doc-sub-item-indicator parameter">· </span>
        <span className="api-doc-function-arg">{key}</span>
        {suffix ? <span className="api-doc-delimiter">{suffix}</span> : null}
        <span className="api-doc-delimiter">{":"}</span>
        {FormatType(el, true)}
    </div>
);
export const OnlyKeys = (key: string, suffix: string, el: TyRep) => (
    <span key={"item-" + key}>
        <span className="api-doc-function-arg">{key}</span>
        {suffix ? <span className="api-doc-delimiter">{suffix}</span> : null}
    </span>
);

///////////////////////////////////////////////////////////////////////////////////////////////////

type ExportProps = { s: TyExport; anchor?: boolean; dependent?: boolean };
export function RenderRef(props: ExportProps) {
    const objPath = getDisplayPath(props.s);
    let display = objPath;
    let title = objPath;

    const parent = getParent(props.s);
    if (props.dependent && parent) {
        const prefix = getDisplayPath(parent);
        let objSel: string;
        if (display.slice(0, prefix.length) === prefix) {
            objSel = display.slice(prefix.length + 1);
        } else {
            objSel = display;
        }
        title = getDisplayPath(parent) + "#" + objSel;
        if (props.anchor) display = objSel;
        else display = title;
    }

    return (
        <a
            className={"api-doc-link" + (props.anchor ? " anchor" : " ")}
            href={translateExportUrl(props.s)}
            id={props.anchor ? translateExportHash(props.s) : undefined}
            title={title}
        >
            {display}
        </a>
    );
}

function toItemHash(s: string) {
    return s.replace(/\./g, "-");
}
function toPagePath(s: string) {
    return s.replace(/\./g, "/").toLowerCase();
}
function translateUrlImpl(exp: TyExport, orig: TyExport) {
    const pp = getPagePath(exp);
    if (pp) {
        return (
            `/references/` + toPagePath(getPagePath(exp)) + ("#" + toItemHash(getDisplayPath(orig)))
        );
    }

    const parent = getParent(exp);
    if (!parent) return "#" + toItemHash(getDisplayPath(exp));
    else return translateUrlImpl(parent, orig);
}
export function translateExportUrl(exp: TyExport) {
    return translateUrlImpl(exp, exp);
}
function translateExportHash(exp: TyExport) {
    return toItemHash(getDisplayPath(exp));
}
export function translateExportDisplayName(base: TyExport, obj: TyExport, dependent?: boolean) {
    const objPath = getDisplayPath(obj);
    let display = objPath;
    if (dependent && base) {
        const prefix = getDisplayPath(base);
        if (display.slice(0, prefix.length) === prefix) {
            return display.slice(prefix.length + 1);
        } else {
            return display;
        }
    } else {
        return display;
    }
}
