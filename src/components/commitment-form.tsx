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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

const RADIO_OPTIONS = [
  { value: "गर्नु छ", label: "गर्नु छ" },
  { value: "गर्न सकिँदैन", label: "गर्न सकिँदैन" },
  { value: "प्रायः गर्नु छ", label: "प्रायः गर्नु छ" },
] as const;

interface RadioQuestion {
  id: string;
  key: string;
  label: string;
  type: "radio";
}

interface CheckboxQuestion {
  id: string;
  key: string;
  label: string;
  type: "checkbox";
}

type Question = RadioQuestion | CheckboxQuestion;

const QUESTIONS: Question[] = [
  {
    id: "q1",
    key: "q1",
    type: "radio",
    label:
      "१. म/हामी घोषणा गर्दछौं कि छोराछोरीलाई नियमित र समयमा विद्यालय पठाउने तथा पढाइ र गुणस्तरमा आवश्यक सहयोग गर्नेछौं।",
  },
  {
    id: "q2",
    key: "q2",
    type: "radio",
    label:
      "२. बालबालिकाको अध्ययनका लागि अनुकूल वातावरण र शैक्षिक सामग्रीको व्यवस्था गर्नुहुन्छ?",
  },
  {
    id: "q3",
    key: "q3",
    type: "radio",
    label:
      "३. चेतनामूलक मार्ग, सम्मान र समान व्यवहार गर्ने तथा कुनै पनि भेदभाव नगरी सहभागितामूलक रूपमा अग्रसर हुनुहुन्छ?",
  },
  {
    id: "q4",
    key: "q4",
    type: "radio",
    label:
      "४. घर, विद्यालय र समुदायमा भएको कुनै पनि दुर्व्यवहार, उत्पीडन तथा अनलाइन जोखिम रोक्न सकिने भूमिका खेल्नुहुन्छ? असुविधा देखिएमा विद्यालय वा सम्बन्धित निकायमा जानकारी गराउँछु।",
  },
  {
    id: "q5",
    key: "q5",
    type: "radio",
    label:
      "५. विद्यार्थीहरूको सिकाइ विधि, दुर्घटना र जोखिम रोक्ने उपायबारे जानकारी गराउन र सकारात्मक सहयोग गर्नुहुन्छ?",
  },
  {
    id: "q6",
    key: "q6",
    type: "radio",
    label:
      "६. विद्यालयको स्वयंसेवक प्रणाली तथा सुरक्षा व्यवस्थामा आवश्यकतानुसार सहयोग गर्न तयार हुनुहुन्छ?",
  },
  {
    id: "q7",
    key: "q7",
    type: "checkbox",
    label:
      "७. विद्यालय र शिक्षकसँगको सहकार्य सम्बन्ध तथा सहभागितामा सक्रिय हुनुहुन्छ। (एकभन्दा बढी छनौट गर्न सक्नुहुन्छ)",
  },
  {
    id: "q8",
    key: "q8",
    type: "radio",
    label:
      "८. छात्र/छात्राको स्वास्थ्य, सरसफाइ, पोषण र मानसिक तथा भावनात्मक अवस्था जाँच गर्नुहुन्छ र आवश्यक परे विशेषज्ञ वा सम्बन्धित सेवा प्रदायकसँग सम्पर्क गर्नुहुन्छ?",
  },
];

interface FormValues {
  studentName: string;
  className: string;
  phone: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string[];
  q8: string;
  /** Per-option number entries, keyed by `${qKey}__${optionValue}`. */
  numbers: Record<string, string>;
}

const EMPTY_VALUES: FormValues = {
  studentName: "",
  className: "",
  phone: "",
  q1: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
  q6: "",
  q7: [],
  q8: "",
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
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const toggleCheckbox = (val: string) => {
    setValues((v) => {
      const set = new Set(v.q7);
      if (set.has(val)) set.delete(val);
      else set.add(val);
      return { ...v, q7: Array.from(set) };
    });
    setErrors((e) => {
      if (!e.q7) return e;
      const next = { ...e };
      delete next.q7;
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
    if (!values.studentName.trim()) e.studentName = "विद्यार्थीको नाम आवश्यक छ।";
    if (!values.className.trim()) e.className = "कक्षा आवश्यक छ।";
    if (!values.phone.trim()) e.phone = "फोन नम्बर आवश्यक छ।";
    else if (!/^[0-9+\-\s]{7,15}$/.test(values.phone.trim()))
      e.phone = "मान्य फोन नम्बर लेख्नुहोस्।";
    for (const q of QUESTIONS) {
      if (q.type === "radio") {
        if (!(values as Record<string, unknown>)[q.key])
          e[q.key] = "कृपया एक विकल्प छान्नुहोस्।";
      } else {
        if (values.q7.length === 0) e.q7 = "कम्तीमा एक विकल्प छान्नुहोस्।";
      }
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
    // For radio questions: record the number entered next to the SELECTED option.
    // For the checkbox question: record "option:number" pairs for each CHECKED option.
    const radioNum = (qKey: string) =>
      values.numbers[numKey(qKey, (values as Record<string, unknown>)[qKey] as string)] ?? "";
    const checkboxNum = (qKey: string) =>
      (values.q7)
        .map((opt) => `${opt}:${values.numbers[numKey(qKey, opt)] ?? ""}`)
        .join("; ");
    const payload: Record<string, string> = {
      studentName: values.studentName.trim(),
      className: values.className.trim(),
      phone: values.phone.trim(),
      q1: values.q1,
      q1Num: radioNum("q1"),
      q2: values.q2,
      q2Num: radioNum("q2"),
      q3: values.q3,
      q3Num: radioNum("q3"),
      q4: values.q4,
      q4Num: radioNum("q4"),
      q5: values.q5,
      q5Num: radioNum("q5"),
      q6: values.q6,
      q6Num: radioNum("q6"),
      q7: values.q7.join("; "),
      q7Num: checkboxNum("q7"),
      q8: values.q8,
      q8Num: radioNum("q8"),
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
              बालबालिकाले अभिभावक वा परिवारबाट पाउने अभिभावकको प्रतिबद्धता
              अनलाइन फारममा रेकर्ड गरिनेछ। यो प्रपत्र हरेक नयाँ शैक्षिक सत्रमा
              सम्पूर्ण अभिभावकले भर्न सक्नुहुन्छ। प्रयास गर्नुहोस् — तपाईंको
              सहयोगले बालबालिकाको उज्ज्वल भविष्य निर्माण गर्छ।
            </p>
          </div>
        </div>

        {/* Connection status bar */}
        <div className="flex items-center justify-between gap-3 border-x border-violet-100 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <>
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="font-medium text-slate-700">
                  Google Sheet जडित
                </span>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </>
            ) : (
              <>
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="font-medium text-slate-700">
                  Google Sheet जडान छैन
                </span>
                <AlertCircle className="size-4 text-amber-500" />
              </>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSetupOpen(true)}
            className="gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
          >
            <Settings2 className="size-4" />
            Setup
          </Button>
        </div>

        {/* Question cards */}
        <div className="space-y-3 border-x border-b rounded-b-xl border-violet-100 bg-violet-50/50 p-3 sm:p-4">
          {/* Text fields card */}
          <QuestionCard>
            <FieldLabel htmlFor="studentName" required>
              विद्यार्थीको नाम
            </FieldLabel>
            <Input
              id="studentName"
              value={values.studentName}
              onChange={(e) => setField("studentName", e.target.value)}
              placeholder="तपाईंको उत्तर"
              aria-invalid={!!errors.studentName}
              className="mt-2 h-11"
            />
            <FieldError msg={errors.studentName} />

            <FieldLabel htmlFor="className" required className="mt-5">
              कक्षा
            </FieldLabel>
            <Input
              id="className"
              value={values.className}
              onChange={(e) => setField("className", e.target.value)}
              placeholder="तपाईंको उत्तर"
              aria-invalid={!!errors.className}
              className="mt-2 h-11"
            />
            <FieldError msg={errors.className} />

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

          {/* Radio / checkbox questions */}
          {QUESTIONS.map((q) => (
            <QuestionCard key={q.id}>
              <FieldLabel required className="text-[15px] leading-relaxed">
                {q.label}
              </FieldLabel>
              {q.type === "radio" ? (
                <RadioGroup
                  value={(values as Record<string, string>)[q.key]}
                  onValueChange={(v) => setField(q.key as keyof FormValues, v as never)}
                  className="mt-4 gap-2"
                >
                  {RADIO_OPTIONS.map((opt) => {
                    const selected = (values as Record<string, string>)[q.key] === opt.value;
                    return (
                      <div
                        key={opt.value}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[15px] transition-colors ${
                          selected
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/50"
                        }`}
                      >
                        <label
                          htmlFor={`${q.id}-${opt.value}`}
                          className="flex flex-1 cursor-pointer items-center gap-3"
                        >
                          <RadioGroupItem
                            id={`${q.id}-${opt.value}`}
                            value={opt.value}
                            className="border-slate-400 text-violet-600 data-[state=checked]:border-violet-600"
                          />
                          <span className="text-slate-700">{opt.label}</span>
                        </label>
                        <NumberEntry
                          id={`${q.id}-${opt.value}-num`}
                          value={values.numbers[numKey(q.key, opt.value)] ?? ""}
                          onChange={(val) => setNumber(q.key, opt.value, val)}
                          active={selected}
                          label={`${q.label} — ${opt.label} (संख्या)`}
                        />
                      </div>
                    );
                  })}
                </RadioGroup>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  {RADIO_OPTIONS.map((opt) => {
                    const checked = values.q7.includes(opt.value);
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
                            onCheckedChange={() => toggleCheckbox(opt.value)}
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
              )}
              <FieldError msg={errors[q.key]} />
            </QuestionCard>
          ))}

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
                  {lastSubmission.data.studentName} ·{" "}
                  {lastSubmission.data.className}
                </p>
              </div>
            </div>
          )}
        </div>
      </form>

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
