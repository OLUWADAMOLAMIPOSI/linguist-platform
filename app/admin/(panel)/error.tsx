"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card max-w-xl p-6">
      <h1 className="text-xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-danger">{error.message}</p>
      <p className="mt-2 text-sm text-muted">If this says a table does not exist, run the SQL files in supabase/migrations on your project.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-4">
        Try again
      </button>
    </div>
  );
}
