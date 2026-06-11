import Link from "next/link";
import { getAppUser } from "@/lib/user";
import { TemplatesForm, type TemplateValues } from "@/components/TemplatesForm";

export default async function TemplatesPage() {
  const user = await getAppUser();

  const initial: TemplateValues = {
    emailTemplate: user.emailTemplate ?? "",
    referralTemplate: user.referralTemplate ?? "",
    connectionTemplate: user.connectionTemplate ?? "",
  };

  return (
    <main className="flex-1 px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink-soft hover:text-rust transition-colors"
        >
          <span aria-hidden>←</span> Back to cases
        </Link>

        <div className="bg-cream border border-linen p-6 sm:p-7">
          <h1 className="font-mono text-lg font-bold text-ink uppercase tracking-[0.15em]">
            Templates
          </h1>
          <div className="w-10 h-0.5 bg-rust mt-2" aria-hidden />
          <p className="text-sm text-ink-soft mt-3 mb-6">
            Optional starting points for generated materials. When set, generation adapts these
            for each job instead of writing from scratch — leave blank to let it write freely.
          </p>
          <TemplatesForm initial={initial} />
        </div>
      </div>
    </main>
  );
}
