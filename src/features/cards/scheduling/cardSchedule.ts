import type { CardSchedule } from '../cards.types';
import { DAY_MS, SR_STARTING_EASE, SR_STARTING_INTERVAL } from './cardDefaults';
import { nextSRCardStateFromGrade, type SRGradeInput } from './srAlgorithm';

export function createInitialSchedule(now: Date): CardSchedule {
  return {
    ease: SR_STARTING_EASE,
    intervalDays: SR_STARTING_INTERVAL,
    repetitionCount: 0,
    nextReviewAt: new Date(now.getTime() + SR_STARTING_INTERVAL * DAY_MS).toISOString(),
  };
}

/**
 * Bridges the ported scheduler to Study Journal's card shape. Phase 1 has no
 * review UI; this is the entry point a review queue will call.
 */
export function scheduleAfterGrade(
  schedule: CardSchedule,
  grade: SRGradeInput,
  now: Date,
): { schedule: CardSchedule; reshow: boolean } {
  const next = nextSRCardStateFromGrade({
    card: { ease: schedule.ease, interval: schedule.intervalDays, repetitionCount: schedule.repetitionCount },
    grade,
    now: now.getTime(),
  });
  return {
    schedule: {
      ease: next.ease,
      intervalDays: next.interval,
      repetitionCount: next.repetitionCount,
      nextReviewAt: new Date(next.nextReview).toISOString(),
      lastGrade: grade,
      gradedAt: now.toISOString(),
    },
    reshow: next.reshow,
  };
}
