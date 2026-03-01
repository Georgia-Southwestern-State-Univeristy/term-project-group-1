const g = globalThis as unknown as {
  _checklistState?: Map<string, Set<string>>;
};
const state = (g._checklistState ??= new Map<string, Set<string>>());

export function markChecked(sessionId: string, itemId: string): void {
  let checked = state.get(sessionId);
  if (!checked) {
    checked = new Set<string>();
    state.set(sessionId, checked);
  }
  checked.add(itemId);
}

export function getCheckedIds(sessionId: string): string[] {
  const checked = state.get(sessionId);
  return checked ? Array.from(checked) : [];
}
