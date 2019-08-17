import { GposCursiveLookupIdentity } from "./gpos-cursive";
import { GposMarkToBaseIdentity } from "./gpos-mark-to-base";
import { GposMarkToLigatureIdentity } from "./gpos-mark-to-ligature";
import { GposPairLookupIdentity } from "./gpos-pair";
import { GposSingleLookupIdentity } from "./gpos-single";
import { GsubLigatureLookupIdentity } from "./gsub-ligature";
import { GsubMultiAltLookupIdentity } from "./gsub-multi-alternate";
import { GsubReverseLookupIdentity } from "./gsub-reverse";
import { GsubSingleLookupIdentity } from "./gsub-single";
import { ChainingLookupIdentity } from "./lookup-chaining";

export namespace LookupIdentity {
    export import Chaining = ChainingLookupIdentity;
    export import GsubSingle = GsubSingleLookupIdentity;
    export import GsubMultiAlt = GsubMultiAltLookupIdentity;
    export import GsubLigature = GsubLigatureLookupIdentity;
    export import GsubReverse = GsubReverseLookupIdentity;
    export import GposSingle = GposSingleLookupIdentity;
    export import GposPair = GposPairLookupIdentity;
    export import GposCursive = GposCursiveLookupIdentity;
    export import GposMarkToBase = GposMarkToBaseIdentity;
    export import GposMarkToLigature = GposMarkToLigatureIdentity;
}
