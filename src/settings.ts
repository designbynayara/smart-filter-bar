/**
 * SmartFilterBar Settings — defaults + dataView reader.
 */

import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

export interface VisualSettings {
    bgBar: string;
    corAccent: string;
    fontFamily: string;
    borderRadius: number;
    showShadow: boolean;
    showSort: boolean;
    showSearch: boolean;
    showChips: boolean;
    showResetBtn: boolean;
    alinhamento: string;
    idioma: string;
    numFiltrosPrincipais: number;
    sortMode: string;
    corTexto: string;
    corTextoSec: string;
    tamanhoFonte: number;
    pesoFonte: string;
    tamanhoTitulo: number;
    corCheckAtivo: string;
    corHover: string;
    showSelectAll: boolean;
    borderRadiusCheck: number;
    corBordaBtn: string;
    borderRadiusBotao: number;
    showBordaAtiva: boolean;
    modoIndicador: string;
    showBorda: boolean;
    corBorda: string;
    larguraBorda: number;
    darkMode: boolean;
    bgDark: string;
    corBordaDark: string;
}

export function defaults(): VisualSettings {
    return {
        bgBar: "#ffffff",
        corAccent: "#0073c8",
        fontFamily: "Segoe UI",
        borderRadius: 10,
        showShadow: true,
        showSort: true,
        showSearch: true,
        showChips: true,
        showResetBtn: true,
        alinhamento: "right",
        idioma: "pt-BR",
        numFiltrosPrincipais: 3,
        sortMode: "orig",
        corTexto: "#64748b",
        corTextoSec: "#94a3b8",
        tamanhoFonte: 13,
        pesoFonte: "600",
        tamanhoTitulo: 13,
        corCheckAtivo: "#0073c8",
        corHover: "#f8fafc",
        showSelectAll: true,
        borderRadiusCheck: 4,
        corBordaBtn: "#e2e8f0",
        borderRadiusBotao: 6,
        showBordaAtiva: false,
        modoIndicador: "numero",
        showBorda: true,
        corBorda: "#e2e8f0",
        larguraBorda: 1,
        darkMode: false,
        bgDark: "#0f172a",
        corBordaDark: "#1e293b",
    };
}

function rf(o: any, g: string, p: string, d: string): string {
    try { return o[g][p].solid.color || d; } catch { return d; }
}

function rv<T>(o: any, g: string, p: string, d: T): T {
    try { const v = o[g][p]; return v != null ? v : d; } catch { return d; }
}

export function getSettings(dv: DataView | undefined): VisualSettings {
    const s = defaults();
    if (!dv?.metadata?.objects) return s;
    const o = dv.metadata.objects;

    s.bgBar = rf(o, "configGeral", "bgBar", s.bgBar);
    s.corAccent = rf(o, "configGeral", "corAccent", s.corAccent);
    s.fontFamily = rv(o, "configGeral", "fontFamily", s.fontFamily);
    s.borderRadius = rv(o, "configGeral", "borderRadius", s.borderRadius);
    s.showShadow = rv(o, "configGeral", "showShadow", s.showShadow);
    s.showSort = rv(o, "configGeral", "showSort", s.showSort);
    s.showSearch = rv(o, "configGeral", "showSearch", s.showSearch);
    s.showChips = rv(o, "configGeral", "showChips", s.showChips);
    s.showResetBtn = rv(o, "configGeral", "showResetBtn", s.showResetBtn);
    s.alinhamento = rv(o, "configGeral", "alinhamento", s.alinhamento);
    s.idioma = rv(o, "configGeral", "idioma", s.idioma);
    s.numFiltrosPrincipais = Math.max(1, Math.round(rv(o, "configGeral", "numFiltrosPrincipais", s.numFiltrosPrincipais) || 3));
    s.sortMode = rv(o, "configGeral", "sortMode", s.sortMode);

    s.corTexto = rf(o, "configTexto", "corTexto", s.corTexto);
    s.corTextoSec = rf(o, "configTexto", "corTextoSec", s.corTextoSec);
    s.tamanhoFonte = rv(o, "configTexto", "tamanhoFonte", s.tamanhoFonte);
    s.pesoFonte = rv(o, "configTexto", "pesoFonte", s.pesoFonte);
    s.tamanhoTitulo = rv(o, "configTexto", "tamanhoTitulo", s.tamanhoTitulo);

    s.corCheckAtivo = rf(o, "configCheckbox", "corCheckAtivo", s.corCheckAtivo);
    s.corHover = rf(o, "configCheckbox", "corHover", s.corHover);
    s.showSelectAll = rv(o, "configCheckbox", "showSelectAll", s.showSelectAll);
    s.borderRadiusCheck = rv(o, "configCheckbox", "borderRadiusCheck", s.borderRadiusCheck);

    s.corBordaBtn = rf(o, "configBotoes", "corBordaBtn", s.corBordaBtn);
    s.borderRadiusBotao = rv(o, "configBotoes", "borderRadiusBotao", s.borderRadiusBotao);
    s.showBordaAtiva = rv(o, "configBotoes", "showBordaAtiva", s.showBordaAtiva);
    s.modoIndicador = rv(o, "configBotoes", "modoIndicador", s.modoIndicador);

    s.showBorda = rv(o, "configBorda", "showBorda", s.showBorda);
    s.corBorda = rf(o, "configBorda", "corBorda", s.corBorda);
    s.larguraBorda = rv(o, "configBorda", "larguraBorda", s.larguraBorda);

    s.darkMode = rv(o, "configDarkMode", "darkMode", s.darkMode);
    s.bgDark = rf(o, "configDarkMode", "bgDark", s.bgDark);
    s.corBordaDark = rf(o, "configDarkMode", "corBordaDark", s.corBordaDark);

    return s;
}
