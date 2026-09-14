// Scheduling seed values every new card starts with. One source of truth: the
// card composer, future review surfaces, and persistence all import from here.
//
// Provenance: ported from CodeHerWay `src/services/srDefaults.ts` and
// `src/features/cards/cardDefaults.ts` (REUSE per docs/CODEHERWAY-REUSE-AUDIT.md).
// A new card is due tomorrow (interval 1) at the SM-2 default ease.

export const DAY_MS = 24 * 60 * 60 * 1000;
export const SR_STARTING_INTERVAL = 1;
export const SR_STARTING_EASE = 2.5;
