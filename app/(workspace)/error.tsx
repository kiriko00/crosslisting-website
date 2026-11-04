"use client";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <section className="rounded-md border border-red-200 bg-surface p-6"><h1 className="text-xl font-semibold">Unable to load your workspace</h1><p className="mt-2 text-sm text-muted-foreground">No mock data has been substituted. Check your connection and that the database migrations have been applied.</p><button onClick={reset} className="mt-4 text-sm font-medium text-brand underline">Try again</button></section>;
}
