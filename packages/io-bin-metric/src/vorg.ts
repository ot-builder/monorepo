import { Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { Vorg } from "@ot-builder/ft-glyphs";

export const VorgIo = {
    ...Read(view => {
        const vorg = new Vorg.Table();
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("VORG", majorVersion, minorVersion, [1, 0]);

        vorg.defaultVertOriginY = view.int16();
        const numVertOriginYMetrics = view.uint16();
        for (let [p] of view.repeat(numVertOriginYMetrics)) {
            const gid = p.uint16();
            const y = p.int16();
            vorg.vertOriginYMetrics[gid] = y;
        }

        return vorg;
    }),
    ...Write((frag, vorg: Vorg.Table) => {
        frag.uint16(1).uint16(0);
        frag.int16(vorg.defaultVertOriginY);

        // collect entries and write
        let entries: [number, number][] = [];
        for (let gid = 0; gid < vorg.vertOriginYMetrics.length; gid++) {
            const entry = vorg.vertOriginYMetrics[gid];
            if (entry != null) entries.push([gid, entry]);
        }

        frag.uint16(entries.length);
        for (const [gid, y] of entries) frag.uint16(gid).int16(y);
    })
};
