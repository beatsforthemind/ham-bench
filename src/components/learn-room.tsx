"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CLASS_INFO } from "@/lib/class-info";
import { practiceOrder } from "@/lib/exam";
import { groupNote } from "@/lib/explain";
import { chartHref } from "@/lib/lanes";
import { firstLearnQuestion, learnDeck, nextColdAfter, rememberLearn, rememberedLearn, type LearnDeck } from "@/lib/learn";
import { isLicenseClass, poolForToday } from "@/lib/pools";
import type { LicenseClass, PoolFile, PoolQuestion } from "@/lib/pool-types";
import { labHref } from "@/lib/presets";
import { questionPicture } from "@/lib/question-pictures";
import { statFor } from "@/lib/readiness";
import { cardFact, cardLead, ideaBeforeAnswer } from "@/lib/teach";
import { useBench } from "./bench-provider";
import { FigureView } from "./figure";
import { QuestionPicture } from "./question-picture";

const LETTERS = ["A", "B", "C", "D"];

type LockedDeck = {
  license: LicenseClass;
  groupId: string;
  ids: string[];
  cursor: number;
  nextGroupId: string | null;
};

function lockDeck(license: LicenseClass, deck: LearnDeck): LockedDeck {
  const cursor = Math.max(0, deck.questionIds.indexOf(deck.startId));
  return { license, groupId: deck.groupId, ids: deck.questionIds, cursor, nextGroupId: deck.nextGroupId };
}

export function LearnRoom() {
  const params = useParams<{ class: string }>();
  const search = useSearchParams();
  const license = isLicenseClass(params.class) ? params.class : null;
  const { progress, ready, answerPractice } = useBench();
  const pool = license ? poolForToday(license) : null;
  const [locked, setLocked] = useState<LockedDeck | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [shown, setShown] = useState<Record<string, true>>({});
  const [focusTick, setFocusTick] = useState(0);
  const [revealTick, setRevealTick] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  const preferred = ready && license ? search.get("q") || rememberedLearn(license) : null;
  const opened = pool && ready ? learnDeck(pool, progress, preferred) : null;
  const deck = locked?.license === license ? locked : opened && license ? lockDeck(license, opened) : null;
  if (ready && license && deck && locked?.license !== license) setLocked(deck);

  const question = deck && pool ? pool.questions.find((item) => item.id === deck.ids[deck.cursor]) : undefined;
  const picked = question ? picks[question.id] : undefined;
  const revealed = Boolean(question && (picked != null || shown[question.id]));
  const stat = question && pool ? statFor(progress, pool.revision, question.id) : undefined;
  const seen = stat?.seen ?? 0;
  const orderSeed = picked != null ? Math.max(0, seen - 1) : seen;
  const order = useMemo(
    () => (question ? practiceOrder([...question.answers], `${question.id}:${orderSeed}`) : [0, 1, 2, 3]),
    [question, orderSeed],
  );

  useEffect(() => {
    if (!license || !question) return;
    rememberLearn(license, question.id);
  }, [license, question]);

  const choose = useCallback(
    (index: number) => {
      if (!question || !pool || picked != null) return;
      setPicks((current) => ({ ...current, [question.id]: index }));
      setRevealTick((tick) => tick + 1);
      answerPractice(pool.revision, question.id, index === question.correctIndex);
    },
    [question, pool, picked, answerPractice, setPicks, setRevealTick],
  );

  useEffect(() => {
    if (revealTick === 0) return;
    revealRef.current?.focus();
    revealRef.current?.scrollIntoView({ block: "nearest" });
  }, [revealTick]);

  useEffect(() => {
    if (focusTick === 0) return;
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: "start" });
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
  if (!ready) return <p>Opening the lesson.</p>;
  if (!pool) return <p>No {license} pool is in force today, so this lesson stays closed.</p>;
  if (!deck || !question) {
    return (
      <div className="max-w-xl space-y-4" data-testid="learn-warm">
        <h1 className="display text-4xl text-walnut sm:text-5xl">This class is warm.</h1>
        <p className="text-lg text-ink-soft">Every group is learned or solid. The paper can wait until you want it.</p>
        <Link href={`/license/${license}/exam`} className="inline-flex min-h-11 items-center underline">
          Sit the {CLASS_INFO[license].name} paper
        </Link>
      </div>
    );
  }

  return (
    <LearnCard
      license={license}
      pool={pool}
      deck={deck}
      question={question}
      order={order}
      picked={picked}
      revealed={revealed}
      headingRef={headingRef}
      revealRef={revealRef}
      choicesRef={choicesRef}
      onShow={() => {
        setShown((current) => ({ ...current, [question.id]: true }));
        setRevealTick((tick) => tick + 1);
      }}
      onChoose={choose}
      onBack={() => {
        setLocked({ ...deck, cursor: Math.max(0, deck.cursor - 1) });
        setFocusTick((tick) => tick + 1);
      }}
      onNext={() => {
        setLocked({ ...deck, cursor: deck.cursor + 1 });
        setFocusTick((tick) => tick + 1);
      }}
      onNextGroup={(groupId) => {
        const ids = pool.questions.filter((item) => item.group === groupId).map((item) => item.id);
        const startId = firstLearnQuestion(pool, progress, ids);
        const cursor = Math.max(0, ids.indexOf(startId));
        setLocked({
          license,
          groupId,
          ids,
          cursor,
          nextGroupId: nextColdAfter(pool, progress, groupId)?.id ?? null,
        });
        if (startId) rememberLearn(license, startId);
        setFocusTick((tick) => tick + 1);
      }}
    />
  );
}

function LearnCard({
  license,
  pool,
  deck,
  question,
  order,
  picked,
  revealed,
  headingRef,
  revealRef,
  choicesRef,
  onShow,
  onChoose,
  onBack,
  onNext,
  onNextGroup,
}: {
  license: LicenseClass;
  pool: PoolFile;
  deck: LockedDeck;
  question: PoolQuestion;
  order: number[];
  picked: number | undefined;
  revealed: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  revealRef: RefObject<HTMLDivElement | null>;
  choicesRef: RefObject<HTMLDivElement | null>;
  onShow: () => void;
  onChoose: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  onNextGroup: (groupId: string) => void;
}) {
  const groupTitle = pool.groups.find((group) => group.id === question.group)?.title ?? question.group;
  const lead = question.lane === "card" ? cardLead(question) : null;
  const idea = question.lane === "bench" ? ideaBeforeAnswer(question, groupTitle, question.workedSteps) : null;
  const withheld = idea === `This one follows from ${groupTitle}.`;
  const href =
    question.lane === "bench" ? labHref(question, license) ?? chartHref(question.id, question.group, license) : chartHref(question.id, question.group, license);
  const picture = questionPicture(question.id);
  const kind = question.lane === "card" ? "exam card" : "radio idea";
  const citation = question.refs.replace(/[[\]]/g, "");
  const atEnd = deck.cursor + 1 === deck.ids.length;
  const correct = question.answers[question.correctIndex] ?? "";

  return (
    <article className="space-y-3 sm:space-y-6">
      <p className="text-sm uppercase tracking-widest text-ink-soft">
        {question.group} · {deck.cursor + 1} of {deck.ids.length} · {kind}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="text-xl leading-snug outline-none sm:text-3xl">
        {question.text}
      </h1>
      {lead || idea || picture || href ? (
        <div className="rounded-3xl border border-line bg-card p-3 sm:p-5" data-testid={question.lane === "card" ? "exam-fact" : "idea-note"}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm uppercase tracking-widest text-ink-soft">{question.lane === "card" ? "A way in" : "The idea"}</p>
              {lead ? <p className="mt-2 text-base sm:text-xl">{lead}</p> : null}
              {idea ? <p className="mt-2 text-base sm:text-xl">{idea}</p> : null}
              {citation && question.lane === "card" ? <p className="mt-2 text-ink-soft">The pool cites {citation}.</p> : null}
            </div>
            {picture ? (
              <div className="w-28 shrink-0 sm:w-56">
                <QuestionPicture questionId={question.id} />
              </div>
            ) : null}
          </div>
          {href ? (
            <Link href={href} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-walnut px-4 text-paper no-underline">
              {href.startsWith("/bands") ? "Open the band chart" : "Try it on the bench"}
            </Link>
          ) : null}
        </div>
      ) : null}
      {!revealed ? (
        <button type="button" data-testid="show-me" className="inline-flex min-h-11 items-center underline" onClick={onShow}>
          Show me
        </button>
      ) : null}
      <div ref={choicesRef} role="radiogroup" aria-label="Answer choices" tabIndex={0} className="grid gap-2 outline-none sm:gap-3">
        {order.map((answerIndex, position) => {
          const chosen = picked === answerIndex;
          const right = answerIndex === question.correctIndex;
          const tone = !revealed
            ? "border-line"
            : right
              ? "border-sage bg-sage/10"
              : chosen
                ? "border-amber bg-amber/10"
                : picked != null
                  ? "border-line opacity-70"
                  : "border-line";
          return (
            <button
              key={answerIndex}
              type="button"
              role="radio"
              aria-checked={Boolean(chosen)}
              data-testid={`choice-${position}`}
              className={`flex min-h-11 items-start gap-3 rounded-2xl border bg-card px-4 py-2 text-left text-base sm:py-3 sm:text-lg ${tone}`}
              onClick={() => onChoose(answerIndex)}
            >
              <span className="num shrink-0 text-ink-soft">{LETTERS[position]}</span>
              <span>
                {question.answers[answerIndex]}
                {revealed && right ? <span className="sr-only"> Correct answer.</span> : null}
                {chosen ? <span className="sr-only"> Your choice.</span> : null}
              </span>
            </button>
          );
        })}
      </div>
      <FigureView id={question.figure} hidden={false} compact />
      {revealed ? (
        <div ref={revealRef} tabIndex={-1} role="status" className="scroll-mb-40 space-y-3 rounded-2xl border border-line bg-card p-4 outline-none sm:p-5" data-testid="feedback">
          {picked == null ? <p>The right choice is highlighted.</p> : null}
          {picked != null && question.lane === "card" ? <p className="text-xl">{cardFact(correct)}</p> : null}
          {picked != null && question.lane === "bench" ? <p className="text-xl">The matching choice is “{correct}.”</p> : null}
          {withheld ? <p>{groupNote(question.group, groupTitle)}</p> : null}
          {question.workedSteps.length > 0 ? (
            <ol className="list-decimal space-y-1 pl-5">
              {question.workedSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
          {picked != null && picked !== question.correctIndex ? <p>{question.distractors[picked]}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-full border border-line px-4 disabled:opacity-40"
          disabled={deck.cursor === 0}
          onClick={onBack}
        >
          Back
        </button>
        {atEnd && deck.nextGroupId ? (
          <button type="button" data-testid="next-group" className="min-h-11 rounded-full border border-line px-4" onClick={() => onNextGroup(deck.nextGroupId!)}>
            Next group
          </button>
        ) : null}
        {!atEnd ? (
          <button type="button" data-testid="next-question" className="min-h-11 rounded-full border border-line px-4" onClick={onNext}>
            Next question
          </button>
        ) : null}
        {atEnd && !deck.nextGroupId ? <p className="self-center text-ink-soft">That’s the last cold group.</p> : null}
      </div>
    </article>
  );
}
