"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";

export type AuthState = { error?: string; message?: string };

function credentials(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !password || password.length > 128) return null;
  return { email, password };
}

export async function signIn(_previous: AuthState, form: FormData): Promise<AuthState> {
  const input = credentials(form);
  if (!input) return { error: "Enter a valid email address and password." };
  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signInWithPassword(input);
    if (error) return { error: "Unable to sign in. Check your email and password, and confirm your email if required." };
  } catch {
    return { error: "Sign in is temporarily unavailable. Please try again." };
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_previous: AuthState, form: FormData): Promise<AuthState> {
  const input = credentials(form);
  if (!input || input.password.length < 8) return { error: "Enter a valid email and a password of 8–128 characters." };
  const supabase = await createClient();
  // Configure this for deployment; never derive email destinations from a
  // browser-supplied return URL or an untrusted Host header.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let hasSession = false;
  try {
    const { data, error } = await supabase.auth.signUp({
      ...input,
      options: { emailRedirectTo: new URL("/auth/callback", origin).toString() },
    });
    if (error) return { error: "Unable to create an account. Try again or sign in if you already have one. Your project may require a stronger password." };
    hasSession = Boolean(data.session);
  } catch {
    return { error: "Sign up is temporarily unavailable. Please try again." };
  }
  if (hasSession) redirect("/");
  return { message: "Check your email for a confirmation link, then sign in. If you already have an account, use Sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/settings?signout=failed");
  redirect("/sign-in");
}
