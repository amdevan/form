/**
 * PERMANENT Google Sheet configuration.
 *
 * This is compiled into the app, so EVERY visitor uses the same Google Sheet
 * automatically — no per-browser Setup needed.
 *
 * HOW TO SET IT (one time):
 * 1. Create a Google Sheet → Extensions → Apps Script.
 * 2. Paste the code from `src/lib/appsScript.ts` (shown in the Setup dialog).
 * 3. Deploy → New deployment → Web app → "Anyone" access → Deploy.
 * 4. Copy the Web app URL (ends with /exec).
 * 5. Paste it between the quotes in PERMANENT_SCRIPT_URL below.
 * 6. Redeploy this Next.js app (git push / rebuild).
 *
 * Leave it empty ("") to fall back to the per-browser localStorage config
 * (useful only while testing before you've finalized a Sheet URL).
 */
export const PERMANENT_SCRIPT_URL = "";

/**
 * Returns the permanent Google Sheet URL if configured above,
 * otherwise falls back to whatever was saved in localStorage (per-browser).
 */
export function getEffectiveScriptUrl(): string | null {
  if (PERMANENT_SCRIPT_URL.trim()) return PERMANENT_SCRIPT_URL.trim();
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("commitment_form.gsheet_config");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { scriptUrl?: string };
    return parsed?.scriptUrl ?? null;
  } catch {
    return null;
  }
}

export function hasPermanentConfig(): boolean {
  return PERMANENT_SCRIPT_URL.trim() !== "";
}

/**
 * Returns the current effective config as a SheetConfig object
 * (for pre-filling the Setup dialog). Prefers the permanent URL,
 * then falls back to localStorage.
 */
export function getEffectiveConfig(): { scriptUrl: string } | null {
  const url = getEffectiveScriptUrl();
  return url ? { scriptUrl: url } : null;
}
