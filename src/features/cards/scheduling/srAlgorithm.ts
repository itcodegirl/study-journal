// srAlgorithm — pure spaced-repetition scheduling.
//
// Provenance: ported from CodeHerWay `src/services/srAlgorithm.ts` (REUSE per
// docs/CODEHERWAY-REUSE-AUDIT.md). Behavior is intentionally unchanged; only the
// DAY_MS import moved to the Study Journal defaults module.
//
// One scheduler: a 4-grade SM-2 variant. Pure and clock-parameterized so tests
// can drive grade sequences with a pinned clock; `now` defaults to Date.now().

import { DAY_MS } from './cardDefaults';

const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const WRONG_ANSWER_INTERVAL = 1;

interface SRCard {
  ease: number;
  interval: number;
  repetitionCount?: number | undefined;
}

export type SRGradeInput = 'forgot' | 'hard' | 'good' | 'easy';

const GRADE_TO_EASE_DELTA: Record<SRGradeInput, number> = {
  forgot: -0.3,
  hard: -0.1,
  good: 0.1,
  easy: 0.2,
};

const HARD_INTERVAL_MULT = 1.2;
const EASY_BONUS_MULT = 1.3;

interface NextSRCardStateFromGradeOptions {
  card: SRCard;
  grade: SRGradeInput;
  now?: number;
}

export interface NextSRCardStateFromGrade {
  interval: number;
  ease: number;
  nextReview: number;
  repetitionCount: number;
  /** True for 'forgot': re-show the card later in the same session before the 1-day floor takes over. */
  reshow: boolean;
}

//   forgot → interval floors to 1 day, ease −0.30, reshow sentinel set
//   hard   → interval × 1.2, ease −0.10
//   good   → interval × ease (BEFORE-update, SM-2 convention), ease +0.10
//   easy   → interval × ease × 1.3, ease +0.20
export function nextSRCardStateFromGrade({
  card,
  grade,
  now = Date.now(),
}: NextSRCardStateFromGradeOptions): NextSRCardStateFromGrade {
  const ease = Math.min(EASE_MAX, Math.max(EASE_MIN, card.ease + GRADE_TO_EASE_DELTA[grade]));
  const previousRepetitions = Number.isFinite(card.repetitionCount)
    ? Math.max(0, Math.floor(card.repetitionCount ?? 0))
    : 0;

  let interval: number;
  let repetitionCount: number;
  switch (grade) {
    case 'forgot':
      interval = WRONG_ANSWER_INTERVAL;
      repetitionCount = 0;
      break;
    case 'hard':
      interval = Math.max(1, Math.round(card.interval * HARD_INTERVAL_MULT));
      repetitionCount = previousRepetitions + 1;
      break;
    case 'good':
      interval = Math.max(1, Math.round(card.interval * card.ease));
      repetitionCount = previousRepetitions + 1;
      break;
    case 'easy':
      interval = Math.max(1, Math.round(card.interval * card.ease * EASY_BONUS_MULT));
      repetitionCount = previousRepetitions + 1;
      break;
  }

  return {
    interval,
    ease,
    repetitionCount,
    nextReview: now + interval * DAY_MS,
    reshow: grade === 'forgot',
  };
}
