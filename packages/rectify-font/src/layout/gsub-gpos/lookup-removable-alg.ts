import * as Ot from "@ot-builder/font";

export class CLookupRemovableAlg {
    public process(lookup: Ot.Gsub.Lookup | Ot.Gpos.Lookup): boolean {
        switch (lookup.type) {
            case Ot.Gsub.LookupType.GsubSingle:
                return this.gsubSingle(lookup);
            case Ot.Gsub.LookupType.GsubMulti:
                return this.gsubMulti(lookup);
            case Ot.Gsub.LookupType.GsubAlternate:
                return this.gsubAlternate(lookup);
            case Ot.Gsub.LookupType.GsubLigature:
                return this.gsubLigature(lookup);
            case Ot.Gsub.LookupType.GsubChaining:
                return this.gsubChaining(lookup);
            case Ot.Gsub.LookupType.GsubReverse:
                return this.gsubReverse(lookup);
            case Ot.Gpos.LookupType.GposSingle:
                return this.gposSingle(lookup);
            case Ot.Gpos.LookupType.GposPair:
                return this.gposPair(lookup);
            case Ot.Gpos.LookupType.GposCursive:
                return this.gposCursive(lookup);
            case Ot.Gpos.LookupType.GposMarkToBase:
                return this.gposMarkToBase(lookup);
            case Ot.Gpos.LookupType.GposMarkToLigature:
                return this.gposMarkToLigature(lookup);
            case Ot.Gpos.LookupType.GposMarkToMark:
                return this.gposMarkToMark(lookup);
            case Ot.Gpos.LookupType.GposChaining:
                return this.gposChaining(lookup);
        }
    }
    public gsubSingle(props: Ot.Gsub.SingleProp): boolean {
        return !props.mapping.size;
    }
    public gsubMulti(props: Ot.Gsub.MultipleAlternateProp): boolean {
        return !props.mapping.size;
    }
    public gsubAlternate(props: Ot.Gsub.MultipleAlternateProp): boolean {
        return !props.mapping.size;
    }
    public gsubLigature(props: Ot.Gsub.LigatureProp): boolean {
        return !props.mapping.length;
    }
    public gsubReverse(props: Ot.Gsub.ReverseSubProp): boolean {
        return !props.rules.length;
    }
    public gposSingle(props: Ot.Gpos.SingleProp): boolean {
        return !props.adjustments.size;
    }
    public gposPair(props: Ot.Gpos.PairProp): boolean {
        const cdFirst = props.adjustments.getXClassDef();
        const cdSecond = props.adjustments.getYClassDef();
        for (let c1 = 0; c1 < cdFirst.length; c1++) {
            for (let c2 = 0; c2 < cdSecond.length; c2++) {
                const cFirst = cdFirst[c1];
                const cSecond = cdSecond[c2];
                const adj = props.adjustments.getByClass(c1, c2);
                if (cFirst.length || cSecond.length || adj != null) return false;
            }
        }
        return true;
    }
    public gposCursive(props: Ot.Gpos.CursiveProp): boolean {
        return !props.attachments.size;
    }
    public gposMarkToBase(props: Ot.Gpos.MarkToBaseProp): boolean {
        return !props.marks.size || !props.bases.size;
    }
    public gposMarkToMark(props: Ot.Gpos.MarkToMarkProp): boolean {
        return !props.marks.size || !props.baseMarks.size;
    }
    public gposMarkToLigature(props: Ot.Gpos.MarkToLigatureProp): boolean {
        return !props.marks.size || !props.bases.size;
    }
    public gsubChaining(props: Ot.GsubGpos.ChainingProp<{ ref: Ot.Gsub.Lookup }>): boolean {
        return !props.rules.length;
    }
    public gposChaining(props: Ot.GsubGpos.ChainingProp<{ ref: Ot.Gpos.Lookup }>): boolean {
        return !props.rules.length;
    }
}

export const LookupRemovableAlg = new CLookupRemovableAlg();
