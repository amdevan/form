"use client";

import { CommitmentForm } from "@/components/commitment-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-violet-100/60">
      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-2xl">
          <CommitmentForm />
        </div>
      </main>

      <footer className="mt-auto border-t border-violet-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4 text-center text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} अभिभावक प्रतिबद्धता फारम
          </p>
          <p className="mt-1">
            Design &amp; Developed By{" "}
            <span className="font-semibold text-violet-700">IT Relevant</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
