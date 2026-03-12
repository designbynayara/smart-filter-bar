/**
 * SmartFilterBar i18n — translation strings for pt-BR and en.
 */

import { VisualSettings } from "./settings";

export interface LangStrings {
    sort: string;
    searchPh: string;
    selAll: string;
    clr: string;
    clrAll: string;
    noResult: string;
    dragHere: string;
    empty: string;
    sortAZ: string;
    sortZA: string;
    sortCount: string;
    sortOrig: string;
    filtersLabel: string;
    moreFilters: string;
    applyFilters: string;
    allLabel: string;
    searchFilters: string;
    sub: (n: number) => string;
}

const L: Record<string, LangStrings> = {
    "pt-BR": {
        sort: "Ordenar",
        searchPh: "Buscar...",
        selAll: "Selecionar todos",
        clr: "Limpar",
        clrAll: "Limpar tudo",
        noResult: "Nenhum resultado",
        dragHere: "Arraste campos aqui para criar filtros",
        empty: "(Vazio)",
        sortAZ: "A - Z",
        sortZA: "Z - A",
        sortCount: "Contagem",
        sortOrig: "Original",
        filtersLabel: "Filtros",
        moreFilters: "Mais Filtros",
        applyFilters: "Aplicar Filtros",
        allLabel: "Todos",
        searchFilters: "Buscar filtros...",
        sub: (n: number) => n + " selecionado" + (n !== 1 ? "s" : ""),
    },
    "en": {
        sort: "Sort",
        searchPh: "Search...",
        selAll: "Select all",
        clr: "Clear",
        clrAll: "Clear all",
        noResult: "No results",
        dragHere: "Drag fields here to create filters",
        empty: "(Empty)",
        sortAZ: "A - Z",
        sortZA: "Z - A",
        sortCount: "Count",
        sortOrig: "Original",
        filtersLabel: "Filters",
        moreFilters: "More Filters",
        applyFilters: "Apply Filters",
        allLabel: "All",
        searchFilters: "Search filters...",
        sub: (n: number) => n + " selected",
    },
};

export function tl(s: VisualSettings): LangStrings {
    return L[s.idioma] || L["pt-BR"];
}
