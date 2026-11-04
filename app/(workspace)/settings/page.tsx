import { PageHeader } from "@/components/page-header";
import { requireIdentity } from "@/lib/auth/server";
import { signOut } from "@/app/auth/actions";
import { secondaryButton } from "@/components/listing/form-fields";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ signout?: string }> }) {
  const identity = await requireIdentity();
  const failed = (await searchParams).signout === "failed";
  return <div className="mx-auto max-w-[1200px] space-y-6"><PageHeader title="Settings" description="Your signed-in account. Additional workspace preferences will be added later." /><section className="rounded-lg border border-border bg-surface p-5"><h2 className="text-sm font-semibold">Account</h2><p className="mt-2 break-words text-sm text-muted-foreground">{identity.email}</p>{failed ? <p role="alert" className="mt-3 text-sm text-red-700">Sign out could not be completed. Please retry.</p> : null}<form action={signOut} className="mt-4"><button className={secondaryButton}>Sign out of this browser</button></form></section></div>;
}
