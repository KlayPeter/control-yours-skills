export function resolveScannedSkillCategory(
  persistedCategory: string | null,
  scannedCategory: string | null
) {
  return persistedCategory ?? scannedCategory;
}
