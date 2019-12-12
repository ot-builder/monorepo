import { TyRep } from "./tyrep";

export const optional = (ts: TyRep): TyRep => ({ optional: ts });
export const readonly = (ts: TyRep): TyRep => ({ readonly: ts });
export const all = (...ts: TyRep[]): TyRep => ({ all: ts });
export const either = (...ts: TyRep[]): TyRep => ({ either: ts });
export const tuple = (...ts: TyRep[]): TyRep => ({ tuple: ts });
export const app = (a: TyRep, ...ts: TyRep[]): TyRep => ({ generic: a, args: ts });
export const pi = (a: { [key: string]: TyRep }, b: TyRep): TyRep => ({ takes: a, returns: b });
export const annot = (ts: TyRep, s: string): TyRep => ({ rawType: ts, annotation: s });
export const extend = (a: TyRep, b: TyRep): TyRep => ({ operator: "extends", left: a, right: b });
export const guard = (a: TyRep, b: TyRep): TyRep => ({ operator: "is", left: a, right: b });
