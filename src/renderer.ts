/**
 * SmartFilterBar Renderer — HTML generation, inline CSS, dropdown positioning.
 */

import { VisualSettings } from "./settings";
import { FieldData, FieldItem, sortIt } from "./dataParser";
import { totalSel } from "./filterManager";
import { tl, LangStrings } from "./i18n";
import { cx, bgM, bdM, txC, txS, bgHov, bgI, ddBg, ddBd, sepC, inputBd, inputC, ckBd, ckBg, acTx, ddLine, resetC } from "./colorHelpers";
import { SSIG, SORT_AZ, SORT_ZA, SORT_CT, SORT_OR, SORT_IC, CHK, CHV, XICON, EMPTY_ICON, HALF, SLIDERS, PLUS_IC, MINUS_IC, SEARCH_IC } from "./icons";
import { esc, safeInnerHTML } from "./sanitize";

export interface RenderState {
    fields: FieldData[];
    openDD: number;
    sortOpen: boolean;
    sq: Record<number, string>;
    mfOpen: boolean;
    accOpen: Record<number, boolean>;
    mfSearch: string;
    accSearch: Record<number, string>;
}

function css(s: VisualSettings): string {
    return "<style>" +
        '[data-sfb="item"]:hover{background:' + bgHov(s) + " !important}" +
        '[data-sfb="fbtn"]:hover{background:' + cx(s, "#f1f5f9", "#1e293b") + " !important}" +
        '[data-sfb="sort"]:hover{background:' + cx(s, "#f1f5f9", "#1e293b") + " !important}" +
        '[data-sfb="reset"]:hover{background:' + cx(s, "#fef2f2", "rgba(239,68,68,0.1)") + " !important}" +
        '[data-sfb="sortopt"]:hover{background:' + cx(s, "#f8fafc", "#334155") + " !important}" +
        '[data-sfb="selall"]:hover{background:' + cx(s, "#eff6ff", "rgba(0,115,200,0.1)") + " !important}" +
        '[data-sfb="clrbtn"]:hover{background:' + cx(s, "#f1f5f9", "#334155") + " !important}" +
        '[data-sfb="chip"]:hover{background:' + cx(s, "#f1f5f9", "#334155") + " !important}" +
        '[data-sfb="chip"]:hover span[style*="opacity"]{opacity:0.8 !important}' +
        '[data-sfb="sinp"]:focus,[data-sfb="mfsinp"]:focus,[data-sfb="accsinp"]:focus{outline:none;border-color:' + s.corAccent + " !important;box-shadow:0 0 0 2px " + s.corAccent + "20 !important}" +
        '[data-sfb="mfbtn"]:hover{color:' + txC(s) + " !important}" +
        '[data-sfb="acc"]:hover{color:' + s.corAccent + " !important}" +
        '[data-sfb="mfitem"]:hover{background:' + bgHov(s) + " !important}" +
        '[data-sfb="mfapply"]:hover{opacity:0.85 !important}' +
        ".sfb-scroll::-webkit-scrollbar{width:4px}" +
        ".sfb-scroll::-webkit-scrollbar-track{background:transparent}" +
        ".sfb-scroll::-webkit-scrollbar-thumb{background:" + cx(s, "#cbd5e1", "#475569") + ";border-radius:99px}" +
        '.sfb-noscroll::-webkit-scrollbar{display:none}.sfb-noscroll{scrollbar-width:none;-ms-overflow-style:none}' +
        "</style>";
}

export function render(t: HTMLElement, s: VisualSettings, state: RenderState): void {
    const tx = tl(s);
    const fs = s.tamanhoFonte;
    const ff = "'" + s.fontFamily + "',wf-segoe-ui,helvetica,arial,sans-serif";
    const h: string[] = [];
    const _fields = state.fields;

    h.push(css(s));

    // Empty state
    if (_fields.length === 0) {
        h.push('<div style="display:flex;align-items:center;justify-content:center;height:100%;gap:8px;color:' + txS(s) + ";font-size:" + Math.max(fs - 1, 11) + "px;font-family:" + ff + ";font-style:italic;background:" + bgM(s) + ";" + (s.showBorda ? "border-bottom:" + s.larguraBorda + "px solid " + bdM(s) + ";" : "") + (s.showShadow ? "box-shadow:0 1px 3px rgba(0,0,0,0.04);" : "") + '">');
        h.push(EMPTY_ICON);
        h.push(tx.dragHere);
        h.push("</div>");
        safeInnerHTML(t, h.join(""));
        return;
    }

    // Outer wrapper
    h.push('<div data-sfb="wrap" style="position:relative;width:100%;height:100%;font-family:' + ff + ';overflow:hidden;">');

    // Bar
    const hasChips = s.showChips && totalSel(_fields) > 0;
    h.push('<div data-sfb="root" style="display:flex;align-items:center;height:40px;box-sizing:border-box;background:' + bgM(s) + ";padding:0 16px;gap:0;" + (s.showBorda ? "border-bottom:" + s.larguraBorda + "px solid " + bdM(s) + ";" : "") + (s.showShadow ? "box-shadow:0 1px 3px rgba(0,0,0,0.04);" : "") + '">');

    // Sort button
    if (s.showSort) {
        h.push('<div data-sfb="sort" role="button" style="display:flex;align-items:center;gap:4px;padding:4px 10px;background:none;font-family:inherit;font-size:' + fs + "px;font-weight:500;color:" + txS(s) + ";cursor:pointer;border-radius:" + s.borderRadiusBotao + 'px;white-space:nowrap;margin-right:6px;transition:background .15s;user-select:none;">');
        h.push(SORT_IC);
        h.push(" " + tx.sort + " ");
        h.push('<span style="display:flex;transition:transform .2s;' + (state.sortOpen ? "transform:rotate(180deg);" : "") + '">' + CHV + "</span>");
        h.push("</div>");
        h.push('<div style="width:1px;height:20px;background:' + sepC(s) + ';flex-shrink:0;margin-right:4px;"></div>');
    }

    // Filters area
    const align = s.alinhamento === "left" ? "flex-start" : s.alinhamento === "center" ? "center" : "flex-end";
    h.push('<div data-sfb="filters" style="display:flex;align-items:center;gap:6px;flex:1;justify-content:' + align + ';overflow-x:auto;padding:2px 0;">');

    const tfs = s.tamanhoTitulo || fs;
    const nMain = Math.min(s.numFiltrosPrincipais || 3, _fields.length);
    const hasMore = _fields.length > nMain;

    // Main filter buttons
    for (let fi = 0; fi < nMain; fi++) {
        const f = _fields[fi];
        let selCount = 0;
        const selKeys: string[] = [];
        for (const k in f.selected) if (f.selected[k]) { selCount++; selKeys.push(k); }
        const isOpen = state.openDD === fi;
        let valDisp = tx.allLabel;
        const modo = s.modoIndicador || "numero";
        if (modo === "selecao") {
            if (selCount === 1) { valDisp = selKeys[0] === "__null__" ? tx.empty : esc(selKeys[0]); }
            else if (selCount > 1) { valDisp = (selKeys[0] === "__null__" ? tx.empty : esc(selKeys[0])) + " +" + String(selCount - 1); }
        }

        h.push('<div data-sfb="fbtn" data-fi="' + fi + '" role="button" style="display:flex;align-items:center;gap:4px;padding:5px 10px;border:1px solid ' + cx(s, s.corBordaBtn, s.corBordaDark) + ";background:" + cx(s, "#fff", s.bgDark) + ";font-family:inherit;font-size:" + tfs + "px;color:" + txC(s) + ";cursor:pointer;border-radius:" + s.borderRadiusBotao + 'px;white-space:nowrap;transition:all .15s;user-select:none;">');
        if (modo === "selecao") {
            h.push('<span style="color:' + txS(s) + ';margin-right:2px;">' + esc(f.name) + ":</span>");
            h.push('<span style="font-weight:500;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + valDisp + "</span>");
        } else {
            h.push('<span style="font-weight:500;">' + esc(f.name) + "</span>");
            if (selCount > 0) {
                h.push('<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:' + s.corAccent + ';color:#fff;font-size:11px;font-weight:600;line-height:1;">' + selCount + "</span>");
            }
        }
        h.push('<span style="display:flex;flex-shrink:0;color:' + txS(s) + ";margin-left:2px;transition:transform .2s;" + (isOpen ? "transform:rotate(180deg);" : "") + '">' + CHV + "</span>");
        h.push("</div>");
    }

    // More Filters button
    if (hasMore) {
        h.push('<span style="width:1px;height:16px;background:' + cx(s, s.corBordaBtn, s.corBordaDark) + ';flex-shrink:0;margin:0 2px;" aria-hidden="true"></span>');
        h.push('<div data-sfb="mfbtn" role="button" style="display:flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid ' + cx(s, s.corBordaBtn, s.corBordaDark) + ";background:" + (state.mfOpen ? cx(s, "#f1f5f9", "#1e293b") : cx(s, "#fff", s.bgDark)) + ";font-family:inherit;font-size:" + tfs + "px;color:" + txS(s) + ";cursor:pointer;border-radius:" + s.borderRadiusBotao + 'px;white-space:nowrap;transition:all .15s;user-select:none;">');
        h.push(SLIDERS);
        h.push(" " + tx.moreFilters);
        h.push("</div>");
    }

    // Reset button
    if (s.showResetBtn !== false) {
        const ts = totalSel(_fields);
        h.push('<div data-sfb="reset" role="button" style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:none;font-family:inherit;font-size:' + (fs - 1) + "px;font-weight:500;color:" + resetC(s) + ";cursor:pointer;border-radius:" + s.borderRadiusBotao + "px;white-space:nowrap;margin-left:6px;transition:background .15s;user-select:none;opacity:" + (ts > 0 ? "1" : "0.4") + ";pointer-events:" + (ts > 0 ? "auto" : "none") + ';">');
        h.push(XICON);
        h.push(" " + tx.clrAll);
        h.push("</div>");
    }

    h.push("</div>"); // filters
    h.push("</div>"); // bar (root)

    // Chips row
    if (hasChips) {
        renderChips(h, s, _fields, tx, fs);
    }

    // Sort dropdown
    if (state.sortOpen && s.showSort) {
        renderSortDropdown(h, s, _fields, tx, fs);
    }

    // Filter dropdown
    if (state.openDD >= 0 && state.openDD < nMain && state.openDD < _fields.length) {
        renderFilterDropdown(h, s, state, _fields, tx, fs);
    }

    // More Filters panel
    if (state.mfOpen && hasMore) {
        renderMoreFiltersPanel(h, s, state, _fields, nMain, tx, fs);
    }

    h.push("</div>"); // wrap
    safeInnerHTML(t, h.join(""));

    // Position dropdown
    positionDropdown(t, state.openDD);
}

function renderChips(h: string[], s: VisualSettings, fields: FieldData[], tx: LangStrings, fs: number): void {
    const chipBg = cx(s, "#f8fafc", "#0f172a");
    h.push('<div data-sfb="chiprow" style="display:flex;align-items:center;gap:6px;padding:5px 16px;flex-wrap:wrap;box-sizing:border-box;background:' + chipBg + ";" + (s.showBorda ? "border-bottom:" + s.larguraBorda + "px solid " + bdM(s) + ";" : "") + '">');
    h.push('<span style="font-size:' + (fs - 2) + "px;color:" + txS(s) + ';font-weight:500;margin-right:2px;flex-shrink:0;">' + tx.filtersLabel + "</span>");
    for (let ci = 0; ci < fields.length; ci++) {
        const cf = fields[ci];
        for (const ck in cf.selected) {
            if (!cf.selected[ck]) continue;
            const cDisp = ck === "__null__" ? tx.empty : esc(ck);
            h.push('<div data-sfb="chip" data-fi="' + ci + '" data-key="' + esc(ck).replace(/"/g, "&quot;") + '" style="display:inline-flex;align-items:center;gap:4px;padding:2px 6px 2px 10px;border:1px solid ' + bdM(s) + ";border-radius:12px;font-size:" + (fs - 2) + "px;color:" + txC(s) + ";background:" + cx(s, "#ffffff", "#1e293b") + ';cursor:pointer;transition:background .15s;user-select:none;">');
            h.push('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;">' + cDisp + "</span>");
            h.push('<span style="display:flex;opacity:0.4;transition:opacity .15s;" data-sfb="chip" data-fi="' + ci + '" data-key="' + esc(ck).replace(/"/g, "&quot;") + '">' + XICON + "</span>");
            h.push("</div>");
        }
    }
    h.push("</div>");
}

function renderSortDropdown(h: string[], s: VisualSettings, fields: FieldData[], tx: LangStrings, fs: number): void {
    const curSort = fields.length > 0 ? fields[0].sortMode : "orig";
    h.push('<div data-sfb="sortdd" style="position:absolute;top:44px;left:8px;background:' + ddBg(s) + ";border:1px solid " + ddBd(s) + ";border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0," + (s.darkMode ? "0.3" : "0.08") + '),0 2px 8px rgba(0,0,0,0.04);min-width:160px;z-index:200;padding:4px 0;">');
    const sortOpts = [
        { k: "orig", lb: tx.sortOrig || "Original", ic: SORT_OR },
        { k: "az", lb: tx.sortAZ, ic: SORT_AZ },
        { k: "za", lb: tx.sortZA, ic: SORT_ZA },
        { k: "count", lb: tx.sortCount, ic: SORT_CT },
    ];
    for (const so of sortOpts) {
        const isAct = curSort === so.k;
        h.push('<div data-sfb="sortopt" data-sort="' + so.k + '" style="display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;font-size:' + fs + "px;color:" + (isAct ? acTx(s) : cx(s, "#334155", "#e2e8f0")) + ";font-weight:" + (isAct ? "600" : "400") + ';transition:background .1s;border-radius:4px;margin:0 4px;user-select:none;">' + so.ic + " " + so.lb + "</div>");
    }
    h.push("</div>");
}

function renderFilterDropdown(h: string[], s: VisualSettings, state: RenderState, fields: FieldData[], tx: LangStrings, fs: number): void {
    const f = fields[state.openDD];
    const items = sortIt(f.items, f.sortMode);
    const sq = state.sq[state.openDD] || "";
    const ss = f.selected;

    h.push('<div data-sfb="dd" data-fi="' + state.openDD + '" style="position:absolute;top:44px;background:' + ddBg(s) + ";border:1px solid " + ddBd(s) + ";border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0," + (s.darkMode ? "0.3" : "0.08") + '),0 2px 8px rgba(0,0,0,0.04);min-width:200px;max-width:280px;z-index:200;overflow:hidden;">');

    // Search
    if (s.showSearch) {
        h.push('<div style="padding:8px 10px;border-bottom:1px solid ' + ddLine(s) + ';">');
        h.push('<input data-sfb="sinp" type="text" value="' + esc(sq).replace(/"/g, "&quot;") + '" placeholder="' + tx.searchPh + '" style="width:100%;border:1px solid ' + inputBd(s) + ";border-radius:5px;padding:6px 8px 6px 28px;font-family:inherit;font-size:" + (fs - 1) + "px;color:" + inputC(s) + ";outline:none;background:" + bgI(s) + " url(" + SSIG + ') 8px center no-repeat;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;">');
        h.push("</div>");
    }

    // Select all / Clear
    if (s.showSelectAll) {
        const fltItems: FieldItem[] = [];
        for (const it of items) {
            const disp = it.display || tx.empty;
            if (sq && disp.toLowerCase().indexOf(sq.toLowerCase()) < 0) continue;
            fltItems.push(it);
        }
        const allS = fltItems.length > 0 && fltItems.every(it => { const ik = it.value == null ? "__null__" : String(it.value); return !!ss[ik]; });
        const someS = fltItems.some(it => { const ik = it.value == null ? "__null__" : String(it.value); return !!ss[ik]; });

        h.push('<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;border-bottom:1px solid ' + ddLine(s) + ';">');
        h.push('<div data-sfb="selall" data-fi="' + state.openDD + '" role="button" style="display:flex;align-items:center;gap:6px;background:none;font-family:inherit;font-size:' + (fs - 2) + "px;font-weight:500;color:" + acTx(s) + ';cursor:pointer;padding:3px 4px;border-radius:4px;transition:background .15s;user-select:none;">');
        const saStyle = allS ? "background:" + s.corCheckAtivo + ";border-color:" + s.corCheckAtivo : (someS ? "border-color:" + s.corCheckAtivo : "border-color:" + ckBd(s));
        const saIcon = allS ? CHK : (someS ? HALF : "");
        h.push('<div style="width:14px;height:14px;border:1.5px solid transparent;border-radius:' + Math.max(s.borderRadiusCheck - 1, 2) + 'px;display:flex;align-items:center;justify-content:center;flex-shrink:0;' + saStyle + '">' + saIcon + "</div>");
        h.push(tx.selAll);
        h.push("</div>");
        h.push('<div data-sfb="clrbtn" data-fi="' + state.openDD + '" role="button" style="background:none;font-family:inherit;font-size:' + (fs - 2) + "px;font-weight:500;color:" + txS(s) + ';cursor:pointer;padding:3px 4px;border-radius:4px;transition:background .15s;user-select:none;">' + tx.clr + "</div>");
        h.push("</div>");
    }

    // Items list
    h.push('<div class="sfb-scroll" style="max-height:250px;overflow-y:auto;padding:2px 0;">');
    let visCount = 0;
    for (const it of items) {
        const display = it.display || tx.empty;
        const key = it.value == null ? "__null__" : String(it.value);
        if (sq && display.toLowerCase().indexOf(sq.toLowerCase()) < 0) continue;
        visCount++;
        const isSel = !!ss[key];

        h.push('<div data-sfb="item" data-fi="' + state.openDD + '" data-key="' + esc(key).replace(/"/g, "&quot;") + '" style="display:flex;align-items:center;gap:9px;padding:6px 12px;cursor:pointer;font-size:' + fs + "px;color:" + (isSel ? cx(s, "#1e293b", "#f1f5f9") : cx(s, "#334155", "#e2e8f0")) + ";transition:background .1s;" + (isSel ? "font-weight:500;" : "") + '">');
        h.push('<div style="width:15px;height:15px;border:' + (isSel ? "none" : "1.5px solid " + ckBd(s)) + ";border-radius:" + s.borderRadiusCheck + "px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:" + (isSel ? s.corCheckAtivo : ckBg(s)) + ';transition:all .15s;">');
        if (isSel) h.push(CHK);
        h.push("</div>");
        h.push('<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + esc(display) + "</span>");
        h.push("</div>");
    }
    if (visCount === 0) {
        h.push('<div style="padding:14px;text-align:center;color:' + txS(s) + ";font-size:" + (fs - 1) + 'px;font-style:italic;">' + tx.noResult + "</div>");
    }
    h.push("</div>"); // list
    h.push("</div>"); // dropdown
}

function renderMoreFiltersPanel(h: string[], s: VisualSettings, state: RenderState, fields: FieldData[], nMain: number, tx: LangStrings, fs: number): void {
    const mfLow = state.mfSearch.toLowerCase();
    h.push('<div data-sfb="mfpanel" style="position:absolute;top:44px;right:8px;background:' + ddBg(s) + ";border:1px solid " + ddBd(s) + ";border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0," + (s.darkMode ? "0.4" : "0.12") + '),0 4px 12px rgba(0,0,0,0.06);width:280px;z-index:200;display:flex;flex-direction:column;max-height:calc(100% - 52px);overflow:hidden;">');

    // Header
    h.push('<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px;">');
    h.push('<span style="font-size:14px;font-weight:600;color:' + txC(s) + ';">' + tx.filtersLabel + "</span>");
    h.push('<div style="display:flex;align-items:center;gap:8px;">');
    if (totalSel(fields) > 0) {
        h.push('<div data-sfb="mfclear" role="button" style="font-size:12px;font-weight:500;color:' + resetC(s) + ';cursor:pointer;user-select:none;">' + tx.clr + "</div>");
    }
    h.push('<div data-sfb="mfclose" role="button" style="display:flex;cursor:pointer;color:' + txS(s) + ';padding:2px;border-radius:4px;transition:color .15s;">' + XICON + "</div>");
    h.push("</div></div>");

    // Global search
    h.push('<div style="padding:0 16px 8px;"><div style="position:relative;">');
    h.push('<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);display:flex;color:' + txS(s) + ';">' + SEARCH_IC + "</span>");
    h.push('<input data-sfb="mfsinp" type="text" value="' + esc(state.mfSearch).replace(/"/g, "&quot;") + '" placeholder="' + tx.searchFilters + '" style="width:100%;border:1px solid ' + inputBd(s) + ";border-radius:6px;padding:6px 10px 6px 32px;font-family:inherit;font-size:12px;color:" + inputC(s) + ";outline:none;background:" + bgI(s) + ';box-sizing:border-box;transition:border-color .15s,box-shadow .15s;">');
    h.push("</div></div>");

    // Accordion sections
    h.push('<div class="sfb-noscroll" style="padding:0 16px;overflow-y:auto;flex:1;">');
    for (let mi = nMain; mi < fields.length; mi++) {
        const mf = fields[mi];
        if (mfLow && mf.name.toLowerCase().indexOf(mfLow) < 0) continue;
        let mfSelCount = 0;
        for (const mk in mf.selected) if (mf.selected[mk]) mfSelCount++;
        const accIsOpen = !!state.accOpen[mi];
        const isLast = mi === fields.length - 1;

        h.push('<div style="border-bottom:' + (isLast ? "none" : "1px solid " + ddLine(s)) + ';">');
        h.push('<div data-sfb="acc" data-fi="' + mi + '" role="button" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 4px;color:' + txC(s) + ';cursor:pointer;transition:color .15s;user-select:none;">');
        h.push('<span style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;">' + esc(mf.name));
        if (mfSelCount > 0) {
            h.push(' <span style="display:inline-flex;align-items:center;justify-content:center;background:' + s.corAccent + ';color:#fff;font-size:9px;font-weight:600;min-width:14px;height:14px;border-radius:99px;padding:0 3px;line-height:1;">' + mfSelCount + "</span>");
        }
        h.push("</span>");
        h.push('<span style="color:' + txS(s) + ';display:flex;">' + (accIsOpen ? MINUS_IC : PLUS_IC) + "</span>");
        h.push("</div>");

        if (accIsOpen) {
            const accItems = sortIt(mf.items, mf.sortMode);
            const accSq = state.accSearch[mi] || "";
            const showAccSearch = mf.items.length > 8;

            h.push('<div style="padding-bottom:12px;padding-left:4px;padding-right:4px;">');
            if (showAccSearch) {
                h.push('<div style="position:relative;margin-bottom:8px;">');
                h.push('<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);display:flex;color:' + txS(s) + ';">' + SEARCH_IC + "</span>");
                h.push('<input data-sfb="accsinp" data-fi="' + mi + '" type="text" value="' + esc(accSq).replace(/"/g, "&quot;") + '" placeholder="' + tx.searchPh + '" style="width:100%;border:1px solid ' + inputBd(s) + ";border-radius:6px;padding:5px 8px 5px 30px;font-family:inherit;font-size:12px;color:" + inputC(s) + ";outline:none;background:" + bgI(s) + ';box-sizing:border-box;transition:border-color .15s,box-shadow .15s;">');
                h.push("</div>");
            }

            h.push('<div class="sfb-noscroll" style="display:flex;flex-direction:column;gap:2px;max-height:140px;overflow-y:auto;">');
            let mfVisCount = 0;
            for (const ait of accItems) {
                const aDisp = ait.display || tx.empty;
                const aKey = ait.value == null ? "__null__" : String(ait.value);
                if (accSq && aDisp.toLowerCase().indexOf(accSq.toLowerCase()) < 0) continue;
                mfVisCount++;
                const aiSel = !!mf.selected[aKey];

                h.push('<div data-sfb="mfitem" data-fi="' + mi + '" data-key="' + esc(aKey).replace(/"/g, "&quot;") + '" style="display:flex;align-items:center;gap:8px;padding:4px 4px;border-radius:4px;cursor:pointer;transition:background .1s;user-select:none;">');
                h.push('<span style="width:16px;height:16px;border:' + (aiSel ? "none" : "1.5px solid " + ckBd(s)) + ";border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:" + (aiSel ? s.corCheckAtivo : ckBg(s)) + ';transition:all .15s;">');
                if (aiSel) h.push(CHK);
                h.push("</span>");
                h.push('<span style="font-size:12px;color:' + txC(s) + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + esc(aDisp) + "</span>");
                h.push("</div>");
            }
            if (mfVisCount === 0) {
                h.push('<div style="padding:8px;text-align:center;color:' + txS(s) + ';font-size:11px;font-style:italic;">' + tx.noResult + "</div>");
            }
            h.push("</div>"); // items
            h.push("</div>"); // accordion body
        }
        h.push("</div>"); // accordion section
    }
    h.push("</div>"); // accordion container

    // Footer - Apply button
    h.push('<div style="padding:12px 16px;">');
    h.push('<div data-sfb="mfapply" role="button" style="width:100%;background:' + s.corAccent + ';color:#fff;padding:8px;border-radius:6px;text-align:center;font-size:13px;font-weight:500;cursor:pointer;transition:opacity .15s;user-select:none;">' + tx.applyFilters + "</div>");
    h.push("</div>");
    h.push("</div>"); // mfpanel
}

function positionDropdown(t: HTMLElement, openDD: number): void {
    if (openDD < 0) return;
    const ddEl = t.querySelector('[data-sfb="dd"]') as HTMLElement | null;
    const btnEl = t.querySelector('[data-sfb="fbtn"][data-fi="' + openDD + '"]') as HTMLElement | null;
    const wrapEl = t.querySelector('[data-sfb="wrap"]') as HTMLElement | null;
    if (!ddEl || !btnEl || !wrapEl) return;

    const wrapRect = wrapEl.getBoundingClientRect();
    const btnRect = btnEl.getBoundingClientRect();
    const leftPos = btnRect.left - wrapRect.left;

    if (leftPos + 220 > wrapRect.width) {
        ddEl.style.right = Math.max(0, wrapRect.right - btnRect.right) + "px";
        ddEl.style.left = "auto";
    } else {
        ddEl.style.left = leftPos + "px";
    }

    const avail = wrapRect.height - 48;
    if (avail > 80) {
        ddEl.style.maxHeight = avail + "px";
        ddEl.style.display = "flex";
        ddEl.style.flexDirection = "column";
        const listEl = ddEl.querySelector(".sfb-scroll") as HTMLElement | null;
        if (listEl) {
            const ddRect = ddEl.getBoundingClientRect();
            const listTop = listEl.getBoundingClientRect().top - ddRect.top;
            listEl.style.maxHeight = Math.max(60, avail - listTop - 4) + "px";
        }
    }

    // Focus search input
    const sinp = t.querySelector('[data-sfb="sinp"]') as HTMLInputElement | null;
    if (sinp) setTimeout(() => sinp.focus(), 30);
}
