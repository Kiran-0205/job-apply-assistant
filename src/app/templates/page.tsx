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
      <div className="max-w-3xl mx-auto space-y-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <span aria-hidden>←</span> Dashboard
        </Link>

        <div className="bg-white border border-zinc-200/70 rounded-2xl p-6 sm:p-7 shadow-card">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Templates</h1>
          <p className="text-sm text-zinc-500 mt-1 mb-6">
            Optional starting points for generated materials. When set, generation adapts these
            for each job instead of writing from scratch — leave blank to let it write freely.
          </p>
          <TemplatesForm initial={initial} />
        </div>
      </div>
    </main>
  );
}
