import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// React cache deduplicates only within a server render, never across users.
export const getIdentity = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  return { id: data.claims.sub, email: typeof data.claims.email === "string" ? data.claims.email : "Your account" };
});

export async function requireIdentity() {
  const identity = await getIdentity();
  if (!identity) redirect("/sign-in");
  return identity;
}
