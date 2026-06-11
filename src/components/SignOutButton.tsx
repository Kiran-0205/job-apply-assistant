import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/signin" });
      }}
    >
      <button
        type="submit"
        className="px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-cream/60 hover:text-rust transition-colors cursor-pointer"
      >
        Sign out
      </button>
    </form>
  );
}
