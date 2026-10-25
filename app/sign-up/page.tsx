import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getIdentity } from "@/lib/auth/server";

export default async function SignUpPage() {
  if (await getIdentity()) redirect("/");
  return <AuthForm mode="sign-up" />;
}
