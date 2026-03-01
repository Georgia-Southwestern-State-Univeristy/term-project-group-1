import { ChecklistItem } from "@/lib/domain/types";
import {
  getCheckedIds,
  markChecked,
} from "@/lib/repositories/checklistStateRepo";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function autoCheckChecklist(
  sessionId: string,
  checklistItems: ChecklistItem[],
  transcriptText: string
): string[] {
  const alreadyChecked = new Set(getCheckedIds(sessionId));
  const normalizedTranscript = normalize(transcriptText);
  const newlyChecked: string[] = [];

  for (const item of checklistItems) {
    if (alreadyChecked.has(item.id)) continue;

    const normalizedItem = normalize(item.text);
    if (normalizedTranscript.includes(normalizedItem)) {
      markChecked(sessionId, item.id);
      newlyChecked.push(item.id);
    }
  }

  return newlyChecked;
}
