const g = globalThis as unknown as {
  _checklistState?: Map<string, Set<string>>;
};
const state = (g._checklistState ??= new Map<string, Set<string>>());

export async function markChecked(
  sessionId: string,
  itemId: string
): Promise<void> {
  let checked = state.get(sessionId);
  if (!checked) {
    checked = new Set<string>();
    state.set(sessionId, checked);
  }
  checked.add(itemId);
}

export async function getCheckedIds(sessionId: string): Promise<string[]> {
  const checked = state.get(sessionId);
  return checked ? Array.from(checked) : [];
}
