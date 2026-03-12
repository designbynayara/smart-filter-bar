/**
 * SmartFilterBar Visual — main IVisual class.
 * SDK-based implementation for AppSource certification.
 */

import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;

import { VisualSettings, defaults, getSettings } from "./settings";
import { FieldData, parseData } from "./dataParser";
import { applyFilter, restoreFilters, totalSel } from "./filterManager";
import { render, RenderState } from "./renderer";
import { safeInnerHTML } from "./sanitize";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private selMgr: ISelectionManager;
    private events: IVisualEventService;

    private _s: VisualSettings;
    private _fields: FieldData[];
    private _openDD: number;
    private _sortOpen: boolean;
    private _sq: Record<number, string>;
    private _mfOpen: boolean;
    private _accOpen: Record<number, boolean>;
    private _mfSearch: string;
    private _accSearch: Record<number, string>;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.selMgr = this.host.createSelectionManager();
        this.events = this.host.eventService;

        this._s = defaults();
        this._fields = [];
        this._openDD = -1;
        this._sortOpen = false;
        this._sq = {};
        this._mfOpen = false;
        this._accOpen = {};
        this._mfSearch = "";
        this._accSearch = {};

        this.target.style.overflow = "visible";

        // Event delegation: click
        this.target.addEventListener("click", (e: MouseEvent) => {
            this.handleClick(e);
        });

        // Event delegation: input (search fields)
        this.target.addEventListener("input", (e: Event) => {
            this.handleInput(e);
        });

        // Context menu (required for certification)
        this.target.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selMgr.showContextMenu(
                {} as powerbi.extensibility.ISelectionId,
                { x: e.clientX, y: e.clientY }
            );
            e.preventDefault();
        });
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);

        const dv: DataView | undefined = options?.dataViews?.[0];
        const s = getSettings(dv);
        this._s = s;

        // Smart field update: preserve state if fields haven't changed
        const newFields = parseData(dv);
        let sameFields = newFields.length === this._fields.length;
        if (sameFields) {
            for (let i = 0; i < newFields.length; i++) {
                if (newFields[i].name !== this._fields[i].name) {
                    sameFields = false;
                    break;
                }
            }
        }

        if (sameFields && this._fields.length > 0) {
            // Same fields: update items/raw but keep sortMode and selected
            for (let i = 0; i < this._fields.length; i++) {
                this._fields[i].items = newFields[i].items;
                this._fields[i].raw = newFields[i].raw;
                this._fields[i].cat = newFields[i].cat;
            }
        } else {
            // Fields changed: full rebuild with state restoration
            const oldSel: Record<string, Record<string, boolean>> = {};
            const oldSort: Record<string, string> = {};
            for (const f of this._fields) {
                oldSel[f.name] = f.selected;
                oldSort[f.name] = f.sortMode;
            }
            this._fields = newFields;
            for (const f of this._fields) {
                if (oldSel[f.name]) f.selected = oldSel[f.name];
                if (oldSort[f.name]) f.sortMode = oldSort[f.name];
                else f.sortMode = s.sortMode || "orig";
            }
        }

        // Restore selections from jsonFilters (page navigation / sync slicers)
        if (totalSel(this._fields) === 0) {
            restoreFilters(this._fields, options, dv);
        }

        this.doRender();

        // Fetch more data if Power BI has additional rows
        try {
            if (dv?.metadata?.segment) {
                this.host.fetchMoreData(true);
            }
        } catch (_e) { /* ignore */ }

        this.events.renderingFinished(options);
    }

    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions
    ): VisualObjectInstanceEnumeration {
        const s = this._s || defaults();
        const r: VisualObjectInstance[] = [];

        switch (options.objectName) {
            case "configGeral":
                r.push({
                    objectName: "configGeral", selector: null, properties: {
                        bgBar: { solid: { color: s.bgBar } },
                        corAccent: { solid: { color: s.corAccent } },
                        fontFamily: s.fontFamily,
                        borderRadius: s.borderRadius,
                        showShadow: s.showShadow,
                        showSort: s.showSort,
                        showSearch: s.showSearch,
                        showChips: s.showChips,
                        showResetBtn: s.showResetBtn,
                        alinhamento: s.alinhamento,
                        idioma: s.idioma,
                        numFiltrosPrincipais: s.numFiltrosPrincipais,
                        sortMode: s.sortMode,
                    }
                });
                break;
            case "configTexto":
                r.push({
                    objectName: "configTexto", selector: null, properties: {
                        corTexto: { solid: { color: s.corTexto } },
                        corTextoSec: { solid: { color: s.corTextoSec } },
                        tamanhoFonte: s.tamanhoFonte,
                        pesoFonte: s.pesoFonte,
                        tamanhoTitulo: s.tamanhoTitulo,
                    }
                });
                break;
            case "configCheckbox":
                r.push({
                    objectName: "configCheckbox", selector: null, properties: {
                        corCheckAtivo: { solid: { color: s.corCheckAtivo } },
                        corHover: { solid: { color: s.corHover } },
                        showSelectAll: s.showSelectAll,
                        borderRadiusCheck: s.borderRadiusCheck,
                    }
                });
                break;
            case "configBotoes":
                r.push({
                    objectName: "configBotoes", selector: null, properties: {
                        corBordaBtn: { solid: { color: s.corBordaBtn } },
                        borderRadiusBotao: s.borderRadiusBotao,
                        showBordaAtiva: s.showBordaAtiva,
                        modoIndicador: s.modoIndicador,
                    }
                });
                break;
            case "configBorda":
                r.push({
                    objectName: "configBorda", selector: null, properties: {
                        showBorda: s.showBorda,
                        corBorda: { solid: { color: s.corBorda } },
                        larguraBorda: s.larguraBorda,
                    }
                });
                break;
            case "configDarkMode":
                r.push({
                    objectName: "configDarkMode", selector: null, properties: {
                        darkMode: s.darkMode,
                        bgDark: { solid: { color: s.bgDark } },
                        corBordaDark: { solid: { color: s.corBordaDark } },
                    }
                });
                break;
        }

        return r;
    }

    public destroy(): void {
        if (this.target) safeInnerHTML(this.target, "");
    }

    // ──────── Private helpers ────────

    private doRender(): void {
        const state: RenderState = {
            fields: this._fields,
            openDD: this._openDD,
            sortOpen: this._sortOpen,
            sq: this._sq,
            mfOpen: this._mfOpen,
            accOpen: this._accOpen,
            mfSearch: this._mfSearch,
            accSearch: this._accSearch,
        };
        render(this.target, this._s, state);
    }

    private findSfb(el: EventTarget | null): HTMLElement | null {
        let c = el as HTMLElement | null;
        while (c && c !== this.target) {
            if (c.getAttribute && c.getAttribute("data-sfb")) return c;
            c = c.parentNode as HTMLElement | null;
        }
        return null;
    }

    private handleClick(e: MouseEvent): void {
        try {
            const a = this.findSfb(e.target);
            if (!a) {
                this._openDD = -1;
                this._sortOpen = false;
                this._mfOpen = false;
                this.doRender();
                return;
            }

            const sfb = a.getAttribute("data-sfb")!;
            const fi = parseInt(a.getAttribute("data-fi") || "", 10);
            const key = a.getAttribute("data-key");
            const sort = a.getAttribute("data-sort");

            if (sfb === "fbtn" && !isNaN(fi)) {
                this._sortOpen = false;
                this._mfOpen = false;
                this._openDD = this._openDD === fi ? -1 : fi;
                this.doRender();
                e.stopPropagation();
            } else if (sfb === "mfbtn") {
                this._openDD = -1;
                this._sortOpen = false;
                this._mfOpen = !this._mfOpen;
                this.doRender();
                e.stopPropagation();
            } else if (sfb === "mfclose") {
                this._mfOpen = false;
                this.doRender();
                e.stopPropagation();
            } else if (sfb === "mfapply") {
                this._mfOpen = false;
                applyFilter(this.host, this.selMgr, this._fields);
                this.doRender();
                e.stopPropagation();
            } else if (sfb === "mfclear") {
                for (const f of this._fields) f.selected = {};
                this._accSearch = {};
                this.doRender();
                e.stopPropagation();
            } else if (sfb === "acc" && !isNaN(fi)) {
                this._accOpen[fi] = !this._accOpen[fi];
                this.doRender();
                e.stopPropagation();
            } else if (sfb === "mfitem" && !isNaN(fi) && key != null) {
                if (this._fields[fi]) {
                    if (this._fields[fi].selected[key]) delete this._fields[fi].selected[key];
                    else this._fields[fi].selected[key] = true;
                    this.doRender();
                }
                e.stopPropagation();
            } else if (sfb === "sort") {
                this._openDD = -1;
                this._mfOpen = false;
                this._sortOpen = !this._sortOpen;
                this.doRender();
                e.stopPropagation();
            } else if (sfb === "sortopt" && sort) {
                for (const f of this._fields) f.sortMode = sort;
                this._s.sortMode = sort;
                this._sortOpen = false;
                try {
                    this.host.persistProperties({
                        merge: [{
                            objectName: "configGeral",
                            selector: null,
                            properties: { sortMode: sort },
                        }]
                    });
                } catch (_pe) { /* ignore */ }
                this.doRender();
                e.stopPropagation();
            } else if (sfb === "item" && !isNaN(fi) && key != null) {
                if (this._fields[fi]) {
                    if (this._fields[fi].selected[key]) delete this._fields[fi].selected[key];
                    else this._fields[fi].selected[key] = true;
                    applyFilter(this.host, this.selMgr, this._fields);
                    this.doRender();
                }
                e.stopPropagation();
            } else if (sfb === "selall" && !isNaN(fi)) {
                if (this._fields[fi]) {
                    const sq = this._sq[fi] || "";
                    const items = this._fields[fi].items;
                    const flt = items.filter(it => {
                        if (!sq) return true;
                        return (it.display || "").toLowerCase().indexOf(sq.toLowerCase()) >= 0;
                    });
                    const allS = flt.length > 0 && flt.every(it => {
                        const ik = it.value == null ? "__null__" : String(it.value);
                        return !!this._fields[fi].selected[ik];
                    });
                    for (const it of flt) {
                        const ik = it.value == null ? "__null__" : String(it.value);
                        if (allS) delete this._fields[fi].selected[ik];
                        else this._fields[fi].selected[ik] = true;
                    }
                    applyFilter(this.host, this.selMgr, this._fields);
                    this.doRender();
                }
                e.stopPropagation();
            } else if (sfb === "clrbtn" && !isNaN(fi)) {
                if (this._fields[fi]) {
                    this._fields[fi].selected = {};
                    applyFilter(this.host, this.selMgr, this._fields);
                    this.doRender();
                }
                e.stopPropagation();
            } else if (sfb === "chip" && !isNaN(fi) && key != null) {
                if (this._fields[fi]?.selected[key]) {
                    delete this._fields[fi].selected[key];
                    applyFilter(this.host, this.selMgr, this._fields);
                    this.doRender();
                }
                e.stopPropagation();
            } else if (sfb === "reset") {
                for (const f of this._fields) f.selected = {};
                this._sq = {};
                this._accSearch = {};
                this._mfOpen = false;
                this._accOpen = {};
                applyFilter(this.host, this.selMgr, this._fields);
                this.doRender();
                e.stopPropagation();
            } else if (
                sfb === "dd" || sfb === "sortdd" || sfb === "sinp" ||
                sfb === "filters" || sfb === "chiprow" || sfb === "mfpanel" ||
                sfb === "mfsinp" || sfb === "accsinp"
            ) {
                e.stopPropagation();
            } else if (sfb === "root") {
                this._openDD = -1;
                this._sortOpen = false;
                this._mfOpen = false;
                this.doRender();
            }
        } catch (_err) { /* ignore */ }
    }

    private handleInput(e: Event): void {
        try {
            const el = e.target as HTMLElement;
            if (!el?.getAttribute) return;
            const sfbType = el.getAttribute("data-sfb");
            const val = (el as HTMLInputElement).value;

            if (sfbType === "sinp") {
                this._sq[this._openDD] = val;
                this.doRender();
                const sinp = this.target.querySelector('[data-sfb="sinp"]') as HTMLInputElement | null;
                if (sinp) {
                    sinp.focus();
                    try { sinp.setSelectionRange(val.length, val.length); } catch (_x) { /* */ }
                }
            } else if (sfbType === "mfsinp") {
                this._mfSearch = val;
                this.doRender();
                const mfinp = this.target.querySelector('[data-sfb="mfsinp"]') as HTMLInputElement | null;
                if (mfinp) {
                    mfinp.focus();
                    try { mfinp.setSelectionRange(val.length, val.length); } catch (_x) { /* */ }
                }
            } else if (sfbType === "accsinp") {
                const afi = parseInt(el.getAttribute("data-fi") || "", 10);
                if (!isNaN(afi)) {
                    this._accSearch[afi] = val;
                }
                this.doRender();
                const ainp = this.target.querySelector(
                    '[data-sfb="accsinp"][data-fi="' + afi + '"]'
                ) as HTMLInputElement | null;
                if (ainp) {
                    ainp.focus();
                    try { ainp.setSelectionRange(val.length, val.length); } catch (_x) { /* */ }
                }
            }
        } catch (_err) { /* ignore */ }
    }
}
