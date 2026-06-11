import Link from "next/link";
import { getAppUser } from "@/lib/user";
import { ProfileForm, type ProfileValues } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await getAppUser();

  const initial: ProfileValues = {
    name: user.name ?? "",
    email: user.email === "you@example.com" ? "" : user.email,
    headline: user.headline ?? "",
    location: user.location ?? "",
    school: user.school ?? "",
    summary: user.summary ?? "",
    skills: user.skills ?? "",
    githubUrl: user.githubUrl ?? "",
    linkedinUrl: user.linkedinUrl ?? "",
    websiteUrl: user.websiteUrl ?? "",
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
            Your profile
          </h1>
          <div className="w-10 h-0.5 bg-rust mt-2" aria-hidden />
          <p className="text-sm text-ink-soft mt-3 mb-6">
            Every email, referral request, and connection note is written from these details.
            Fill them in once — they apply to every job you add.
          </p>
          <ProfileForm initial={initial} />
        </div>
      </div>
    </main>
  );
}
