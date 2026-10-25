"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";
import { primaryButton } from "@/components/listing/form-fields";

export function AuthForm({ mode, next = "/", confirmationError = false }: { mode: "sign-in" | "sign-up"; next?: string; confirmationError?: boolean }) {
  const registering = mode === "sign-up";
  const [state, action, pending] = useActionState<AuthState, FormData>(registering ? signUp : signIn, {});
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
    <p className="mb-6 text-base font-semibold tracking-tight text-brand">Crosslisting</p>
    <section className="rounded-lg border border-border bg-surface p-6">
      <h1 className="text-2xl font-semibold">{registering ? "Create your account" : "Sign in"}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Manage your inventory in one private workspace.</p>
      {confirmationError ? <p role="alert" className="mt-4 text-sm text-red-700">That confirmation link is invalid or expired. Try signing in or request another confirmation email from your Supabase project administrator.</p> : null}
      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div><label htmlFor="email" className="block text-sm font-medium">Email</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" /></div>
        <div><label htmlFor="password" className="block text-sm font-medium">Password</label><input id="password" name="password" type="password" required minLength={registering ? 8 : undefined} maxLength={128} autoComplete={registering ? "new-password" : "current-password"} className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />{registering ? <p className="mt-1 text-xs text-muted-foreground">At least 8 characters. Your project may enforce stronger requirements.</p> : null}</div>
        {state.error ? <p role="alert" className="text-sm leading-6 text-red-700">{state.error}</p> : null}
        {state.message ? <p role="status" className="text-sm leading-6 text-emerald-700">{state.message}</p> : null}
        <button className={`${primaryButton} w-full`} disabled={pending || Boolean(state.message)}>{pending ? "Please wait…" : registering ? "Create account" : "Sign in"}</button>
      </form>
      <p className="mt-5 text-sm text-muted-foreground">{registering ? "Already have an account?" : "New to Crosslisting?"} <Link className="font-medium text-brand underline underline-offset-2" href={registering ? "/sign-in" : "/sign-up"}>{registering ? "Sign in" : "Create account"}</Link></p>
    </section>
    <p className="mt-4 text-xs leading-5 text-muted-foreground">Inventory saves are real. Marketplace integrations and external publishing are not available yet.</p>
  </main>;
}
