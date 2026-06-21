import { describe, expect, it } from "vitest";

function normalizeCategoryName(value: string) {
  return value.trim().replace(/[\\/]+/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function filterSkillsByCategory<T extends { category: string | null; name: string; slug: string; description: string | null }>(
  skills: T[],
  category: string,
  term: string
) {
  const normalizedTerm = term.trim().toLowerCase();

  return skills.filter((skill) => {
    const matchesCategory = !category || skill.category === category;
    if (!matchesCategory) {
      return false;
    }

    if (!normalizedTerm) {
      return true;
    }

    return (
      skill.name.toLowerCase().includes(normalizedTerm) ||
      skill.slug.toLowerCase().includes(normalizedTerm) ||
      skill.description?.toLowerCase().includes(normalizedTerm)
    );
  });
}

describe("skill category helpers", () => {
  it("normalizes category names into safe folder names", () => {
    expect(normalizeCategoryName("  video tools  ")).toBe("video-tools");
    expect(normalizeCategoryName("video\\editing")).toBe("video-editing");
    expect(normalizeCategoryName("////")).toBe("");
  });

  it("filters installed skills by category and search term", () => {
    const skills = [
      { name: "Video Cutter", slug: "video-cutter", description: "Trim clips fast", category: "video" },
      { name: "Audio Cleaner", slug: "audio-cleaner", description: "Fix noisy tracks", category: "audio" },
      { name: "Video Subtitle", slug: "video-subtitle", description: "Generate subtitles", category: "video" }
    ];

    expect(filterSkillsByCategory(skills, "video", "").map((skill) => skill.slug)).toEqual([
      "video-cutter",
      "video-subtitle"
    ]);
    expect(filterSkillsByCategory(skills, "video", "subtitle").map((skill) => skill.slug)).toEqual([
      "video-subtitle"
    ]);
  });
});
