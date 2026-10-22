import type { Metadata } from "next";
import { MIRROR_COMMIT } from "@/lib/pool-facts";
import { pools, registry } from "@/lib/pools";

export const metadata: Metadata = { title: "Sources" };

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <h1 className="display text-6xl">Sources</h1>
      <p className="max-w-3xl text-xl">
        Question wording, answer choices, rule citations, and exam figures come from the NCVEC public-domain releases. The hints, labs, and “why this is wrong” lines are original to this bench.
      </p>
      <p>
        NCVEC’s release pages carry the public-domain statement. The February 19, 2026 Technician PDF does not repeat that sentence, so the attribution lives here.{" "}
        <a href="https://www.ncvec.org/">NCVEC</a> publishes the pools. Part 97 is the{" "}
        <a href="https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97">eCFR</a>. The band map uses the saved extract dated 2026-02-13.
      </p>
      <p>
        The Apache-2.0 mirror at commit <span className="num">{MIRROR_COMMIT}</span> was a cross-check only. Its license notice stays in{" "}
        <span className="num">source-materials/reference/russolsen_ham_radio_question_pool/LICENSE.txt</span>. Shipped question text is from the NCVEC files, not from that JSON.
      </p>
      <ul className="space-y-4">
        {registry.pools.map((entry) => {
          const pool = pools[entry.licenseClass];
          return (
            <li key={entry.revision} className="rounded-3xl border border-line bg-card p-5">
              <h2 className="display text-3xl">{entry.licenseClass}</h2>
              <p>{entry.revision}</p>
              <p>
                {entry.questionCount} live questions · {entry.examQuestions} on the exam · pass {entry.passingCount}
              </p>
              <p>
                Effective {entry.effectiveFrom} through {entry.effectiveThrough}. Errata {entry.errataDate}.
              </p>
              <p className="num break-all text-sm text-ink-soft">DOCX SHA-256 {pool.source.docxSha256}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
