import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { TSIC } from "@ot-builder/ot-vtt-private";
import { F2D14, Int16, Tag, UInt16 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";
import * as iconv from "iconv-lite";

export const TsicTable = {
    ...Read((view: BinaryView, ds: OtVar.DesignSpace) => {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("TSIC", majorVersion, minorVersion, [1, 1]);
        const flags = view.uint16();
        const axisCount = view.uint16();
        Assert.SizeMatch("TSIC::axisCount", axisCount, ds.length);
        const recordCount = view.uint16();
        const reserved = view.uint16();
        for (const [iDim, dim] of ds.entries()) {
            const axisArrayItem = view.next(Tag);
            Assert.TagMatch(`TSIC::AxisArray[${iDim}]`, axisArrayItem, dim.tag);
        }

        const locations: TSIC.Location[] = [];
        for (let iRecord = 0; iRecord < recordCount; iRecord++) {
            locations[iRecord] = new Map();
            for (const dim of ds) locations[iRecord].set(dim, view.next(F2D14));
        }

        const table = new TSIC.Table();
        for (let iRecord = 0; iRecord < recordCount; iRecord++) {
            table.records[iRecord] = view.next(TsicRecord, locations[iRecord]);
        }

        return table;
    }),
    ...Write((frag: Frag, table: TSIC.Table, ds: OtVar.DesignSpace) => {
        frag.uint16(1).uint16(1); // Version
        frag.uint16(0); // flags
        frag.uint16(ds.length); // axisCount
        frag.uint16(table.records.length); // recordCount
        frag.uint16(0); // reserved
        for (const dim of ds) frag.push(Tag, dim.tag); // xisArray
        for (let iRecord = 0; iRecord < table.records.length; iRecord++) {
            for (const dim of ds) {
                frag.push(F2D14, table.records[iRecord].location.get(dim) || 0); // RecordLocations
            }
        }
        for (let iRecord = 0; iRecord < table.records.length; iRecord++) {
            frag.push(TsicRecord, table.records[iRecord]);
        }
    })
};

const TsicRecord = {
    ...Read((view: BinaryView, location: Map<OtVar.Dim, number>) => {
        const flags = view.uint16();
        const numCVTEntries = view.uint16();
        const nameLength = view.uint16();
        const name = iconv.decode(view.bytes(2 * nameLength), `utf16-be`);
        const cvtArray = view.array(numCVTEntries, UInt16);
        const cvtValueArray = view.array(numCVTEntries, Int16);

        const cvtMappings = new Map<number, number>();
        for (let iCvt = 0; iCvt < numCVTEntries; iCvt++) {
            cvtMappings.set(cvtArray[iCvt], cvtValueArray[iCvt]);
        }
        const record: TSIC.Record = { name, location, cvtValues: cvtMappings };
        return record;
    }),
    ...Write((frag: Frag, record: TSIC.Record) => {
        // Do not sort -- order may carry semantics
        const cvtEntriesArray = Array.from(record.cvtValues);
        const name = record.name || "";
        frag.uint16(0); // flags
        frag.uint16(cvtEntriesArray.length); // numCVTEntries
        frag.uint16(name.length); // nameLength
        frag.bytes(iconv.encode(name, "utf16-be")); // nameArray
        for (let iCvt = 0; iCvt < cvtEntriesArray.length; iCvt++)
            frag.uint16(cvtEntriesArray[iCvt][0]); // CVTArray
        for (let iCvt = 0; iCvt < cvtEntriesArray.length; iCvt++)
            frag.int16(cvtEntriesArray[iCvt][1]); // CVTValueArray
    })
};
