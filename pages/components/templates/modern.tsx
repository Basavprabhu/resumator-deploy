// pages/components/templates/modern.tsx
import React, { useEffect, useRef, useState } from "react";
import { ResumeData } from "../../types/resume";
import { profile } from "console";

type ExpItem = {
  role?: string;
  company?: string;
  duration?: string;
  description?: string[] | string;
};

type EduItem = {
  degree?: string;
  school?: string;
  year?: string;
};

type Props = {
  data: ResumeData & {
    _layout?: {
      nameFontSize?: number;
      sectionFontSizes?: {
        name?: number;
        sectionTitle?: number;
        body?: number;
        sidebarTitle?: number;
        sidebarBody?: number;
        duration?: number;
        profileImage?:string,
      };
      sidebarWidthPx?: number;
      maxBulletsPerExp?: number;
      maxExperienceItems?: number;
      maxEducationItems?: number;
      truncateCharPerLine?: number;
    };
  };
};

export default function ModernTemplate({ data }: Props) {
  const {
    name = "Your Name",
    title = "",
    photoUrl = "",
    contact = { phone: "", email: "", address: "", linkedin: "" },
    summary = "",
    experience = [] as ExpItem[],
    education = [] as EduItem[],
    certifications = [] as any[],
    skills = [] as string[],
    achievements = [] as string[],
    languages = [] as string[],
    coursework = [] as string[],
    societies = [] as string[],
    github,
    linkedin,
    portfolio,
  } = data as any;

  const layout = data._layout ?? {};
  const fs = layout.sectionFontSizes ?? {};
  const nameFont = fs.name ?? layout.nameFontSize ?? 32;
  const sectionTitleFont = fs.sectionTitle ?? 13;
  const bodyFont = fs.body ?? 12;
  const sidebarTitleFont = fs.sidebarTitle ?? 12;
  const sidebarBodyFont = fs.sidebarBody ?? 11;
  const durationFont = fs.duration ?? 10;

  const maxBullets = layout.maxBulletsPerExp ?? 4;
  const maxExperienceItems = layout.maxExperienceItems ?? 6;
  const maxEducationItems = layout.maxEducationItems ?? 6;
  const truncateChars = layout.truncateCharPerLine ?? 220;
  const sidebarWidth = layout.sidebarWidthPx ?? 200;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const MIN_SCALE = 0.65;
  const INNER_WIDTH = 760;

  useEffect(() => {
    const fitToPage = () => {
      if (!containerRef.current || !contentRef.current) return;

      const container = containerRef.current;
      const content = contentRef.current;

      content.style.transform = "scale(1)";
      content.style.transformOrigin = "top left";

      requestAnimationFrame(() => {
        const containerW = container.clientWidth;
        const contentW = content.scrollWidth;

        let s = Math.min(1, (containerW - 28) / Math.max(contentW, INNER_WIDTH));
        if (s < MIN_SCALE) s = MIN_SCALE;
        setScale(s);
      });
    };

    fitToPage();
    window.addEventListener("resize", fitToPage);
    return () => window.removeEventListener("resize", fitToPage);
  }, [data]);

  const truncate = (s: string, n = truncateChars) =>
    s && s.length > n ? s.slice(0, n - 1).trim() + "…" : s;

 return (
  <div className="py-6">
    <div
      ref={containerRef}
      className="relative max-w-3xl mx-auto bg-white p-8 print:p-4 box-border"
      aria-label="resume page"
      style={{ WebkitPrintColorAdjust: "exact" }}
    >
      <div
        ref={contentRef}
        className="w-full"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
  {/* Left side: Name + Contact Info */}
  <div className="flex-1 text-left">
    <h1
      className="font-bold text-gray-900"
      style={{ fontSize: `${nameFont}px`, lineHeight: 1.1 }}
    >
      {name}
    </h1>
    {title && (
      <div className="text-gray-700 font-medium">{title}</div>
    )}
    <div className="text-sm text-gray-600 mt-1">
      {contact.email && <span>{contact.email}</span>}
      {contact.email && contact.phone && <span className="mx-2">|</span>}
      {contact.phone && <span>{contact.phone}</span>}
      {contact.linkedin && (contact.phone || contact.email) && (
        <span className="mx-2">|</span>
      )}
      {contact.linkedin && (
        <a
          className="text-blue-700 underline"
          href={contact.linkedin}
        >
          {contact.linkedin.replace(/^https?:\/\//, "")}
        </a>
      )}
    </div>
  </div>

  {/* Profile Image Holder */}
<div className="w-40 h-40 rounded-full border-2 border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100">
  {data.photoUrl ? (
    <img
      src={data.photoUrl}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-gray-400 text-sm">Photo</span>
  )}
</div>


</header>


        {summary && (
          <section className="mb-5">
            <p
              className="text-gray-800"
              style={{ fontSize: `${bodyFont}px`, lineHeight: 1.4 }}
            >
              {truncate(summary)}
            </p>
          </section>
        )}
    



          <div className="grid grid-cols-3 gap-6 items-start">
            {/* Main content */}
            <main className="col-span-2">
              {/* Experience */}
              {experience.length > 0 && (
                <section className="mb-5">
                  <h2
                    className="font-semibold text-gray-900 mb-2 tracking-wide"
                    style={{ fontSize: `${sectionTitleFont}px` }}
                  >
                    EXPERIENCE
                  </h2>
                  <div className="space-y-4">
                    {experience.slice(0, maxExperienceItems).map((exp: any, idx: number) => (
                      <div key={idx}>
                        <div className="flex justify-between items-baseline">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {exp.company}
                            </div>
                            <div className="text-gray-700">{exp.role}</div>
                          </div>
                          <div
                            className="text-xs text-gray-600"
                            style={{ fontSize: `${durationFont}px` }}
                          >
                            {exp.duration}
                          </div>
                        </div>
                        <ul
                          className="list-disc ml-5 mt-2 text-gray-800"
                          style={{ fontSize: `${bodyFont}px`, lineHeight: 1.35 }}
                        >
                          {exp.description
                            .slice(0, maxBullets)
                            .map((d: string, j: number) => (
                              <li key={j}>{truncate(d)}</li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Achievements */}
              {achievements && achievements.length > 0 && (
                <section className="mb-5">
                  <h2
                    className="font-semibold text-gray-900 mb-2 tracking-wide"
                    style={{ fontSize: `${sectionTitleFont}px` }}
                  >
                    ACHIEVEMENTS
                  </h2>
                  <ul
                    className="list-disc ml-5 text-gray-800"
                    style={{ fontSize: `${bodyFont}px` }}
                  >
                    {achievements.map((a: string, i: number) => (
                      <li key={i}>{truncate(a)}</li>
                    ))}
                  </ul>
                </section>
              )}
            </main>

            {/* Sidebar */}
            <aside
              className="col-span-1 border-l border-gray-200 pl-4"
              style={{ width: sidebarWidth }}
            >
              {/* Education */}
              {education.length > 0 && (
                <section className="mb-4">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    EDUCATION
                  </h3>
                  <div
                    className="space-y-2 text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {education.map((edu: EduItem, i: number) => (
                      <div key={i}>
                        <div className="font-medium">{edu.degree}</div>
                        <div className="text-xs text-gray-600">
                          {edu.school} {edu.year && `• ${edu.year}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Skills */}
              {skills && skills.length > 0 && (
                <section className="mb-4">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    SKILLS
                  </h3>
                  <ul
                    className="flex flex-wrap gap-1 text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {skills.map((s: string, i: number) => (
                      <li
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 rounded"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Languages */}
              {languages && languages.length > 0 && (
                <section className="mb-4">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    LANGUAGES
                  </h3>
                  <div
                    className="text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {languages.join(", ")}
                  </div>
                </section>
              )}

              {/* Links */}
              {(github || linkedin || portfolio) && (
                <section className="mb-4">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    LINKS
                  </h3>
                  <div
                    className="text-blue-700 flex flex-col gap-1"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {github && (
                      <a href={github} className="underline break-words">
                        {github.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {linkedin && (
                      <a href={linkedin} className="underline break-words">
                        {linkedin.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {portfolio && (
                      <a href={portfolio} className="underline break-words">
                        {portfolio.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
