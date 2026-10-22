import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="display text-5xl">That page is not on the bench.</h1>
      <Link href="/">Back to the station</Link>
    </div>
  );
}
