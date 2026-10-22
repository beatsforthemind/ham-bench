import type { Metadata } from "next";
import { ProgressBoard } from "@/components/study-boards";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <h1 className="display text-6xl">Progress</h1>
      <p className="max-w-3xl text-xl">
        Ready to test means 80% or better on five mock exams in a row, every question seen, and no subelement left under a passing share of its groups. The record stays in this browser.
      </p>
      <ProgressBoard />
    </div>
  );
}
