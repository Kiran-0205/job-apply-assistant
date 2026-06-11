import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignUpPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-16">
      <div className="max-w-sm mx-auto">
        <div className="bg-cream border border-linen p-6 sm:p-7">
          <h1 className="font-mono text-lg font-bold text-ink uppercase tracking-[0.15em]">
            Create your account
          </h1>
          <div className="w-10 h-0.5 bg-rust mt-2" aria-hidden />
          <p className="text-sm text-ink-soft mt-3 mb-6">
            Set up FormSprint to start tracking applications.
          </p>
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
        <p className="text-center text-sm text-ink-soft mt-4">
          Already have an account?{" "}
          <Link href="/signin" className="font-bold text-rust hover:underline underline-offset-2 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
