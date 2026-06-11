import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-16">
      <div className="max-w-sm mx-auto">
        <div className="bg-cream border-2 border-coal shadow-card-lg">
          <div className="bg-coal px-6 sm:px-7 py-2.5">
            <h1 className="font-mono text-sm font-bold text-cream uppercase tracking-[0.25em]">
              Welcome back
            </h1>
          </div>
          <div className="p-6 sm:p-7">
            <p className="text-sm text-ink-soft mb-6">Sign in to continue to FormSprint.</p>
            <Suspense>
              <AuthForm mode="signin" />
            </Suspense>
          </div>
        </div>
        <p className="text-center text-sm text-ink-soft mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold text-rust hover:underline underline-offset-2 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
