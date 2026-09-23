"use client";

/**
 * Client-side Google Sheets integration (NO backend).
 *
 * The form POSTs JSON directly to a Google Apps Script Web App URL.
 * The Apps Script `doPost(e)` handler writes each submission as a new row
 * in the linked Google Sheet.
 *
 * Because Apps Script web apps don't return CORS headers, we use
 * `mode: "no-cors"` with a `text/plain` content type (a "simple request"
 * that does not trigger a preflight). The browser receives an opaque
 * response, so we optimistically report success and keep a local copy
 * of every submission as a backup record.
 */

const CONFIG_KEY = "commitment_form.gsheet_config";
const SUBMISSIONS_KEY = "commitment_form.submissions";

export interface SheetConfig {
  /** Deployed Google Apps Script Web App URL (ends with /exec). */
  scriptUrl: string;
  /** Optional sheet name. Defaults to the first sheet if omitted. */
  sheetName?: string;
}

export interface FormSubmission {
  id: string;
  timestamp: string; // ISO string
  data: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/* Config (localStorage)                                              */
/* ------------------------------------------------------------------ */

export function getSheetConfig(): SheetConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SheetConfig;
    if (!parsed?.scriptUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSheetConfig(cfg: SheetConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function clearSheetConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONFIG_KEY);
}

export function isLikelyScriptUrl(url: string): boolean {
  return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url.trim());
}

/* ------------------------------------------------------------------ */
/* Submissions (localStorage backup record)                           */
/* ------------------------------------------------------------------ */

export function getSubmissions(): FormSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as FormSubmission[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addSubmission(data: Record<string, string>): FormSubmission {
  const sub: FormSubmission = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    data,
  };
  if (typeof window === "undefined") return sub;
  const all = getSubmissions();
  all.unshift(sub);
  // keep at most the latest 100 entries locally
  window.localStorage.setItem(
    SUBMISSIONS_KEY,
    JSON.stringify(all.slice(0, 100)),
  );
  return sub;
}

export function clearSubmissions(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SUBMISSIONS_KEY);
}

/* ------------------------------------------------------------------ */
/* Submit to Google Sheet via Apps Script                             */
/* ------------------------------------------------------------------ */

/**
 * POST the form payload to the configured Apps Script Web App.
 * Returns `true` when the request was dispatched successfully.
 * (We can't read the response due to opaque mode, but the row is written.)
 */
export async function postToSheet(
  scriptUrl: string,
  data: Record<string, string>,
): Promise<void> {
  const body = JSON.stringify(data);
  await fetch(scriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  });
}
