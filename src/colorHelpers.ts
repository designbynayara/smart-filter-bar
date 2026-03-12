/**
 * SmartFilterBar Color Helpers — dark/light mode palette functions.
 */

import { VisualSettings } from "./settings";

export function cx(s: VisualSettings, l: string, d: string): string {
    return s.darkMode ? d : l;
}

export function bgM(s: VisualSettings): string { return cx(s, s.bgBar, s.bgDark); }
export function bdM(s: VisualSettings): string { return cx(s, s.corBorda, s.corBordaDark); }
export function txC(s: VisualSettings): string { return cx(s, s.corTexto, "#e2e8f0"); }
export function txS(s: VisualSettings): string { return cx(s, s.corTextoSec, "#64748b"); }
export function bgHov(s: VisualSettings): string { return cx(s, s.corHover, "#1e293b"); }
export function bgI(s: VisualSettings): string { return cx(s, "#f8fafc", "#0f172a"); }
export function ddBg(s: VisualSettings): string { return cx(s, s.bgBar, "#1e293b"); }
export function ddBd(s: VisualSettings): string { return cx(s, s.corBorda, "#334155"); }
export function sepC(s: VisualSettings): string { return cx(s, s.corBorda, "#1e293b"); }
export function inputBd(s: VisualSettings): string { return cx(s, "#e2e8f0", "#334155"); }
export function inputC(s: VisualSettings): string { return cx(s, "#334155", "#e2e8f0"); }
export function ckBd(s: VisualSettings): string { return cx(s, "#cbd5e1", "#475569"); }
export function ckBg(s: VisualSettings): string { return cx(s, "#fff", "#0f172a"); }
export function acBg(s: VisualSettings): string { return cx(s, "#eff6ff", s.corAccent + "22"); }
export function acTx(s: VisualSettings): string { return cx(s, s.corAccent, "#60a5fa"); }
export function ddLine(s: VisualSettings): string { return cx(s, "#f1f5f9", "#334155"); }
export function resetC(s: VisualSettings): string { return cx(s, "#ef4444", "#f87171"); }
