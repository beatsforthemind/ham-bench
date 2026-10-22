import { ExamRoom } from "@/components/exam-room";
import { LICENSE_CLASSES } from "@/lib/pool-types";

export function generateStaticParams() {
  return LICENSE_CLASSES.map((licenseClass) => ({ class: licenseClass }));
}

export default function ExamPage() {
  return <ExamRoom />;
}
