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
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <span aria-hidden>←</span> Dashboard
        </Link>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">Your profile</h1>
          <p className="text-sm text-stone-500 mt-1 mb-6">
            Every email, referral request, and connection note is written from these details.
            Fill them in once — they apply to every job you add.
          </p>
          <ProfileForm initial={initial} />
        </div>
      </div>
    </main>
  );
}
