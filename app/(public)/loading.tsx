export default function Loading() {
  return (
    <div className="container-page py-20" role="status" aria-live="polite">
      <div className="h-6 w-48 animate-pulse rounded bg-sand" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-sand/70" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-sand/70" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-sand/70" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
