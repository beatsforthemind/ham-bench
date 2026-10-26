"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { practiceOrder } from "@/lib/exam";
import { labHref } from "@/lib/presets";
import { isLicenseClass, poolForToday } from "@/lib/pools";
import { statFor } from "@/lib/readiness";
import { chartHref } from "@/lib/lanes";
import { questionPicture } from "@/lib/question-pictures";
import { cardFact, cardLead, ideaBeforeAnswer, stepsBeforeAnswer } from "@/lib/teach";
import { FigureView } from "./figure";
import { QuestionPicture } from "./question-picture";
import { LearnRoom } from "./learn-room";
import { useBench } from "./bench-provider";
import { SessionBar } from "./site-header";

const LETTERS = ["A", "B", "C", "D"];

export function PracticeRoom({ learn = false }: { learn?: boolean }) {
  if (learn) return <LearnRoom />;
  return <DrillRoom />;
}

function DrillRoom() {
  const params = useParams<{ class: string }>();
  const search = useSearchParams();
  const license = isLicenseClass(params.class) ? params.class : null;
  const { progress, ready, answerPractice } = useBench();
  const [mark, setMark] = useState<{ id: string; index: number } | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const teachRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  const pool = license ? poolForToday(license) : null;
  const query = search.toString();
  const questions = useMemo(() => {
    if (!pool) return [];
    const group = search.get("group");
    const filter = search.get("filter");
    return pool.questions.filter((question) => {
      if (group && question.group !== group) return false;
      const stat = statFor(progress, pool.revision, question.id);
      if (filter === "unseen") return !stat;
      if (filter === "missed") return Boolean(stat && !stat.lastCorrect);
      if (filter === "weak") return !stat || stat.seen <= 0 || stat.correct / stat.seen < 0.8 || !stat.lastCorrect;
      return true;
    });
  }, [pool, progress, search]);
  const computedIds = questions.map((question) => question.id).join("\n");
  const [lock, setLock] = useState<{ query: string; ids: string[] } | null>(null);
  if (lock?.query !== query) {
    setLock({ query, ids: computedIds ? computedIds.split("\n") : [] });
  }
  const ids = lock?.query === query ? lock.ids : computedIds ? computedIds.split("\n") : [];
  const byId = new Map(pool?.questions.map((question) => [question.id, question]) ?? []);
  const deck = ids.map((id) => byId.get(id)).filter((question) => question != null);
  const [place, setPlace] = useState<{ query: string; cursor: number } | null>(null);
  const startIndex = Math.max(0, ids.indexOf(search.get("q") ?? ""));
  const cursor = Math.min(place?.query === query ? place.cursor : startIndex, Math.max(deck.length - 1, 0));
  const question = deck[cursor];
  const answered = mark?.id === question?.id ? mark : null;
  const stat = question && pool ? statFor(progress, pool.revision, question.id) : undefined;
  const seen = stat?.seen ?? 0;
  const orderSeed = answered ? Math.max(0, seen - 1) : seen;
  const order = useMemo(
    () => (question ? practiceOrder([...question.answers], `${question.id}:${orderSeed}`) : [0, 1, 2, 3]),
    [question, orderSeed],
  );

  const choose = useCallback(
    (index: number) => {
      if (!question || !pool || answered) return;
      setMark({ id: question.id, index });
      answerPractice(pool.revision, question.id, index === question.correctIndex);
    },
    [question, pool, answered, answerPractice],
  );

  useEffect(() => {
    if (!answered) return;
    feedbackRef.current?.focus();
    feedbackRef.current?.scrollIntoView({ block: "nearest" });
  }, [answered]);

  useEffect(() => {
    if (focusTick === 0) return;
    teachRef.current?.focus();
    teachRef.current?.scrollIntoView({ block: "start" });
  }, [focusTick]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || event.isComposing) return;
      const group = choicesRef.current;
      if (!group || !group.contains(document.activeElement)) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      const index = "abcd".indexOf(event.key.toLowerCase());
      if (index < 0) return;
      event.preventDefault();
      choose(order[index] ?? index);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, choose]);

  if (!license) return <p>That license class is not on the bench.</p>;
  if (!ready) return <p>Opening the questions.</p>;
  if (!pool) return <p>No {license} pool is in force today, so this practice set stays closed.</p>;
  if (!question) {
    const filter = search.get("filter");
    const empty =
      filter === "missed"
        ? "No misses recorded yet."
        : filter === "unseen"
          ? "Every question in this set has been seen."
          : filter === "weak"
            ? "Nothing in this set is still weak."
            : "Nothing in this set.";
    return (
      <p className="text-xl">
        {empty} <Link href={`/license/${license}/practice`}>Show the whole pool.</Link>
      </p>
    );
  }

  const steps = question.lane === "bench" ? (answered ? question.workedSteps : stepsBeforeAnswer(question.workedSteps)) : [];
  const href =
    question.lane === "bench"
      ? labHref(question, license) ?? chartHref(question.id, question.group, license)
      : chartHref(question.id, question.group, license);
  const groupTitle = pool.groups.find((group) => group.id === question.group)?.title ?? question.group;
  const citation = question.refs.replace(/[[\]]/g, "");
  const kind = question.lane === "card" ? "exam card" : "radio idea";
  const lead = question.lane === "card" ? cardLead(question) : null;
  const picture = questionPicture(question.id);

  return (
    <article className="space-y-4 sm:space-y-6">
      <p className="text-sm uppercase tracking-widest text-ink-soft">
        {question.group} · {cursor + 1} of {deck.length} · {kind}
      </p>
      {question.lane === "card" && (lead || picture) ? (
        <div ref={teachRef} tabIndex={-1} className="rounded-3xl border border-line bg-card p-3 outline-none sm:p-5" data-testid="exam-fact">
          <p className="text-sm uppercase tracking-widest text-ink-soft">A way in</p>
          {lead ? <p className="mt-2 text-base sm:text-xl">{lead}</p> : null}
          <QuestionPicture questionId={question.id} />
          {citation ? <p className="mt-2 text-ink-soft">The pool cites {citation}.</p> : null}
        </div>
      ) : question.lane === "bench" ? (
        <div ref={teachRef} tabIndex={-1} className="rounded-3xl border border-line bg-card p-3 outline-none sm:p-5" data-testid="idea-note">
          <p className="text-sm uppercase tracking-widest text-ink-soft">The idea</p>
          <p className="mt-2 text-base sm:text-xl">{ideaBeforeAnswer(question, groupTitle, question.workedSteps)}</p>
          <QuestionPicture questionId={question.id} />
          {href ? (
            <Link href={href} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-walnut px-4 text-paper">
              {href.startsWith("/bands") ? "Open the band chart" : "Try it on the bench"}
            </Link>
          ) : null}
        </div>
      ) : null}
      <h1
        ref={(node) => {
          headingRef.current = node;
          if (question.lane === "card" && !lead && !picture) teachRef.current = node;
        }}
        tabIndex={-1}
        className="text-xl leading-snug outline-none sm:text-3xl"
      >
        {question.text}
      </h1>
      <FigureView id={question.figure} hidden={false} compact />
      <div ref={choicesRef} role="radiogroup" aria-label="Answer choices" tabIndex={0} className="grid gap-3 outline-none">
        {order.map((answerIndex, position) => {
          const picked = answered?.index === answerIndex;
          const right = answerIndex === question.correctIndex;
          const tone = !answered ? "border-line" : right ? "border-sage bg-sage/10" : picked ? "border-amber bg-amber/10" : "border-line opacity-70";
          return (
            <button
              key={answerIndex}
              type="button"
              role="radio"
              aria-checked={Boolean(picked)}
              data-testid={`choice-${position}`}
              className={`flex min-h-11 items-start gap-3 rounded-2xl border bg-card px-4 py-3 text-left text-lg ${tone}`}
              onClick={() => choose(answerIndex)}
            >
              <span className="num shrink-0 text-ink-soft">{LETTERS[position]}</span>
              <span>
                {question.answers[answerIndex]}
                {answered && right ? <span className="sr-only"> Correct answer.</span> : null}
                {picked ? <span className="sr-only"> Your choice.</span> : null}
              </span>
            </button>
          );
        })}
      </div>
      {steps.length > 0 ? (
        <div className="rounded-2xl bg-paper-deep p-4">
          <ol className="list-decimal space-y-1 pl-5">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}
      {answered ? (
        <div ref={feedbackRef} tabIndex={-1} role="status" className="scroll-mb-40 space-y-3 rounded-2xl border border-line bg-card p-4 outline-none sm:p-5" data-testid="feedback">
          {question.lane === "card" ? (
            <>
              <p className="text-xl">{cardFact(question.answers[question.correctIndex] ?? "")}</p>
              {lead ? <p>{lead}</p> : null}
            </>
          ) : (
            <p className="text-xl">The matching choice is “{question.answers[question.correctIndex]}.”</p>
          )}
          {answered.index !== question.correctIndex ? <p>{question.distractors[answered.index]}</p> : null}
          {question.lane === "card" && href ? (
            <Link href={href} className="inline-flex min-h-11 items-center rounded-full border border-line px-4">
              Open the band chart
            </Link>
          ) : null}
        </div>
      ) : null}
      {answered ? (
        <SessionBar>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-11 rounded-full border border-line px-4 disabled:opacity-40"
              disabled={cursor === 0}
              onClick={() => {
                setMark(null);
                setPlace({ query, cursor: Math.max(0, cursor - 1) });
                setFocusTick((tick) => tick + 1);
              }}
            >
              Back
            </button>
            <button
              type="button"
              data-testid="next-question"
              className="min-h-11 rounded-full border border-line px-4"
              onClick={() => {
                setMark(null);
                setPlace({ query, cursor: Math.min(deck.length - 1, cursor + 1) });
                setFocusTick((tick) => tick + 1);
              }}
            >
              {cursor + 1 === deck.length ? "Stay on the last one" : "Next question"}
            </button>
          </div>
        </SessionBar>
      ) : null}
    </article>
  );
}
