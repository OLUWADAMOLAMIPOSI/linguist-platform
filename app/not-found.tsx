import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow mb-2">404</p>
      <h1 className="text-3xl">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">The page you are looking for does not exist or is no longer published.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to the home page
      </Link>
    </div>
  );
}
