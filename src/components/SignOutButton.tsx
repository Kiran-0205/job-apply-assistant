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
        className="px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
