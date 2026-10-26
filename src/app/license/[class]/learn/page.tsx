import { Suspense } from "react";
import { PracticeRoom } from "@/components/practice-room";
import { LICENSE_CLASSES } from "@/lib/pool-types";

export function generateStaticParams() {
  return LICENSE_CLASSES.map((licenseClass) => ({ class: licenseClass }));
}

export default function LearnPage() {
  return (
    <Suspense fallback={<p>Opening the lesson.</p>}>
      <PracticeRoom learn />
    </Suspense>
  );
}
