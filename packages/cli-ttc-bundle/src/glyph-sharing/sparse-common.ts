export type GlyphData = { hash: string; buffer: Buffer };
export type GlyphSharingMap = Map<string, Buffer>;

export function pushGlyphs(
    sink: GlyphSharingMap[],
    fid: number,
    gds: GlyphData[],
    sharing: number[][]
) {
    const sh = sharing[fid];
    if (gds.length !== sh.length)
        throw new Error(`Unreachable! Font #${fid} sharing length mismatch`);
    for (let gid = 0; gid < gds.length; gid++) {
        if (!sink[sh[gid]]) sink[sh[gid]] = new Map();
        sink[sh[gid]].set(gds[gid].hash, gds[gid].buffer);
    }
}

function allocateGid(shared: GlyphSharingMap[]) {
    let saGid = 0;
    const saGidMaps: Map<string, number>[] = [];
    const combinedGlyphBuffers: Buffer[] = [];
    for (let shGid = 0; shGid < shared.length; shGid++) {
        if (!shared[shGid]) throw new Error(`Unreachable! Shared glyph #${shGid} missing`);
        saGidMaps[shGid] = new Map();
        for (const [hash, buf] of shared[shGid]) {
            saGidMaps[shGid].set(hash, saGid);
            combinedGlyphBuffers[saGid] = buf;
            saGid++;
        }
    }
    return { saGidMaps, combinedGlyphBuffers };
}

export type DataBlockBuildResults = {
    dataBlock: Buffer;
    offsets: number[];
    saGidMaps: Map<string, number>[];
};
export function buildDataBlock(shared: GlyphSharingMap[]): DataBlockBuildResults {
    const { saGidMaps, combinedGlyphBuffers } = allocateGid(shared);

    let currentOffset = 0;
    const offsets: number[] = [];
    for (let sGid = 0; sGid < combinedGlyphBuffers.length; sGid++) {
        if (!combinedGlyphBuffers[sGid]) {
            throw new Error(`Unreachable! Shared glyph #${sGid} missing`);
        }
        offsets[sGid] = currentOffset;
        currentOffset += combinedGlyphBuffers[sGid].byteLength;
    }
    const dataBlock = Buffer.alloc(currentOffset);
    for (let sGid = 0; sGid < combinedGlyphBuffers.length; sGid++) {
        dataBlock.set(combinedGlyphBuffers[sGid], offsets[sGid]);
    }
    return { dataBlock: dataBlock, offsets: offsets, saGidMaps };
}

export function buildOffsetIndex(offsets: number[], validateAlign: boolean) {
    const buf = Buffer.alloc(offsets.length * 4);
    for (let j = 0; j < offsets.length; j++) {
        if (validateAlign && offsets[j] % 4)
            throw new Error("Unreachable! offset should be aligned.");
        buf.writeUInt32BE(offsets[j], j * 4);
    }
    return buf;
}
