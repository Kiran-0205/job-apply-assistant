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

        <div className="bg-cream border-2 border-coal shadow-card-lg">
          <div className="bg-coal px-6 sm:px-7 py-2.5 flex items-center justify-between">
            <h1 className="font-mono text-sm font-bold text-cream uppercase tracking-[0.25em]">
              Templates
            </h1>
            <span className="font-mono text-[10px] text-flame uppercase tracking-[0.2em]">
              Boilerplate
            </span>
          </div>
          <div className="p-6 sm:p-7">
            <p className="text-sm text-ink-soft mb-6">
              Optional starting points for generated materials. When set, generation adapts these
              for each job instead of writing from scratch — leave blank to let it write freely.
            </p>
            <TemplatesForm initial={initial} />
          </div>
        </div>
      </div>
    </main>
  );
}
