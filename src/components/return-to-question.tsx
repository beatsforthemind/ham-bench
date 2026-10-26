"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isLicenseClass } from "@/lib/pools";

const QUESTION_ID = /^[TGE][0-9][A-Z][0-9]{2}$/;

export function ReturnToQuestion() {
  const search = useSearchParams();
  const license = search.get("class");
  const questionId = search.get("q");
  if (!license || !isLicenseClass(license) || !questionId || !QUESTION_ID.test(questionId)) return null;
  return (
    <p>
      <Link href={`/license/${license}/learn?q=${questionId}`} className="inline-flex min-h-11 items-center underline">
        Back to this question
      </Link>
    </p>
  );
}
