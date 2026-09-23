"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  addSubmission,
  getSheetConfig,
  postToSheet,
  type FormSubmission,
} from "@/lib/sheets";
import { SheetSetupDialog } from "@/components/sheet-setup-dialog";

/* ------------------------------------------------------------------ */
/* Form definition                                                    */
/* ------------------------------------------------------------------ */

// Correct Nepali spellings for the three commitment options.
const OPTIONS = [
  { value: "गर्ने छु", label: "गर्ने छु" },
  { value: "गर्न सक्दिनँ", label: "गर्न सक्दिनँ" },
  { value: "प्रयास गर्ने छु", label: "प्रयास गर्ने छु" },
] as const;

interface Question {
  id: string;
  key: string;
  label: string;
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    key: "q1",
    label:
      "१. मेरो/हाम्रो छोराछोरीलाई नियमित र समयमै विद्यालय पठाउने तथा पढाइ र गृहकार्यमा आवश्यक सहयोग गर्ने छु।",
  },
  {
    id: "q2",
    key: "q2",
    label:
      "२. घरमा अध्ययनका लागि अनुकूल वातावरण र आवश्यक शैक्षिक सामग्रीको व्यवस्था गर्ने छु।",
  },
  {
    id: "q3",
    key: "q3",
    label:
      "३. छोराछोरीलाई माया, सम्मान र समान व्यवहार गर्नुका साथै उनीहरूको कुरा ध्यानपूर्वक सुन्ने तथा उनीहरूसँग नियमित सकारात्मक कुरा गर्ने छु।",
  },
  {
    id: "q4",
    key: "q4",
    label:
      "४. छोराछोरीको स्वास्थ्य, सरसफाइ, पोषण र मानसिक तथा भावनात्मक अवस्थाप्रति सजग रहने छु र आवश्यक परे विद्यालय वा सम्बन्धित सेवा प्रदायकसँग समन्वय गर्ने छु।",
  },
  {
    id: "q5",
    key: "q5",
    label:
      "५. घर, विद्यालय र समुदायमा हुने हिंसा, दुर्व्यवहार, शोषण तथा अनलाइन जोखिमबाट छोराछोरीलाई सुरक्षित राख्न सक्रिय भूमिका खेल्ने छु। असुरक्षित अवस्था देखिएमा विद्यालय वा सम्बन्धित निकायमा जानकारी गराउने छु।",
  },
  {
    id: "q6",
    key: "q6",
    label:
      "६. किशोरावस्था, स्वास्थ्य, सुरक्षा तथा जीवनोपयोगी सिपका विषयमा छोराछोरीसँग खुला र सकारात्मक संवाद गर्ने छु।",
  },
  {
    id: "q7",
    key: "q7",
    label:
      "७. विद्यालयको गुनासो सुनुवाइ संयन्त्रको प्रयोग गर्न प्रोत्साहित गर्ने छु।",
  },
  {
    id: "q8",
    key: "q8",
    label:
      "८. विद्यालय र शिक्षकसँग नियमित समन्वय तथा सञ्चार गर्ने छु। विद्यालयका अभिभावक शिक्षक बैठक, अभिभावक भेला तथा अन्य कार्यक्रममा सहभागी हुने तथा सक्रिय सहयोग गर्ने छु।",
  },
];

interface FormValues {
  schoolName: string;
  respondent: string;
  phone: string;
  /** Every question is multi-select (checkboxes) → array of selected option values. */
  q1: string[];
  q2: string[];
  q3: string[];
  q4: string[];
  q5: string[];
  q6: string[];
  q7: string[];
  q8: string[];
  /** Per-option number entries, keyed by `${qKey}__${optionValue}`. */
  numbers: Record<string, string>;
}

const EMPTY_VALUES: FormValues = {
  schoolName: "",
  respondent: "",
  phone: "",
  q1: [],
  q2: [],
  q3: [],
  q4: [],
  q5: [],
  q6: [],
  q7: [],
  q8: [],
  numbers: {},
};

/** Build the localStorage key used to store a number for a given option. */
function numKey(qKey: string, optionValue: string) {
  return `${qKey}__${optionValue}`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function CommitmentForm() {
  const [values, setValues] = React.useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [setupOpen, setSetupOpen] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [lastSubmission, setLastSubmission] =
    React.useState<FormSubmission | null>(null);

  React.useEffect(() => {
    setConnected(!!getSheetConfig());
  }, []);

  const setField = <K extends keyof FormValues>(
    key: K,
    val: FormValues[K],
  ) => {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  /** Toggle a checkbox option for ANY question (all questions are multi-select now). */
  const toggleOption = (qKey: keyof FormValues, val: string) => {
    setValues((v) => {
      const current = (v[qKey] as string[]) ?? [];
      const set = new Set(current);
      if (set.has(val)) set.delete(val);
      else set.add(val);
      return { ...v, [qKey]: Array.from(set) };
    });
    setErrors((e) => {
      if (!e[qKey as string]) return e;
      const next = { ...e };
      delete next[qKey as string];
      return next;
    });
  };

  const setNumber = (qKey: string, optionValue: string, value: string) => {
    // Strip non-numeric characters; allow empty.
    const cleaned = value.replace(/[^0-9]/g, "");
    setValues((v) => {
      const next = { ...v.numbers };
      if (cleaned === "") delete next[numKey(qKey, optionValue)];
      else next[numKey(qKey, optionValue)] = cleaned;
      return { ...v, numbers: next };
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!values.schoolName.trim()) e.schoolName = "विद्यालयको नाम आवश्यक छ।";
    if (!values.respondent.trim()) e.respondent = "फारम भर्ने व्यक्ति आवश्यक छ।";
    if (!values.phone.trim()) e.phone = "फोन नम्बर आवश्यक छ।";
    else if (!/^[0-9+\-\s]{7,15}$/.test(values.phone.trim()))
      e.phone = "मान्य फोन नम्बर लेख्नुहोस्।";
    for (const q of QUESTIONS) {
      const selected = (values[q.key as keyof FormValues] as string[]) ?? [];
      if (selected.length === 0)
        e[q.key] = "कम्तीमा एक विकल्प छान्नुहोस्।";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("फारम पूरा गर्नुहोस्", {
        description: "कृपया सबै आवश्यक क्षेत्रहरू भर्नुहोस्।",
      });
      return;
    }

    const cfg = getSheetConfig();
    if (!cfg) {
      toast.error("Google Sheet जडान छैन", {
        description: "पहिले Setup बाट Google Sheet URL थप्नुहोस्।",
      });
      setSetupOpen(true);
      return;
    }

    setSubmitting(true);
    // Every question is multi-select. For each, record the selected options
    // (joined with "; ") and the per-option numbers as "option:number" pairs.
    const selectedOpts = (qKey: string) =>
      (values[qKey as keyof FormValues] as string[]) ?? [];
    const joined = (qKey: string) => selectedOpts(qKey).join("; ");
    const numPairs = (qKey: string) =>
      selectedOpts(qKey)
        .map((opt) => `${opt}:${values.numbers[numKey(qKey, opt)] ?? ""}`)
        .join("; ");
    const payload: Record<string, string> = {
      schoolName: values.schoolName.trim(),
      respondent: values.respondent.trim(),
      phone: values.phone.trim(),
      q1: joined("q1"),
      q1Num: numPairs("q1"),
      q2: joined("q2"),
      q2Num: numPairs("q2"),
      q3: joined("q3"),
      q3Num: numPairs("q3"),
      q4: joined("q4"),
      q4Num: numPairs("q4"),
      q5: joined("q5"),
      q5Num: numPairs("q5"),
      q6: joined("q6"),
      q6Num: numPairs("q6"),
      q7: joined("q7"),
      q7Num: numPairs("q7"),
      q8: joined("q8"),
      q8Num: numPairs("q8"),
    };

    try {
      await postToSheet(cfg.scriptUrl, payload);
      const sub = addSubmission(payload);
      setLastSubmission(sub);
      toast.success("दर्ता भयो", {
        description: "तपाईंको प्रतिबद्धता Google Sheet मा सुरक्षित भयो।",
      });
      setValues(EMPTY_VALUES);
    } catch {
      toast.error("पठाउन असफल", {
        description:
          "नेटवर्क समस्या भयो। फेरि प्रयास गर्नुहोस् वा Setup जाँच्नुहोस्।",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    toast("फारम खाली भयो");
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        {/* Title / header card */}
        <div className="overflow-hidden rounded-t-xl bg-violet-600 text-white shadow-sm">
          <div className="h-2.5 w-full bg-violet-700" />
          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">
              अभिभावकको प्रतिबद्धता संकलन फारम
            </h1>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-violet-100 sm:text-base">
              बालबालिकाले अभिभावक वाट भराएर ल्याएका अभिभावकको प्रतिबद्धता
              अनलाइन रिपोर्ट यसमा गर्नुहोस्। यो भर्दा हरेक १ देखि ८ नम्बर
              शीर्षकमा सम्पूर्ण अभिभावकले गर्ने छु, गर्न सक्दिनँ, प्रयास गर्ने छु
              भनेर भरेका गनेर कति कति छ लेख्नुहोला।
            </p>
          </div>
        </div>

        {/* Question cards */}
        <div className="space-y-3 border-x border-b rounded-b-xl border-violet-100 bg-violet-50/50 p-3 sm:p-4">
          {/* Text fields card */}
          <QuestionCard>
            <FieldLabel htmlFor="schoolName" required>
              विद्यालयको नाम
            </FieldLabel>
            <Input
              id="schoolName"
              value={values.schoolName}
              onChange={(e) => setField("schoolName", e.target.value)}
              placeholder="तपाईंको उत्तर"
              aria-invalid={!!errors.schoolName}
              className="mt-2 h-11"
            />
            <FieldError msg={errors.schoolName} />

            <FieldLabel htmlFor="respondent" required className="mt-5">
              फारम भर्ने व्यक्ति
            </FieldLabel>
            <Input
              id="respondent"
              value={values.respondent}
              onChange={(e) => setField("respondent", e.target.value)}
              placeholder="तपाईंको उत्तर"
              aria-invalid={!!errors.respondent}
              className="mt-2 h-11"
            />
            <FieldError msg={errors.respondent} />

            <FieldLabel htmlFor="phone" required className="mt-5">
              फोन नम्बर
            </FieldLabel>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="तपाईंको उत्तर"
              aria-invalid={!!errors.phone}
              className="mt-2 h-11"
            />
            <FieldError msg={errors.phone} />
          </QuestionCard>

          {/* Checkbox questions (all questions are multi-select) */}
          {QUESTIONS.map((q) => {
            const selected = (values[q.key as keyof FormValues] as string[]) ?? [];
            return (
              <QuestionCard key={q.id}>
                <FieldLabel required className="text-[15px] leading-relaxed">
                  {q.label}
                </FieldLabel>
                <div className="mt-4 flex flex-col gap-2">
                  {OPTIONS.map((opt) => {
                    const checked = selected.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[15px] transition-colors ${
                          checked
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/50"
                        }`}
                      >
                        <label
                          htmlFor={`${q.id}-${opt.value}`}
                          className="flex flex-1 cursor-pointer items-center gap-3"
                        >
                          <Checkbox
                            id={`${q.id}-${opt.value}`}
                            checked={checked}
                            onCheckedChange={() =>
                              toggleOption(q.key as keyof FormValues, opt.value)
                            }
                            className="border-slate-400 data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
                          />
                          <span className="text-slate-700">{opt.label}</span>
                        </label>
                        <NumberEntry
                          id={`${q.id}-${opt.value}-num`}
                          value={values.numbers[numKey(q.key, opt.value)] ?? ""}
                          onChange={(val) => setNumber(q.key, opt.value, val)}
                          active={checked}
                          label={`${q.label} — ${opt.label} (संख्या)`}
                        />
                      </div>
                    );
                  })}
                </div>
                <FieldError msg={errors[q.key]} />
              </QuestionCard>
            );
          })}

          {/* Submit row */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm sm:px-6">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-violet-600 px-6 text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  पठाइँदै…
                </>
              ) : (
                "पेश गर्नुहोस्"
              )}
            </Button>
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-medium text-violet-700 underline-offset-2 hover:underline"
            >
              फारम खाली गर्नुहोस्
            </button>
          </div>

          {/* Last submission confirmation */}
          {lastSubmission && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div className="space-y-0.5">
                <p className="font-semibold">प्रविष्टि दर्ता भयो</p>
                <p className="text-emerald-800/80">
                  {new Date(lastSubmission.timestamp).toLocaleString()} ·{" "}
                  {lastSubmission.data.schoolName} ·{" "}
                  {lastSubmission.data.respondent}
                </p>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Floating Setup button (subtle, keeps Google Sheet config accessible) */}
      <button
        type="button"
        onClick={() => setSetupOpen(true)}
        aria-label="Setup"
        title={connected ? "Google Sheet जडित · Setup" : "Google Sheet Setup"}
        className={`fixed bottom-4 right-4 z-40 flex size-10 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl ${
          connected
            ? "bg-emerald-500 text-white"
            : "bg-violet-600 text-white"
        }`}
      >
        <Settings2 className="size-5" />
        {connected && (
          <span className="absolute -right-0.5 -top-0.5 flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-400 ring-2 ring-white" />
          </span>
        )}
      </button>

      <SheetSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        current={getSheetConfig()}
        onSaved={() => {
          setConnected(true);
          toast.success("जडान सफल", {
            description: "अब फारम पेश गर्न सकिन्छ।",
          });
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function QuestionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
      {children}
    </section>
  );
}

function FieldLabel({
  children,
  htmlFor,
  required,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className={`block text-[15px] font-medium text-slate-800 ${className ?? ""}`}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-violet-600" aria-hidden="true">
          *
        </span>
      )}
    </Label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="size-3.5" />
      {msg}
    </p>
  );
}

/** Small numeric entry box rendered on the right of each option row. */
function NumberEntry({
  id,
  value,
  onChange,
  active,
  label,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  active: boolean;
  label: string;
}) {
  // Stop clicks on the input from toggling the parent radio/checkbox label.
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div className="flex shrink-0 items-center gap-1.5" onClick={stop}>
      <label
        htmlFor={id}
        className="hidden text-xs font-medium text-slate-400 sm:inline"
      >
        संख्या
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        aria-label={label}
        title="संख्या लेख्नुहोस्"
        className={`h-8 w-16 rounded-md border bg-white text-center text-sm tabular-nums shadow-xs outline-none transition-colors focus-visible:ring-[3px] sm:w-20 ${
          active
            ? "border-violet-400 text-violet-800 focus-visible:border-violet-500 focus-visible:ring-violet-200"
            : "border-slate-200 text-slate-600 focus-visible:border-violet-400 focus-visible:ring-violet-100"
        }`}
      />
    </div>
  );
}
