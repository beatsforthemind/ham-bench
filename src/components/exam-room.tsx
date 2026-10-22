"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createExam } from "@/lib/exam";
import { labHref } from "@/lib/presets";
import { isLicenseClass, poolForToday, questionById } from "@/lib/pools";
import { emptySession, type ExamSession } from "@/lib/session";
import { FigureView } from "./figure";
import { useBench } from "./bench-provider";

const LETTERS = ["A", "B", "C", "D"];

export function ExamRoom() {
  const params = useParams<{ class: string }>();
  const license = isLicenseClass(params.class) ? params.class : null;
  const { ready, session, saveSession, turnIn, settings, setSettings } = useBench();
  const [confirming, setConfirming] = useState(false);
  const [calc, setCalc] = useState("");
  const pool = license ? poolForToday(license) : null;
  const active = session && pool && session.paper.licenseClass === license && session.paper.revision === pool.revision ? session : null;

  useEffect(() => {
    if (!active || active.result) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const letter = "abcd".indexOf(event.key.toLowerCase());
      if (letter >= 0) pick(letter);
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!license) return <p>That license class is not on the bench.</p>;
  if (!ready) return <p>Opening the paper.</p>;
  if (!pool) return <p>No {license} pool is in force today. The bench will not build an exam from an expired pool.</p>;

  function start(diagramFree: boolean) {
    const paper = createExam(pool!, crypto.randomUUID(), Date.now());
    saveSession(emptySession(paper, diagramFree));
    setConfirming(false);
  }

  function patch(next: ExamSession) {
    saveSession(next);
  }

  function pick(letter: number) {
    if (!active || active.result) return;
    const answers = [...active.answers];
    answers[active.index] = letter;
    patch({ ...active, answers });
  }

  function move(delta: number) {
    if (!active || active.result) return;
    patch({ ...active, index: Math.min(active.paper.questionIds.length - 1, Math.max(0, active.index + delta)) });
  }

  if (!active) {
    const stale = session && session.paper.licenseClass === license && session.paper.revision !== pool.revision;
    return (
      <section className="space-y-5">
        <h1 className="display text-5xl">Mock {license} exam</h1>
        <p className="text-xl">
          One question from each group, in the published A–D order. Grading waits until you turn the paper in. Passing is {pool.passingCount} of {pool.examQuestions}.
        </p>
        {stale ? <p>A saved paper uses an older revision. It stays out of this sitting.</p> : null}
        <label className="flex items-center gap-3 text-lg">
          <input
            type="checkbox"
            checked={settings.diagramFree}
            onChange={(event) => setSettings({ ...settings, diagramFree: event.target.checked })}
          />
          Diagram-free paper
        </label>
        <button type="button" data-testid="start-exam" className="rounded-full bg-walnut px-5 py-3 text-lg text-paper" onClick={() => start(settings.diagramFree)}>
          Start the paper
        </button>
      </section>
    );
  }

  if (active.result) {
    const result = active.result;
    return (
      <section className="space-y-6" data-testid="practice-score">
        <p className="text-sm uppercase tracking-widest text-ink-soft">Practice score</p>
        <h1 className="display text-6xl num">
          <span data-testid="score-correct">{result.correct}</span> of {result.total}
        </h1>
        <p className="text-xl">
          {result.passed ? "That would be a passing paper." : `A passing paper needs ${result.passingCount}.`} This is not a CSCE and it is not a license.
        </p>
        <p>{result.unansweredIds.length} unanswered, counted as misses.</p>
        <ul className="space-y-4">
          {result.missedIds.map((id) => {
            const question = questionById(pool, id);
            if (!question) return null;
            const index = active.paper.questionIds.indexOf(id);
            const chosen = active.answers[index];
            const href = labHref(question, license);
            return (
              <li key={id} className="rounded-2xl border border-line bg-card p-4">
                <p className="text-sm text-ink-soft">{id}</p>
                <p>{question.text}</p>
                <p className="mt-2">The matching choice is “{question.answers[question.correctIndex]}.”</p>
                {chosen == null ? <p>No answer was marked.</p> : chosen !== question.correctIndex ? <p>{question.distractors[chosen]}</p> : null}
                {href ? <Link href={href}>Try it on the bench</Link> : null}
              </li>
            );
          })}
        </ul>
        <button type="button" className="rounded-full bg-walnut px-5 py-3 text-paper" onClick={() => start(settings.diagramFree)}>
          Start another paper
        </button>
      </section>
    );
  }

  const id = active.paper.questionIds[active.index]!;
  const question = questionById(pool, id);
  if (!question) return <p>This paper points at a question the pool does not have.</p>;
  const selected = active.answers[active.index];

  return (
    <article className="space-y-6">
      <p className="text-sm uppercase tracking-widest text-ink-soft">
        Question {active.index + 1} of {active.paper.questionIds.length} · answers stay in the published order
      </p>
      <h1 className="text-3xl leading-snug">{question.text}</h1>
      <FigureView id={question.figure} hidden={active.diagramFree} />
      <div className="grid gap-3">
        {question.answers.map((answer, index) => (
          <button
            key={answer}
            type="button"
            data-testid={`choice-${index}`}
            className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-lg ${selected === index ? "border-walnut bg-paper-deep" : "border-line bg-card"}`}
            onClick={() => pick(index)}
          >
            <span className="num mr-3 text-ink-soft">{LETTERS[index]}</span>
            {answer}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="rounded-full border border-line px-4 py-2" onClick={() => move(-1)}>
          Previous
        </button>
        <button type="button" data-testid="next-question" className="rounded-full border border-line px-4 py-2" onClick={() => move(1)}>
          Next
        </button>
        <button type="button" data-testid="turn-in" className="rounded-full bg-amber px-4 py-2 text-walnut-deep" onClick={() => setConfirming(true)}>
          Turn in paper
        </button>
      </div>
      {confirming ? (
        <div className="rounded-2xl border border-amber bg-card p-4">
          <p>Unanswered questions count as misses. This records one practice score.</p>
          <button
            type="button"
            data-testid="confirm-turn-in"
            className="mt-3 rounded-full bg-walnut px-4 py-2 text-paper"
            onClick={() => {
              turnIn(pool);
              setConfirming(false);
            }}
          >
            Record the practice score
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Calculator value={calc} onChange={setCalc} />
        <label className="block rounded-2xl border border-line bg-card p-4">
          <span className="text-sm uppercase tracking-widest text-ink-soft">Scratch pad</span>
          <textarea
            value={active.scratch}
            onChange={(event) => patch({ ...active, scratch: event.target.value })}
            className="mt-2 min-h-28 w-full bg-transparent text-lg outline-none"
          />
        </label>
      </div>
    </article>
  );
}

function Calculator({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  function press(token: string) {
    if (token === "C") {
      onChange("");
      return;
    }
    if (token === "=") {
      const match = value.match(/^(-?\d*\.?\d+)\s*([+\-*/])\s*(-?\d*\.?\d+)$/);
      if (!match) return;
      const left = Number(match[1]);
      const right = Number(match[3]);
      const op = match[2];
      const result = op === "+" ? left + right : op === "-" ? left - right : op === "*" ? left * right : right === 0 ? NaN : left / right;
      onChange(Number.isFinite(result) ? String(Math.round(result * 1000) / 1000) : "");
      return;
    }
    onChange(value + token);
  }
  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+", "C"];
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-sm uppercase tracking-widest text-ink-soft">Calculator</p>
      <output className="num mt-2 block min-h-8 text-2xl">{value || "0"}</output>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {keys.map((key) => (
          <button key={key} type="button" className="rounded-xl border border-line py-2" onClick={() => press(key)}>
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
