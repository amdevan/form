"use client";

import { GraduationCap, Sheet } from "lucide-react";
import { CommitmentForm } from "@/components/commitment-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-violet-100/60">
      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-2xl">
          {/* Top brand row */}
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-violet-700">
              <GraduationCap className="size-5" />
              <span className="text-sm font-semibold tracking-wide">
                विद्यालय प्रतिबद्धता
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Sheet className="size-3.5" />
              Google Sheets · No backend
            </div>
          </div>

          <CommitmentForm />

          <p className="mt-4 px-1 text-center text-xs text-slate-500">
            यो फारमले कुनै ब्याकएन्ड सर्भर प्रयोग गर्दैन। सबै प्रविष्टिहरू
            सिधै तपाईंको Google Sheet मा दर्ता हुन्छन्।
          </p>
        </div>
      </main>

      <footer className="mt-auto border-t border-violet-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} अभिभावक प्रतिबद्धता फारम · Next.js +
            Google Sheets
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Client-side submission
          </span>
        </div>
      </footer>
    </div>
  );
}
