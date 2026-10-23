"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createExam, hashSeed } from "@/lib/exam";
import { isLicenseClass, poolForToday, questionById } from "@/lib/pools";
import { missReview } from "@/lib/teach";
import { emptySession, paperKey, type ExamSession } from "@/lib/session";
import { FigureView } from "./figure";
import { QuestionPicture } from "./question-picture";
import { useBench } from "./bench-provider";
import { SessionBar } from "./site-header";

const LETTERS = ["A", "B", "C", "D"];

export function ExamRoom() {
  const params = useParams<{ class: string }>();
  const license = isLicenseClass(params.class) ? params.class : null;
  const { ready, session, saveSession, beginSession, turnIn, settings, setSettings } = useBench();
  const [confirming, setConfirming] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const confirmRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pool = license ? poolForToday(license) : null;
  const active =
    session && pool && session.paper.licenseClass === license && session.paper.revision === pool.revision ? session : null;
  const aligned =
    Boolean(active) &&
    active!.paper.questionIds.length === pool!.examQuestions &&
    active!.index >= 0 &&
    active!.index < active!.paper.questionIds.length;
  useEffect(() => {
    if (focusTick === 0) return;
    const node = headingRef.current;
    if (!node) return;
    node.focus();
    node.scrollIntoView({ block: "start" });
  }, [focusTick]);

  useEffect(() => {
    if (!confirming) return;
    confirmRef.current?.scrollIntoView({ block: "nearest" });
  }, [confirming]);

  useEffect(() => {
    if (!mapOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMapOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapOpen]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!active || active.result) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || event.isComposing) return;
      const group = choicesRef.current;
      if (!group || !group.contains(document.activeElement)) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      const letter = "abcd".indexOf(event.key.toLowerCase());
      if (letter < 0) return;
      event.preventDefault();
      const answers = [...active.answers];
      answers[active.index] = letter;
      saveSession({ ...active, answers });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, saveSession]);

  if (!license) return <p>That license class is not on the bench.</p>;
  if (!ready) return <p>Opening the paper.</p>;
  if (!pool) return <p>No {license} pool is in force today. The bench will not build an exam from an expired pool.</p>;

  function start(diagramFree: boolean, force = false) {
    const other = session && !session.result && session.paper.licenseClass !== license;
    if (!force && other) {
      setConfirmReplace(true);
      return;
    }
    const seed = crypto.randomUUID();
    const paper = createExam(pool!, seed, hashSeed(seed), diagramFree);
    beginSession(emptySession(paper, diagramFree));
    setConfirming(false);
    setConfirmReplace(false);
    setMapOpen(false);
    setFocusTick((tick) => tick + 1);
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

  function go(index: number) {
    if (!active || active.result) return;
    setConfirming(false);
    setMapOpen(false);
    patch({ ...active, index });
    setFocusTick((tick) => tick + 1);
  }

  if (!active || (!active.result && !aligned)) {
    const stale = session && session.paper.licenseClass === license && (session.paper.revision !== pool.revision || (active && !aligned));
    return (
      <section className="space-y-5">
        <h1 ref={headingRef} tabIndex={-1} className="display text-4xl outline-none sm:text-5xl">
          Mock {license} exam
        </h1>
        <p className="text-xl">
          One question from each group, in the published A–D order. Grading waits until you turn the paper in. Passing is {pool.passingCount} of {pool.examQuestions}.
        </p>
        {stale ? <p>That saved paper does not match this pool. Start a new one.</p> : null}
        {confirmReplace && session ? (
          <div className="rounded-2xl border border-amber bg-card p-4">
            <p>An unfinished {session.paper.licenseClass} paper is on the bench. Starting this one replaces it.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" className="min-h-11 rounded-full border border-line px-4" onClick={() => setConfirmReplace(false)}>
                Keep that paper
              </button>
              <button type="button" className="min-h-11 rounded-full bg-walnut px-4 text-paper" onClick={() => start(settings.diagramFree, true)}>
                Start this paper
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="flex min-h-11 items-center gap-3 text-lg">
              <input
                type="checkbox"
                checked={settings.diagramFree}
                onChange={(event) => setSettings({ diagramFree: event.target.checked })}
              />
              Diagram-free paper
            </label>
            <button type="button" data-testid="start-exam" className="min-h-11 rounded-full bg-walnut px-5 py-3 text-lg text-paper" onClick={() => start(settings.diagramFree)}>
              Start the paper
            </button>
          </>
        )}
      </section>
    );
  }

  if (active.result) {
    const result = active.result;
    return (
      <section className="space-y-6" data-testid="practice-score">
        <p className="text-sm uppercase tracking-widest text-ink-soft">Practice score</p>
        <h1 ref={headingRef} tabIndex={-1} className="display text-4xl num outline-none sm:text-6xl">
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
            const review = missReview(question, license, pool.groups.find((group) => group.id === question.group)?.title ?? question.group);
            return (
              <li key={id} className="rounded-2xl border border-line bg-card p-4">
                <p className="text-sm uppercase tracking-widest text-ink-soft">
                  {review.kicker} · {id}
                </p>
                <p>{question.text}</p>
                {question.figure ? <FigureView id={question.figure} hidden={false} /> : null}
                <p className="mt-2">{review.fact}</p>
                <QuestionPicture questionId={id} />
                <p className="mt-2">The matching choice is “{question.answers[question.correctIndex]}.”</p>
                {chosen == null ? <p>No answer was marked.</p> : chosen !== question.correctIndex ? <p>{question.distractors[chosen]}</p> : null}
                {question.refs ? <p className="text-ink-soft">The pool cites {question.refs.replace(/[[\]]/g, "")}.</p> : null}
                <div className="mt-3 flex flex-wrap gap-3">
                  {review.href && review.hrefLabel ? (
                    <Link href={review.href} className="inline-flex min-h-11 items-center rounded-full bg-walnut px-4 text-paper">
                      {review.hrefLabel}
                    </Link>
                  ) : null}
                  <Link href={`/license/${license}/practice?q=${question.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4">
                    Practice this question
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <button type="button" className="min-h-11 rounded-full bg-walnut px-5 py-3 text-paper" onClick={() => start(settings.diagramFree)}>
          Start another paper
        </button>
      </section>
    );
  }

  const id = active.paper.questionIds[active.index]!;
  const question = questionById(pool, id);
  if (!question) return <p>This paper points at a question the pool does not have.</p>;
  const selected = active.answers[active.index];
  const forcedFigure = active.paper.figureOnlyIds.includes(question.id);
  const unanswered = active.answers.filter((answer) => answer == null).length;

  return (
    <article className="space-y-6">
      <p className="text-sm uppercase tracking-widest text-ink-soft">
        Question {active.index + 1} of {active.paper.questionIds.length} · answers stay in the published order
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="scroll-mb-40 text-xl leading-snug outline-none sm:text-3xl">
        {question.text}
      </h1>
      <FigureView id={question.figure} hidden={active.diagramFree && !forcedFigure} compact />
      {forcedFigure ? <p>This group has no diagram-free question, so the figure stays.</p> : null}
      <div ref={choicesRef} role="radiogroup" aria-label="Answer choices" tabIndex={0} data-choice-group className="grid gap-3 outline-none">
        {question.answers.map((answer, index) => (
          <button
            key={answer}
            type="button"
            role="radio"
            aria-checked={selected === index}
            data-testid={`choice-${index}`}
            className={`flex min-h-11 items-start gap-3 rounded-2xl border px-4 py-3 text-left text-lg ${selected === index ? "border-walnut bg-paper-deep" : "border-line bg-card"}`}
            onClick={() => pick(index)}
          >
            <span className="num shrink-0 text-ink-soft">{LETTERS[index]}</span>
            <span>{answer}</span>
          </button>
        ))}
      </div>
      <SessionBar>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className="min-h-11 rounded-full border border-line px-2 disabled:opacity-40" disabled={active.index === 0} onClick={() => go(Math.max(0, active.index - 1))}>
            Previous
          </button>
          <button type="button" className="min-h-11 rounded-full border border-line px-2" aria-expanded={mapOpen} aria-haspopup="dialog" onClick={() => setMapOpen(true)}>
            {active.index + 1} of {active.paper.questionIds.length}
          </button>
          <button type="button" data-testid="next-question" className="min-h-11 rounded-full border border-line px-2 disabled:opacity-40" disabled={active.index === active.paper.questionIds.length - 1} onClick={() => go(Math.min(active.paper.questionIds.length - 1, active.index + 1))}>
            Next
          </button>
          <button type="button" data-testid="turn-in" className="col-span-3 min-h-11 rounded-full bg-amber px-4 text-walnut-deep" onClick={() => setConfirming(true)}>
            Turn in paper
          </button>
        </div>
      </SessionBar>
      {mapOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-walnut-deep/80 sm:items-center" role="dialog" aria-modal="true" aria-label="Questions">
          <button type="button" className="absolute inset-0" aria-label="Close questions" onClick={() => setMapOpen(false)} />
          <div className="relative z-10 max-h-[80vh] w-full overflow-auto rounded-t-3xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-lg sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-lg">Questions</p>
              <button type="button" className="min-h-11 rounded-full border border-line px-4" onClick={() => setMapOpen(false)}>
                Close
              </button>
            </div>
            <ol className="flex flex-wrap gap-1">
              {active.paper.questionIds.map((questionId, index) => {
                const answered = active.answers[index] != null;
                return (
                  <li key={questionId}>
                    <button
                      type="button"
                      aria-label={`Question ${index + 1}${answered ? ", answered" : ", unanswered"}`}
                      aria-current={index === active.index ? "true" : undefined}
                      className={`min-h-11 min-w-11 rounded-lg border text-sm ${index === active.index ? "border-walnut bg-walnut text-paper" : answered ? "border-line bg-paper-deep" : "border-line bg-card"}`}
                      onClick={() => go(index)}
                    >
                      {index + 1}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : null}
      {confirming ? (
        <div ref={confirmRef} className="scroll-mb-40 rounded-2xl border border-amber bg-card p-4">
          <p>
            {unanswered} unanswered. Those count as misses. This records one practice score.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className="min-h-11 rounded-full border border-line px-4" onClick={() => setConfirming(false)}>
              Keep working
            </button>
            <button
              type="button"
              data-testid="confirm-turn-in"
              className="min-h-11 rounded-full bg-walnut px-4 text-paper"
              onClick={() => {
                turnIn(pool, paperKey(active.paper));
                setConfirming(false);
                setFocusTick((tick) => tick + 1);
              }}
            >
              Record the practice score
            </button>
          </div>
        </div>
      ) : null}
      <button type="button" className="min-h-11 w-full rounded-2xl border border-line bg-card px-4 text-left md:hidden" aria-expanded={toolsOpen} onClick={() => setToolsOpen((open) => !open)}>
        Calculator and scratch pad
      </button>
      <div className={toolsOpen ? "grid gap-4 md:grid-cols-2" : "hidden gap-4 md:grid md:grid-cols-2"}>
        <Calculator
          value={active.calc}
          onChange={(calc) => patch({ ...active, calc })}
        />
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
    if (token === "⌫") {
      onChange(value.slice(0, -1));
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
  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "⌫", "=", "+", "C"];
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-sm uppercase tracking-widest text-ink-soft">Calculator</p>
      <output className="num mt-2 block min-h-11 break-all text-2xl">{value || "0"}</output>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {keys.map((key) => (
          <button key={key} type="button" className="min-h-11 rounded-xl border border-line" onClick={() => press(key)}>
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
