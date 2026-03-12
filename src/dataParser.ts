/**
 * SmartFilterBar Data Parser — extract fields with unique values from dataView.
 */

import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

export interface FieldItem {
    value: any;
    display: string;
    indices: number[];
    count: number;
}

export interface FieldData {
    idx: number;
    name: string;
    qn: string;
    cat: powerbi.DataViewCategoryColumn;
    items: FieldItem[];
    raw: Record<string, any>;
    selected: Record<string, boolean>;
    sortMode: string;
}

export function parseData(dv: DataView | undefined): FieldData[] {
    const fields: FieldData[] = [];
    if (!dv?.categorical?.categories) return fields;

    const cats = dv.categorical.categories;
    for (let fi = 0; fi < cats.length; fi++) {
        const cat = cats[fi];
        const name = cat.source.displayName || ("Field " + (fi + 1));
        const qn = (cat.source as any).queryName || "";
        const uMap: Record<string, FieldItem> = {};
        const items: FieldItem[] = [];
        const raw: Record<string, any> = {};

        for (let ri = 0; ri < cat.values.length; ri++) {
            const val = cat.values[ri];
            const key = val == null ? "__null__" : String(val);
            if (!uMap[key]) {
                uMap[key] = { value: val, display: val == null ? "" : String(val), indices: [ri], count: 1 };
                items.push(uMap[key]);
                raw[key] = val;
            } else {
                uMap[key].indices.push(ri);
                uMap[key].count++;
            }
        }

        fields.push({ idx: fi, name, qn, cat, items, raw, selected: {}, sortMode: "orig" });
    }
    return fields;
}

export function sortIt(items: FieldItem[], mode: string): FieldItem[] {
    const sorted = items.slice();
    if (mode === "az") sorted.sort((a, b) => String(a.display).localeCompare(String(b.display)));
    else if (mode === "za") sorted.sort((a, b) => String(b.display).localeCompare(String(a.display)));
    else if (mode === "count") sorted.sort((a, b) => b.count - a.count);
    return sorted;
}
