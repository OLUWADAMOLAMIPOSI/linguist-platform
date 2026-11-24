export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite">
      <div className="h-7 w-56 animate-pulse rounded bg-sand" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-sand/70" />
        <div className="h-4 w-4/5 max-w-xl animate-pulse rounded bg-sand/70" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
