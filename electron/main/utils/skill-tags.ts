export function normalizeSkillTags(values: string[]) {
  return [
    ...new Set(
      values
        .map((value) => value.trim().replace(/^#+/, "").toLowerCase().slice(0, 40))
        .filter(Boolean)
    )
  ].slice(0, 20);
}

export function applySkillTagChanges(existing: string[], added: string[], removed: string[]) {
  const removedTags = new Set(normalizeSkillTags(removed));
  return normalizeSkillTags([...existing, ...added]).filter((tag) => !removedTags.has(tag));
}
