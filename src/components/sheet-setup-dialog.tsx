"use client";

import * as React from "react";
import { Check, Copy, ExternalLink, Sheet, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { APPS_SCRIPT_CODE } from "@/lib/appsScript";
import {
  isLikelyScriptUrl,
  saveSheetConfig,
  type SheetConfig,
} from "@/lib/sheets";

interface SheetSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: SheetConfig | null;
  onSaved: (cfg: SheetConfig) => void;
}

export function SheetSetupDialog({
  open,
  onOpenChange,
  current,
  onSaved,
}: SheetSetupDialogProps) {
  const [url, setUrl] = React.useState(current?.scriptUrl ?? "");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setUrl(current?.scriptUrl ?? "");
      setCopied(false);
    }
  }, [open, current]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      toast.success("Copied", {
        description: "Apps Script code copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed", {
        description: "Select the code block and copy manually.",
      });
    }
  };

  const handleSave = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("URL required", {
        description: "Paste the Web app URL from the Apps Script deploy step.",
      });
      return;
    }
    if (!isLikelyScriptUrl(trimmed)) {
      toast.error("URL looks invalid", {
        description:
          "It should look like https://script.google.com/macros/s/…/exec",
      });
      return;
    }
    const cfg: SheetConfig = { scriptUrl: trimmed };
    saveSheetConfig(cfg);
    onSaved(cfg);
    onOpenChange(false);
    toast.success("Connected to Google Sheet", {
      description: "Form submissions will now be recorded in your sheet.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sheet className="size-5 text-violet-600" />
            Connect to Google Sheets
          </DialogTitle>
          <DialogDescription>
            This form has no backend. It posts submissions directly to a Google
            Sheet via a small Google Apps Script web app. Set it up once — it
            takes about 2 minutes.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm">
          <Step n={1}>
            Create a new{" "}
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-violet-700 underline underline-offset-2 inline-flex items-center gap-1"
            >
              Google Sheet <ExternalLink className="size-3" />
            </a>{" "}
            (or open an existing one).
          </Step>
          <Step n={2}>
            Open <span className="font-medium">Extensions → Apps Script</span>.
            Delete any code in the editor.
          </Step>
          <Step n={3}>
            Copy the script below and paste it into the editor, then{" "}
            <span className="font-medium">Save</span>.
          </Step>
          <Step n={4}>
            Click <span className="font-medium">Deploy → New deployment</span>,
            choose <span className="font-medium">Web app</span>, set{" "}
            <span className="font-medium">Who has access: Anyone</span>, then{" "}
            <span className="font-medium">Deploy</span> and authorize.
          </Step>
          <Step n={5}>
            Copy the resulting <span className="font-medium">Web app URL</span>{" "}
            (ends with <code className="text-violet-700">/exec</code>) and paste
            it below.
          </Step>
        </ol>

        <div className="rounded-lg border bg-slate-950 text-slate-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400">
              Code.gs
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyCode}
              className="h-7 gap-1.5 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy code
                </>
              )}
            </Button>
          </div>
          <pre className="text-xs leading-relaxed font-mono overflow-x-auto max-h-64 p-3">
            <code>{APPS_SCRIPT_CODE}</code>
          </pre>
        </div>

        <div className="space-y-2">
          <Label htmlFor="script-url">Web app URL</Label>
          <Input
            id="script-url"
            type="url"
            inputMode="url"
            placeholder="https://script.google.com/macros/s/AKfy…/exec"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Stored only in your browser (localStorage). Never sent anywhere
            except Google&apos;s Apps Script endpoint.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Save & connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
        {n}
      </span>
      <span className="text-foreground/90 pt-0.5">{children}</span>
    </li>
  );
}
