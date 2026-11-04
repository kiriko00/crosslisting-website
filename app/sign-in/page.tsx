import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getIdentity } from "@/lib/auth/server";
import { safeNext } from "@/lib/auth/redirect";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  if (await getIdentity()) redirect(safeNext(params.next));
  return <AuthForm mode="sign-in" next={safeNext(params.next)} confirmationError={params.error === "confirmation"} />;
}
