import { AppShell } from "@/components/app-shell";
import { requireIdentity } from "@/lib/auth/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireIdentity();
  return <AppShell email={identity.email}>{children}</AppShell>;
}
