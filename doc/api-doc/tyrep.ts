/* eslint-disable @typescript-eslint/no-explicit-any */

// "TypeRep"
export type TyExport = { [key: string]: TyExport };
export type TyAll = { all: TyRep[] };
export type TyEither = { either: TyRep[] };
export type TyArray = { array: TyRep };
export type TyReadonly = { readonly: TyRep };
export type TyOptional = { optional: TyRep };
export type TyRest = { rest: TyRep };
export type TyTuple = { tuple: TyRep[] };
export type TyObject = { object: { [key: string]: TyRep } };
export type TyProject = { takes: { [key: string]: TyRep }; returns: TyRep };
export type TyApply = { generic: TyRep; args: TyRep[] };
export type TyAnnotate = { rawType: TyRep; annotation: string };
export type TyApplyExport = { generic: TyExport; args: TyRep[] };
export type TyApplyConstrain = { left: TyRep; right: TyRep; operator: string };
export type TyRep =
    | null
    | undefined
    | string
    | TyExport
    | TyAll
    | TyEither
    | TyArray
    | TyTuple
    | TyObject
    | TyReadonly
    | TyOptional
    | TyRest
    | TyApply
    | TyAnnotate
    | TyProject
    | TyApplyConstrain;

// Export object property
export type ExportProperty = {
    parent: null | TyExport;
    pagePath?: string;
    path: string;
    children: Map<string, TyExport>;
};

const exportPathMap = new WeakMap<TyExport, ExportProperty>();
export function createTopLevelExport(path: string): TyExport {
    const raw: any = (...args: TyRep[]): TyApplyExport => ({ generic: p, args });
    const p: any = new Proxy(raw, {
        get(target, step) {
            const stepName = step.toString();
            const pr = getProp(p);
            const existing = pr.children.get(stepName);
            if (existing) return existing;
            const created = createTopLevelExport(pr.path + "." + stepName);
            getProp(created).parent = p;
            pr.children.set(stepName, created);
            return created;
        }
    });
    getPropOrCreate(p, path);
    return p;
}

function getProp(exp: TyExport) {
    const prop = exportPathMap.get(exp);
    if (!prop) throw new Error("Unreachable");
    return prop;
}
function createProp(path: string): ExportProperty {
    return { parent: null, path, children: new Map() };
}
function getPropOrCreate(exp: TyExport, path: string) {
    const existing = exportPathMap.get(exp);
    if (existing) return existing;
    const created = createProp(path);
    exportPathMap.set(exp, created);
    return created;
}
export function getPagePath(obj: TyExport) {
    return getProp(obj).pagePath;
}
export function getDisplayPath(obj: TyExport) {
    const prop = exportPathMap.get(obj);
    if (prop) return prop.path;
    else return "?";
}
export function getParent(obj: TyExport) {
    return getProp(obj).parent;
}
export function getChildren(obj: TyExport) {
    return getProp(obj).children;
}

export function setPage(obj: TyExport, path?: string) {
    const pr = getProp(obj);
    pr.pagePath = path || pr.path;
    return obj;
}

///////////////////////////////////////////////////////////////////////////////////////////////////

export function isString(ad: TyRep): ad is string {
    return ad && typeof ad === "string";
}
export function isExport(ad: TyRep): ad is TyExport {
    return ad && !isString(ad) && !!exportPathMap.get(ad as any);
}
export function isAll(ad: TyRep): ad is TyAll {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).all;
}
export function isEither(ad: TyRep): ad is TyEither {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).either;
}
export function isArray(ad: TyRep): ad is TyArray {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).array;
}
export function isReadonly(ad: TyRep): ad is TyReadonly {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).readonly;
}
export function isOptional(ad: TyRep): ad is TyOptional {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).optional;
}
export function isRest(ad: TyRep): ad is TyRest {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).rest;
}
export function isTuple(ad: TyRep): ad is TyTuple {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).tuple;
}
export function isObject(ad: TyRep): ad is TyObject {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).object;
}
export function isProject(ad: TyRep): ad is TyProject {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).takes;
}
export function isGeneric(ad: TyRep): ad is TyApply {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).generic;
}
export function isAnnotate(ad: TyRep): ad is TyAnnotate {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).rawType;
}
export function isApplyConstrain(ad: TyRep): ad is TyApplyConstrain {
    return ad && !isString(ad) && !isExport(ad) && !!(ad as any).operator;
}
