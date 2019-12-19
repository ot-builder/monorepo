import { Gpos, Gsub } from "@ot-builder/ft-layout";

const LookupAlgBase: Gsub.LookupAlg<boolean> & Gpos.LookupAlg<boolean> = {
    gsubSingle: () => false,
    gsubMulti: () => false,
    gsubAlternate: () => false,
    gsubLigature: () => false,
    gsubChaining: () => false,
    gsubReverse: () => false,
    gposSingle: () => false,
    gposPair: () => false,
    gposCursive: () => false,
    gposMarkToBase: () => false,
    gposMarkToLigature: () => false,
    gposMarkToMark: () => false,
    gposChaining: () => false
};

export const LookupIsGsubSingleAlg = {
    ...LookupAlgBase,
    gsubSingle: () => true
};
export const LookupIsGsubMultiAlg = {
    ...LookupAlgBase,
    gsubMulti: () => true
};
export const LookupIsGsubAlternateAlg = {
    ...LookupAlgBase,
    gsubAlternate: () => true
};
export const LookupIsGsubLigatureAlg = {
    ...LookupAlgBase,
    gsubLigature: () => true
};
export const LookupIsGsubChainingAlg = {
    ...LookupAlgBase,
    gsubChaining: () => true
};
export const LookupIsGsubReverseAlg = {
    ...LookupAlgBase,
    gsubReverse: () => true
};

export const LookupIsGposSingleAlg = {
    ...LookupAlgBase,
    gposSingle: () => true
};
export const LookupIsGposPairAlg = {
    ...LookupAlgBase,
    gposPair: () => true
};
export const LookupIsGposCursiveAlg = {
    ...LookupAlgBase,
    gposCursive: () => true
};
export const LookupIsGposMarkToBaseAlg = {
    ...LookupAlgBase,
    gposMarkToBase: () => true
};
export const LookupIsGposMarkToLigatureAlg = {
    ...LookupAlgBase,
    gposMarkToLigature: () => true
};
export const LookupIsGposMarkToMarkAlg = {
    ...LookupAlgBase,
    gposMarkToMark: () => true
};
export const LookupIsGposChainingAlg = {
    ...LookupAlgBase,
    gposChaining: () => true
};
