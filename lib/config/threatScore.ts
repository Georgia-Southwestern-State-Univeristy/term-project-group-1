/** Weights for each scoring component (must sum to 1.0) */
export const WEIGHTS = {
  frequency: 0.35,
  compliance: 0.35,
  keyword: 0.3,
} as const;

/** Frequency range (Hz) associated with vocal stress */
export const STRESS_FREQUENCY_RANGE = {
  min: 250,
  max: 400,
} as const;

/** Number of recent snapshots to analyze for frequency scoring */
export const FREQUENCY_WINDOW_SIZE = 20;

/** Keywords that indicate potential threats */
export const THREAT_KEYWORDS = [
  "threat",
  "kill",
  "bomb",
  "attack",
  "weapon",
  "hurt",
  "destroy",
  "explode",
  "gun",
  "knife",
  "die",
  "shoot",
  "murder",
  "harm",
  "violence",
] as const;

/** Keyword count → score tier mapping */
export const KEYWORD_TIERS: [number, number][] = [
  [8, 100],
  [5, 75],
  [3, 50],
  [1, 25],
  [0, 0],
];
