/**
 * SmartFilterBar Filter Manager — cross-filtering via JSON filters + SelectionManager fallback.
 */

import powerbi from "powerbi-visuals-api";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import { FieldData } from "./dataParser";

export function applyFilter(
    host: IVisualHost,
    selMgr: ISelectionManager | null,
    fields: FieldData[]
): void {
    const filters: any[] = [];

    for (const f of fields) {
        const vals: any[] = [];
        for (const k in f.selected) {
            if (f.selected[k]) vals.push(f.raw[k]);
        }
        if (vals.length > 0 && f.qn) {
            const p = f.qn.split(".");
            filters.push({
                "$schema": "https://powerbi.com/product/schema#basic",
                target: { table: p[0] || "", column: p.slice(1).join(".") || f.name },
                operator: "In",
                values: vals,
                filterType: 1,
            });
        }
    }

    try {
        if (filters.length === 0) {
            host.applyJsonFilter(null, "general", "filter", 1 as any);
        } else if (filters.length === 1) {
            host.applyJsonFilter(filters[0] as any, "general", "filter", 0 as any);
        } else {
            host.applyJsonFilter(filters as any, "general", "filter", 0 as any);
        }
        return;
    } catch { /* fall through to SelectionManager */ }

    if (!selMgr) return;
    try {
        const ids: powerbi.visuals.ISelectionId[] = [];
        for (const f of fields) {
            for (const k in f.selected) {
                if (!f.selected[k]) continue;
                for (const it of f.items) {
                    const ik = it.value == null ? "__null__" : String(it.value);
                    if (ik === k) {
                        for (const ri of it.indices) {
                            const sid = buildSid(host, f.cat, ri);
                            if (sid) ids.push(sid);
                        }
                        break;
                    }
                }
            }
        }
        if (ids.length === 0) selMgr.clear();
        else selMgr.select(ids);
    } catch { /* ignore */ }
}

function buildSid(
    host: IVisualHost,
    cat: powerbi.DataViewCategoryColumn,
    rowIdx: number
): powerbi.visuals.ISelectionId | null {
    try {
        return host.createSelectionIdBuilder()
            .withCategory(cat, rowIdx)
            .createSelectionId();
    } catch { return null; }
}

export function restoreFilters(
    fields: FieldData[],
    opts: powerbi.extensibility.visual.VisualUpdateOptions,
    dv: powerbi.DataView | undefined
): void {
    const jfs: any[] = [];

    if (opts && (opts as any).jsonFilters) {
        for (const jfo of (opts as any).jsonFilters) {
            if (jfo) jfs.push(jfo);
        }
    }

    if (jfs.length === 0 && dv?.metadata?.objects?.general) {
        const gf = (dv.metadata.objects.general as any).filter;
        if (Array.isArray(gf)) {
            for (const gi of gf) if (gi) jfs.push(gi);
        } else if (gf && gf.conditions) {
            for (const ci of gf.conditions) if (ci) jfs.push(ci);
        } else if (gf) {
            jfs.push(gf);
        }
    }

    for (const jfilt of jfs) {
        if (!jfilt?.target || !jfilt?.values) continue;
        const tgt = jfilt.target;
        for (const f of fields) {
            const qParts = f.qn.split(".");
            const tbl = qParts[0] || "";
            const col = qParts.slice(1).join(".") || f.name;
            if (tbl === tgt.table && (col === tgt.column || f.name === tgt.column)) {
                for (const v of jfilt.values) {
                    const k = v == null ? "__null__" : String(v);
                    f.selected[k] = true;
                }
                break;
            }
        }
    }
}

export function totalSel(fields: FieldData[]): number {
    let n = 0;
    for (const f of fields) {
        for (const k in f.selected) if (f.selected[k]) n++;
    }
    return n;
}
