import { FrequencySnapshot, ThreatScoreBreakdown } from "@/lib/domain/types";
import {
  WEIGHTS,
  STRESS_FREQUENCY_RANGE,
  FREQUENCY_WINDOW_SIZE,
  THREAT_KEYWORDS,
  KEYWORD_TIERS,
} from "@/lib/config/threatScore";

function computeFrequencyScore(snapshots: FrequencySnapshot[]): number {
  const window = snapshots.slice(-FREQUENCY_WINDOW_SIZE);
  if (window.length === 0) return 0;

  const stressCount = window.filter(
    (s) =>
      s.dominantFrequencyHz >= STRESS_FREQUENCY_RANGE.min &&
      s.dominantFrequencyHz <= STRESS_FREQUENCY_RANGE.max
  ).length;

  return (stressCount / window.length) * 100;
}

function computeComplianceScore(
  totalItems: number,
  checkedCount: number
): number {
  if (totalItems === 0) return 0;
  return ((totalItems - checkedCount) / totalItems) * 100;
}

function computeKeywordScore(transcript: string): number {
  const normalized = transcript.toLowerCase();
  let count = 0;
  for (const keyword of THREAT_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = normalized.match(regex);
    if (matches) count += matches.length;
  }

  for (const [threshold, score] of KEYWORD_TIERS) {
    if (count >= threshold) return score;
  }
  return 0;
}

function getLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function computeThreatScore(
  frequencySnapshots: FrequencySnapshot[],
  totalChecklistItems: number,
  checkedCount: number,
  transcript: string
): ThreatScoreBreakdown {
  const frequencyScore = computeFrequencyScore(frequencySnapshots);
  const complianceScore = computeComplianceScore(
    totalChecklistItems,
    checkedCount
  );
  const keywordScore = computeKeywordScore(transcript);

  const overall = Math.round(
    frequencyScore * WEIGHTS.frequency +
      complianceScore * WEIGHTS.compliance +
      keywordScore * WEIGHTS.keyword
  );

  return {
    overall,
    frequencyScore: Math.round(frequencyScore),
    complianceScore: Math.round(complianceScore),
    keywordScore: Math.round(keywordScore),
    level: getLevel(overall),
  };
}
