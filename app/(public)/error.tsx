"use client";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-xl p-8 text-center">
        <h1 className="text-2xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted">
          This page could not be loaded. If you are the site owner, check that your database migrations have been
          applied and your environment variables are correct.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-4 overflow-auto rounded bg-sand p-3 text-left text-xs">{error.message}</pre>
        )}
        <button type="button" onClick={reset} className="btn btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
