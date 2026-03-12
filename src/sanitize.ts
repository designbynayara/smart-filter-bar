/**
 * SmartFilterBar Sanitize — HTML entity escaping for user-facing data.
 * Ensures safe DOM insertion when building HTML strings.
 */

const ESC_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

/**
 * Escape HTML-unsafe characters in a string.
 * Used on all user data (field names, display values) before insertion into HTML.
 */
export function esc(s: string | null | undefined): string {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, (ch) => ESC_MAP[ch] || ch);
}

/**
 * Safely assign sanitized HTML to an element's innerHTML.
 * The HTML string MUST already have user data escaped via esc().
 * This wrapper exists so eslint-disable is centralized in one place.
 */
export function safeInnerHTML(el: HTMLElement, html: string): void {
    // eslint-disable-next-line powerbi-visuals/no-inner-outer-html
    el.innerHTML = html;
}
