import { Data } from "@ot-builder/prelude";

import { CompareContext } from "./context";

export class BimapCtx<G> implements CompareContext<BimapCtx<G>> {
    private constructor(
        public readonly derived: boolean,
        private readonly a: Data.Order<G>,
        private readonly b: Data.Order<G>
    ) {}
    public forward(g: G) {
        return this.b.at(this.a.reverse(g));
    }
    public reward(g: G) {
        return this.a.at(this.b.reverse(g));
    }
    public CreateForward() {
        return new BimapCtx(true, this.b, this.a);
    }
    public CreateFlip() {
        return new BimapCtx(true, this.a, this.b);
    }

    public static from<T>(a: Data.Order<T>, b: Data.Order<T> = a) {
        return new BimapCtx(false, a, b);
    }
}
