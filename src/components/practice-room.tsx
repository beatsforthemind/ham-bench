"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { practiceOrder } from "@/lib/exam";
import { labHref } from "@/lib/presets";
import { isLicenseClass, poolForToday } from "@/lib/pools";
import { FigureView } from "./figure";
import { useBench } from "./bench-provider";

const LETTERS = ["A", "B", "C", "D"];

export function PracticeRoom() {
  const params = useParams<{ class: string }>();
  const search = useSearchParams();
  const license = isLicenseClass(params.class) ? params.class : null;
  const { progress, ready, answerPractice, settings } = useBench();
  const [mark, setMark] = useState<{ id: string; index: number } | null>(null);

  const pool = license ? poolForToday(license) : null;
  const questions = useMemo(() => {
    if (!pool) return [];
    const group = search.get("group");
    const filter = search.get("filter");
    return pool.questions.filter((question) => {
      if (group && question.group !== group) return false;
      const stat = progress.questions[question.id];
      if (filter === "unseen") return !stat;
      if (filter === "missed") return Boolean(stat && !stat.lastCorrect);
      if (filter === "weak") return !stat || stat.correct / stat.seen < 0.8 || !stat.lastCorrect;
      return true;
    });
  }, [pool, progress.questions, search]);
  const query = search.toString();
  const [place, setPlace] = useState<{ query: string; cursor: number } | null>(null);
  const startIndex = Math.max(0, questions.findIndex((item) => item.id === search.get("q")));
  const cursor = Math.min(place?.query === query ? place.cursor : startIndex, Math.max(questions.length - 1, 0));

  const question = questions[cursor];
  const answered = mark?.id === question?.id ? mark : null;
  const seen = question ? (progress.questions[question.id]?.seen ?? 0) : 0;
  const orderSeed = answered ? Math.max(0, seen - 1) : seen;
  const order = question ? practiceOrder([...question.answers], `${question.id}:${orderSeed}`) : [0, 1, 2, 3];

  function choose(index: number) {
    if (!question || answered) return;
    setMark({ id: question.id, index });
    answerPractice(question.id, index === question.correctIndex);
  }

  useEffect(() => {
    if (!question || answered) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const index = "abcd".indexOf(event.key.toLowerCase());
      if (index >= 0) choose(order[index] ?? index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!license) return <p>That license class is not on the bench.</p>;
  if (!ready) return <p>Opening the questions.</p>;
  if (!pool) return <p>No {license} pool is in force today, so this practice set stays closed.</p>;
  if (!question) {
    return (
      <p className="text-xl">
        Nothing in this set. <Link href={`/license/${license}/practice`}>Show the whole pool.</Link>
      </p>
    );
  }

  const correctBefore = progress.questions[question.id]?.correct ?? 0;
  const hide = answered || settings.fastLane ? 0 : Math.min(answered ? correctBefore - 1 : correctBefore, question.workedSteps.length);
  const steps = question.workedSteps.slice(0, question.workedSteps.length - hide);
  const href = labHref(question, license);

  return (
    <article className="space-y-6">
      <p className="text-sm uppercase tracking-widest text-ink-soft">
        {question.group} · {cursor + 1} of {questions.length} · practice shuffles the letters
      </p>
      <h1 className="text-3xl leading-snug">{question.text}</h1>
      <FigureView id={question.figure} hidden={false} />
      <div className="grid gap-3">
        {order.map((answerIndex, position) => {
          const picked = answered?.index === answerIndex;
          const right = answerIndex === question.correctIndex;
          const tone = !answered ? "border-line" : right ? "border-sage bg-sage/10" : picked ? "border-amber bg-amber/10" : "border-line opacity-70";
          return (
            <button
              key={answerIndex}
              type="button"
              data-testid={`choice-${position}`}
              className={`min-h-14 rounded-2xl border bg-card px-4 py-3 text-left text-lg ${tone}`}
              onClick={() => choose(answerIndex)}
            >
              <span className="num mr-3 text-ink-soft">{LETTERS[position]}</span>
              {question.answers[answerIndex]}
            </button>
          );
        })}
      </div>
      {question.workedSteps.length > 0 ? (
        <div className="rounded-2xl bg-paper-deep p-4">
          {steps.length > 0 ? (
            <ol className="list-decimal space-y-1 pl-5">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <p>Work this one, then check.</p>
          )}
        </div>
      ) : null}
      {answered ? (
        <div className="space-y-3 rounded-2xl border border-line bg-card p-5" data-testid="feedback">
          <p className="text-xl">The matching choice is “{question.answers[question.correctIndex]}.”</p>
          {answered.index !== question.correctIndex ? <p>{question.distractors[answered.index]}</p> : <p>{question.correctExplanation}</p>}
          {question.refs ? <p className="text-ink-soft">The pool cites {question.refs.replace(/[[\]]/g, "")}.</p> : null}
          {href ? (
            <Link href={href} className="inline-flex rounded-full bg-walnut px-4 py-2 text-paper">
              Try it on the bench
            </Link>
          ) : null}
          <div>
            <button
              type="button"
              data-testid="next-question"
              className="rounded-full border border-line px-4 py-2"
              onClick={() => {
                setMark(null);
                setPlace({ query, cursor: Math.min(questions.length - 1, cursor + 1) });
              }}
            >
              {cursor + 1 === questions.length ? "Stay on the last one" : "Next question"}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
