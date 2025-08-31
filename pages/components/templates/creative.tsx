// pages/components/templates/creative.tsx
import React, { useEffect, useRef, useState } from "react";
import { ResumeData } from "../../types/resume";

type Props = {
  data: ResumeData & {
    _layout?: {
      compactMode?: boolean;
      nameFontSize?: number;
      maxBulletsPerExp?: number;
      maxExperienceItems?: number;
      maxEducationItems?: number;
      truncateCharPerLine?: number;
      sectionFontSizes?: {
        name?: number;
        sectionTitle?: number;
        body?: number;
        sidebarTitle?: number;
        sidebarBody?: number;
        duration?: number;
      };
      sidebarWidthPx?: number;
    };
  };
};

export default function CreativeTemplate({ data }: Props) {
  const {
    name = "",
    title = "",
    photoUrl = "",
    contact = { phone: "", email: "", address: "", linkedin: "" },
    summary = "",
    experience = [],
    education = [],
    certifications = [],
    volunteer = [],
    skills = [],
    achivements = [],
    softSkills = [],
    languages = [],
  } = data;

  const layout = data._layout ?? {};
  const fs = layout.sectionFontSizes ?? {};
  const nameFont = fs.name ?? layout.nameFontSize ?? 36;
  const sectionTitleFont = fs.sectionTitle ?? 14;
  const bodyFont = fs.body ?? 12;
  const sidebarTitleFont = fs.sidebarTitle ?? 12;
  const sidebarBodyFont = fs.sidebarBody ?? 11;
  const durationFont = fs.duration ?? 10;

  const maxBullets = layout.maxBulletsPerExp ?? 4;
  const maxExperienceItems = layout.maxExperienceItems ?? 6;
  const maxEducationItems = layout.maxEducationItems ?? 6;
  const compact = !!layout.compactMode;
  const sidebarWidth = layout.sidebarWidthPx ?? 200;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const MIN_SCALE = 0.65;
  const INNER_WIDTH = 760;

  const fitToPage = () => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    content.style.transform = "scale(1)";
    content.style.transformOrigin = "top left";

    requestAnimationFrame(() => {
      const containerH = container.clientHeight;
      const containerW = container.clientWidth;
      const contentH = content.scrollHeight;
      const contentW = content.scrollWidth;

      const scaleH = containerH / contentH;
      const scaleW = (containerW - 28) / Math.max(contentW, INNER_WIDTH);
      let s = Math.min(1, scaleH, scaleW);
      if (s < MIN_SCALE) s = MIN_SCALE;
      setScale(s);
    });
  };

  useEffect(() => {
    fitToPage();
    const onResize = () => fitToPage();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [data, nameFont, sectionTitleFont, bodyFont, sidebarTitleFont, sidebarBodyFont, durationFont]);

  const sliceWithCount = <T,>(arr: T[] | undefined, limit: number) => {
    const a = Array.isArray(arr) ? arr : [];
    return {
      items: a.slice(0, limit),
      more: Math.max(0, a.length - limit),
      total: a.length,
    };
  };

  const expSlice = sliceWithCount(experience, maxExperienceItems);
  const eduSlice = sliceWithCount(education, maxEducationItems);

  const sectionSpacing = compact ? "mb-2" : "mb-4";
  const listSpacingClass = compact ? "space-y-1" : "space-y-2";
  const smallGap = compact ? "gap-3" : "gap-6";

  const truncate = (s: string, n = layout.truncateCharPerLine ?? 220) =>
    s && s.length > n ? s.slice(0, n - 1).trim() + "…" : s;

return (
  <div className="bg-gray-50 text-gray-900 font-sans py-16 px-6 md:px-12 lg:px-20 print:p-0 box-border max-w-6xl mx-auto">
    <div
      ref={containerRef}
      data-resume-container
      className="w-full bg-white rounded-2xl print:rounded-none border border-gray-200 print:border-0 p-30 md:p-16 lg:p-20 print:p-0"
      style={{ WebkitPrintColorAdjust: "exact" }}
    >
      <div
        ref={contentRef}
        className="w-full"
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {/* HEADER */}
        <div className={`flex items-start justify-between ${smallGap} mb-10`}>
          <div className="flex-1 pr-8 min-w-0">
            <h1
              className="font-extrabold leading-tight text-gray-900"
              style={{
                fontSize: `${nameFont}px`,
                lineHeight: 1.05,
                marginBottom: 12,
                wordBreak: "break-word",
              }}
            >
              {name || "Your Name"}
            </h1>

            {title && (
              <div
                className="font-medium text-gray-800 mb-4"
                style={{
                  fontSize: `${Math.max(10, Math.round(nameFont * 0.45))}px`,
                }}
              >
                {title}
              </div>
            )}

            <div
              style={{ fontSize: `${bodyFont}px` }}
              className="mt-3 text-gray-700 space-y-3"
            >
              {contact.email && <div>✉️ {contact.email}</div>}
              {contact.phone && <div>📞 {contact.phone}</div>}
              {contact.linkedin && (
                <div>
                  🔗{" "}
                  <a
                    href={contact.linkedin}
                    className="underline text-blue-700 break-words"
                  >
                    {contact.linkedin}
                  </a>
                </div>
              )}
              {contact.address && <div>📍 {contact.address}</div>}
            </div>
          </div>

          {/* Profile Image - Rectangle with slightly rounded corners */}
          <div
            className="rounded-xl overflow-hidden border-2 border-gray-300 flex-shrink-0"
            style={{ width: 200, height: 240, minWidth: 200 }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                Photo
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-300 my-8" />

        {/* SUMMARY */}
        {summary && (
          <section className="mb-10">
            <h2
              style={{ fontSize: `${sectionTitleFont}px` }}
              className="text-gray-900 font-semibold mb-4"
            >
              Summary
            </h2>
            <p
              style={{ fontSize: `${bodyFont}px`, lineHeight: 1.7 }}
              className="text-gray-800"
            >
              {truncate(summary, layout.truncateCharPerLine)}
            </p>
          </section>
        )}
     


          {/* MAIN LAYOUT */}
          <div className={`flex ${smallGap}`}>
            <div className="flex-1 min-w-0">
              {/* EXPERIENCE */}
              {expSlice.items.length > 0 && (
                <section className={sectionSpacing}>
                  <h2 style={{ fontSize: `${sectionTitleFont}px` }} className="text-gray-900 font-semibold mb-2">
                    Work Experience
                  </h2>
                  <div className="space-y-4">
                    {expSlice.items.map((exp, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold text-gray-900" style={{ fontSize: `${sectionTitleFont}px` }}>
                            {exp.role}
                          </h3>
                          <span className="text-gray-600 text-sm">{exp.duration}</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-1">{exp.company}</p>
                        <ul style={{ fontSize: `${bodyFont}px` }} className={`list-disc ml-5 ${listSpacingClass} text-gray-800`}>
                          {exp.description.slice(0, maxBullets).map((d, j) => (
                            <li key={j}>{truncate(d, layout.truncateCharPerLine)}</li>
                          ))}
                          {exp.description.length > maxBullets && (
                            <li className="text-xs text-gray-600">+{exp.description.length - maxBullets} more</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* EDUCATION */}
              {eduSlice.items.length > 0 && (
                <section className={sectionSpacing}>
                  <h2 style={{ fontSize: `${sectionTitleFont}px` }} className="text-gray-900 font-semibold mb-2">
                    Education
                  </h2>
                  <div className="space-y-3">
                    {eduSlice.items.map((edu, i) => (
                      <div key={i}>
                        <div className="flex justify-between">
                          <p className="font-semibold text-gray-900">{edu.degree}</p>
                          <span className="text-sm text-gray-600">{edu.year}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{edu.school}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* SIDEBAR */}
            <aside style={{ width: sidebarWidth }} className="flex-shrink-0">
              {skills && skills.length > 0 && (
                <section className="mb-4">
                  <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {skills.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 rounded">{s}</span>
                    ))}
                  </div>
                </section>
              )}

              {languages && languages.length > 0 && (
                <section className="mb-4">
                  <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                    Languages
                  </h3>
                  <p className="text-gray-800 text-sm">{languages.join(", ")}</p>
                </section>
              )}

              {certifications && certifications.length > 0 && (
                <section className="mb-4">
                  <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                    Certifications
                  </h3>
                  <ul className="text-gray-800 text-sm space-y-1">
                    {certifications.map((c, i) => (
                      <li key={i}>
                        {c.name} {c.year && <span className="text-gray-600">({c.year})</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
