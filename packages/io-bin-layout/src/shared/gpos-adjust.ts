import * as crypto from "crypto";

import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Gpos, LayoutCommon } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { Int16 } from "@ot-builder/primitive";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { Ptr16DeviceTable } from "./device-table";

export enum GposAdjustmentFormat {
    X_PLACEMENT = 0x0001,
    Y_PLACEMENT = 0x0002,
    X_ADVANCE = 0x0004,
    Y_ADVANCE = 0x0008,
    X_PLACEMENT_DEVICE = 0x0010,
    Y_PLACEMENT_DEVICE = 0x0020,
    X_ADVANCE_DEVICE = 0x0040,
    Y_ADVANCE_DEVICE = 0x0080
}

function needDeviceEntry(dt: Data.Maybe<ReadonlyArray<number>>, v: OtVar.Value) {
    return dt || !OtVar.Ops.isConstant(v);
}
function omitWhenNoDeviceNeed<T>(dt: Data.Maybe<ReadonlyArray<number>>, v: OtVar.Value, val: T) {
    return dt || !OtVar.Ops.isConstant(v) ? val : null;
}
function deviceDataSize(dt: Data.Maybe<ReadonlyArray<number>>, v: OtVar.Value) {
    if (dt) return Int16.size * 5 + dt.length;
    else if (!OtVar.Ops.isConstant(v)) return Int16.size * 5;
    else return 0;
}

// Estimate data size under a specific format
function estimatePackedSizeImpl(format: number, adj: Gpos.Adjustment) {
    let f: number = 0;
    if (format & GposAdjustmentFormat.X_PLACEMENT) f += Int16.size;
    if (format & GposAdjustmentFormat.Y_PLACEMENT) f += Int16.size;
    if (format & GposAdjustmentFormat.X_ADVANCE) f += Int16.size;
    if (format & GposAdjustmentFormat.Y_ADVANCE) f += Int16.size;
    if (format & GposAdjustmentFormat.X_PLACEMENT_DEVICE) {
        f += deviceDataSize(adj.dXDevice, adj.dX);
    }
    if (format & GposAdjustmentFormat.Y_PLACEMENT_DEVICE) {
        f += deviceDataSize(adj.dYDevice, adj.dY);
    }
    if (format & GposAdjustmentFormat.X_ADVANCE_DEVICE) {
        f += deviceDataSize(adj.dWidthDevice, adj.dWidth);
    }
    if (format & GposAdjustmentFormat.Y_ADVANCE_DEVICE) {
        f += deviceDataSize(adj.dHeightDevice, adj.dHeight);
    }
    return f;
}

export const GposAdjustment = {
    read(view: BinaryView, format: number, ivs: Data.Maybe<ReadTimeIVS>) {
        const adj: LayoutCommon.Adjust.WT<OtVar.Value> = {
            dX: 0,
            dY: 0,
            dWidth: 0,
            dHeight: 0
        };
        if (format & GposAdjustmentFormat.X_PLACEMENT) {
            adj.dX = view.int16();
        }
        if (format & GposAdjustmentFormat.Y_PLACEMENT) {
            adj.dY = view.int16();
        }
        if (format & GposAdjustmentFormat.X_ADVANCE) {
            adj.dWidth = view.int16();
        }
        if (format & GposAdjustmentFormat.Y_ADVANCE) {
            adj.dHeight = view.int16();
        }
        if (format & GposAdjustmentFormat.X_PLACEMENT_DEVICE) {
            const dd = view.next(Ptr16DeviceTable, ivs);
            if (dd) {
                adj.dX = OtVar.Ops.add(adj.dX, dd.variation);
                adj.dXDevice = dd.deviceDeltas;
            }
        }
        if (format & GposAdjustmentFormat.Y_PLACEMENT_DEVICE) {
            const dd = view.next(Ptr16DeviceTable, ivs);
            if (dd) {
                adj.dY = OtVar.Ops.add(adj.dY, dd.variation);
                adj.dYDevice = dd.deviceDeltas;
            }
        }
        if (format & GposAdjustmentFormat.X_ADVANCE_DEVICE) {
            const dd = view.next(Ptr16DeviceTable, ivs);
            if (dd) {
                adj.dWidth = OtVar.Ops.add(adj.dWidth, dd.variation);
                adj.dWidthDevice = dd.deviceDeltas;
            }
        }
        if (format & GposAdjustmentFormat.Y_ADVANCE_DEVICE) {
            const dd = view.next(Ptr16DeviceTable, ivs);
            if (dd) {
                adj.dHeight = OtVar.Ops.add(adj.dHeight, dd.variation);
                adj.dHeightDevice = dd.deviceDeltas;
            }
        }

        return adj as Gpos.Adjustment;
    },

    write(b: Frag, adj: Gpos.Adjustment, format: number, ivs: Data.Maybe<WriteTimeIVS>) {
        if (format & GposAdjustmentFormat.X_PLACEMENT) {
            b.int16(ImpLib.Arith.Round.Offset(OtVar.Ops.originOf(adj.dX)));
        }
        if (format & GposAdjustmentFormat.Y_PLACEMENT) {
            b.int16(ImpLib.Arith.Round.Offset(OtVar.Ops.originOf(adj.dY)));
        }
        if (format & GposAdjustmentFormat.X_ADVANCE) {
            b.int16(ImpLib.Arith.Round.Offset(OtVar.Ops.originOf(adj.dWidth)));
        }
        if (format & GposAdjustmentFormat.Y_ADVANCE) {
            b.int16(ImpLib.Arith.Round.Offset(OtVar.Ops.originOf(adj.dHeight)));
        }
        if (format & GposAdjustmentFormat.X_PLACEMENT_DEVICE) {
            const dt = omitWhenNoDeviceNeed(adj.dXDevice, adj.dX, {
                variation: adj.dX,
                deviceDeltas: adj.dXDevice
            });
            b.push(Ptr16DeviceTable, dt, ivs);
        }
        if (format & GposAdjustmentFormat.Y_PLACEMENT_DEVICE) {
            const dt = omitWhenNoDeviceNeed(adj.dYDevice, adj.dY, {
                variation: adj.dY,
                deviceDeltas: adj.dYDevice
            });
            b.push(Ptr16DeviceTable, dt, ivs);
        }
        if (format & GposAdjustmentFormat.X_ADVANCE_DEVICE) {
            const dt = omitWhenNoDeviceNeed(adj.dWidthDevice, adj.dWidth, {
                variation: adj.dWidth,
                deviceDeltas: adj.dWidthDevice
            });
            b.push(Ptr16DeviceTable, dt, ivs);
        }
        if (format & GposAdjustmentFormat.Y_ADVANCE_DEVICE) {
            const dt = omitWhenNoDeviceNeed(adj.dWidthDevice, adj.dWidth, {
                variation: adj.dHeight,
                deviceDeltas: adj.dHeightDevice
            });
            b.push(Ptr16DeviceTable, dt, ivs);
        }
    },

    measure(adj: Gpos.Adjustment, format: number) {
        return estimatePackedSizeImpl(format, adj);
    },

    decideFormat(adj: Gpos.Adjustment) {
        let f: GposAdjustmentFormat = 0;
        if (!OtVar.Ops.isZero(adj.dX)) f |= GposAdjustmentFormat.X_PLACEMENT;
        if (!OtVar.Ops.isZero(adj.dY)) f |= GposAdjustmentFormat.Y_PLACEMENT;
        if (!OtVar.Ops.isZero(adj.dWidth)) f |= GposAdjustmentFormat.X_ADVANCE;
        if (!OtVar.Ops.isZero(adj.dHeight)) f |= GposAdjustmentFormat.Y_ADVANCE;
        if (needDeviceEntry(adj.dXDevice, adj.dX)) {
            f |= GposAdjustmentFormat.X_PLACEMENT_DEVICE | GposAdjustmentFormat.X_PLACEMENT;
        }
        if (needDeviceEntry(adj.dYDevice, adj.dY)) {
            f |= GposAdjustmentFormat.Y_PLACEMENT_DEVICE | GposAdjustmentFormat.Y_PLACEMENT;
        }
        if (needDeviceEntry(adj.dWidthDevice, adj.dWidth)) {
            f |= GposAdjustmentFormat.X_ADVANCE_DEVICE | GposAdjustmentFormat.X_ADVANCE;
        }
        if (needDeviceEntry(adj.dHeightDevice, adj.dHeight)) {
            f |= GposAdjustmentFormat.Y_ADVANCE_DEVICE | GposAdjustmentFormat.Y_ADVANCE;
        }
        return f;
    },
    hash(adj: Gpos.Adjustment, ivs?: Data.Maybe<WriteTimeIVS>) {
        const fm = GposAdjustment.decideFormat(adj);
        if (!fm) return null;
        const fr = Frag.pack(Frag.from(GposAdjustment, adj, fm, ivs));
        return getHash(fr);
    },
    hashPair(adj: Gpos.AdjustmentPair, ivs?: Data.Maybe<WriteTimeIVS>) {
        const f1 = GposAdjustment.decideFormat(adj[0]);
        const f2 = GposAdjustment.decideFormat(adj[1]);
        if (!f1 && !f2) return null;

        const bFirst = Frag.pack(Frag.from(GposAdjustment, adj[0], f1, ivs));
        const bSecond = Frag.pack(Frag.from(GposAdjustment, adj[1], f2, ivs));
        return getHash2(bFirst, bSecond);
    }
};

function BufFromInt(x: number) {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32BE(x, 0);
    return buf;
}
function getHash(buf: Buffer) {
    const shaSum = crypto.createHash("sha256");
    shaSum.update(buf);
    return shaSum.digest("hex");
}
function getHash2(buf1: Buffer, buf2: Buffer) {
    const shaSum = crypto.createHash("sha256");
    shaSum.update(BufFromInt(buf1.byteLength));
    shaSum.update(buf1);
    shaSum.update(BufFromInt(buf2.byteLength));
    shaSum.update(buf2);
    return shaSum.digest("hex");
}
