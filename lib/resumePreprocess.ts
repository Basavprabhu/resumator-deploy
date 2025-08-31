// pages/lib/resumePreprocess.ts
import type { ResumeData } from "../types/resume";

/** Layout hints that the template will consume */
export type SectionFontSizes = {
  name: number; // px
  sectionTitle: number;
  body: number;
  sidebarTitle: number;
  sidebarBody: number;
  duration: number;
};

export type LayoutHints = {
  compactMode: boolean;
  nameFontSize: number;
  maxExperienceItems: number;
  maxBulletsPerExp: number;
  maxEducationItems: number;
  truncateCharPerLine: number;
  sectionFontSizes: SectionFontSizes;
  sidebarWidthPx: number;
};

export type ProcessedResume = ResumeData & { _layout?: LayoutHints };

/* helpers */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const uniqStrings = (arr?: string[]) =>
  Array.from(new Set((arr || []).map((s) => (s || "").trim()).filter(Boolean)));

const joinExpText = (exp?: ResumeData["experience"]) =>
  (exp || []).map((e) => `${e.role} ${e.company} ${e.duration} ${(e.description || []).join(" ")}`).join(" ");

const joinEduText = (edu?: ResumeData["education"]) =>
  (edu || []).map((e) => `${e.degree} ${e.school} ${e.year}`).join(" ");

const joinSimple = (arr?: string[]) => (arr || []).join(" ");

/**
 * preprocessResume
 * - returns a ProcessedResume (immutable copy)
 * - decides compact mode, caps counts, moves overflow to achievements
 * - computes per-section font sizes that the template should use
 */
export function preprocessResume(input: ResumeData): ProcessedResume {
  // deep copy (simple)
  const data: ProcessedResume = JSON.parse(JSON.stringify(input || {}));

  // Character counts (heuristic to compute density)
  const nameLen = (data.name || "").length;
  const titleLen = (data.title || "").length;
  const summaryLen = (data.summary || "").length;
  const expLen = joinExpText(data.experience).length;
  const eduLen = joinEduText(data.education).length;
  const skillsLen = joinSimple(data.skills).length;
  const softLen = joinSimple((data as any).softSkills)?.length || 0;
  const achLen = joinSimple(data.achivements).length;
  const langsLen = joinSimple(data.languages).length;
  const certLen = (data.certifications || []).map((c) => (c.name || "") + (c.year || "")).join(" ").length;
  const volunteerLen = (data.volunteer || []).map((v) => `${v.role} ${v.org} ${(v.description || []).join(" ")}`).join(" ").length;

  const totalChars =
    nameLen +
    titleLen +
    summaryLen +
    expLen +
    eduLen +
    skillsLen +
    softLen +
    achLen +
    langsLen +
    certLen +
    volunteerLen;

  // thresholds — tweak if you like
  const TARGET_CHARS = 3600; // target "comfortable" amount to fit A4 without much scaling
  const MEDIUM_CHARS = 2200; // medium threshold
  const COMPACT_CHAR_THRESHOLD = 4200; // above this, aggressive compacting

  // compact mode decision
  const compactMode = totalChars > MEDIUM_CHARS;

  // compute a global density scale factor (1 = normal, <1 shrink)
  // We want to gently reduce fonts when content grows; keep minimum scale at 0.70
  const rawScale = TARGET_CHARS / Math.max(1, totalChars);
  const globalScale = clamp(Math.pow(rawScale, 0.5), 0.7, 1);

  // Name font size heuristic: long names smaller
  const baseName = 40;
  const nameFontSize = clamp(Math.round(baseName * globalScale - (nameLen > 24 ? (nameLen - 24) * 0.25 : 0)), 16, 48);

  // Base sizes for sections (px) then apply globalScale and some section weighting
  const baseSectionTitle = 14;
  const baseBody = 12;
  const baseSidebarTitle = 12;
  const baseSidebarBody = 11;
  const baseDuration = 10;

  // If resume is extremely dense, reduce sidebar sizes slightly more
  const sidebarPenalty = totalChars > COMPACT_CHAR_THRESHOLD ? 0.88 : 1;

  const sectionFontSizes: SectionFontSizes = {
    name: nameFontSize,
    sectionTitle: clamp(Math.round(baseSectionTitle * globalScale), 10, 18),
    body: clamp(Math.round(baseBody * globalScale), 9, 14),
    sidebarTitle: clamp(Math.round(baseSidebarTitle * globalScale * sidebarPenalty), 9, 14),
    sidebarBody: clamp(Math.round(baseSidebarBody * globalScale * sidebarPenalty), 8, 12),
    duration: clamp(Math.round(baseDuration * globalScale), 8, 12),
  };

  // Decide counts / caps based on compact mode and char density
  const maxExperienceItems = compactMode ? 3 : 6;
  const maxBulletsPerExp = compactMode ? 2 : 4;
  const maxEducationItems = compactMode ? 2 : 6;
  const truncateCharPerLine = compactMode ? 120 : 220;

  // Move overflow experiences / educations into achievements (without duplicates)
  const extraAchievements: string[] = [];
  // ensure arrays are defined
  data.experience = Array.isArray(data.experience) ? data.experience : [];
  data.education = Array.isArray(data.education) ? data.education : [];

  if (data.experience.length > maxExperienceItems) {
    const extras = data.experience.slice(maxExperienceItems);
    data.experience = data.experience.slice(0, maxExperienceItems);
    extras.forEach((e) => {
      const title = `${e.role || ""} — ${e.company || ""}`.trim();
      const bullets = (e.description || []).slice(0, maxBulletsPerExp).map((b) => (b || "").trim());
      const entry = [title, ...(bullets || [])].filter(Boolean).join(" • ");
      if (entry) extraAchievements.push(entry);
    });
  }

  if (data.education.length > maxEducationItems) {
    const extras = data.education.slice(maxEducationItems);
    data.education = data.education.slice(0, maxEducationItems);
    extras.forEach((ed) => {
      const entry = `${ed.degree || ""} — ${ed.school || ""} ${(ed.year || "").trim()}`.trim();
      if (entry) extraAchievements.push(entry);
    });
  }

  // Trim bullets per remaining experience entries and truncate them
  data.experience = data.experience.map((e) => {
    const desc = Array.isArray(e.description) ? e.description.slice(0, maxBulletsPerExp).map((d) => (d || "").trim()) : [];
    return { ...e, description: desc.map((d) => (d.length > truncateCharPerLine ? d.slice(0, truncateCharPerLine - 1).trim() + "…" : d)) };
  });

  // Normalize certifications, softSkills, languages, skills
  data.certifications = Array.isArray(data.certifications) ? data.certifications.map((c) => ({ name: (c.name || "").trim(), year: (c.year || "").trim() })).slice(0, 20) : [];
  (data as any).softSkills = uniqStrings((data as any).softSkills).slice(0, compactMode ? 6 : 12);
  data.skills = uniqStrings(data.skills).slice(0, compactMode ? 12 : 30);
  (data as any).languages = uniqStrings(data.languages).slice(0, compactMode ? 3 : 8);

  // Combine existing achievements and extraAchievements; dedupe and cap
  const existingAch = Array.isArray(data.achivements) ? data.achivements.map((a) => (a || "").trim()) : [];
  const combined = Array.from(new Set([...existingAch, ...extraAchievements])).filter(Boolean);
  const achCap = compactMode ? 6 : 12;
  data.achivements = combined.slice(0, achCap);

  // final layout hints
  const layout: LayoutHints = {
    compactMode,
    nameFontSize,
    maxExperienceItems,
    maxBulletsPerExp,
    maxEducationItems,
    truncateCharPerLine,
    sectionFontSizes,
    sidebarWidthPx: 180,
  };

  data._layout = layout;

  return data;
}
