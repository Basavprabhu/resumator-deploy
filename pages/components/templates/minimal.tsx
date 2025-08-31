// pages/components/templates/minimal.tsx
import React, { useEffect, useRef, useState } from "react";
import { ResumeData } from "../../../types/resume";

type ExpItem = {
  role?: string;
  company?: string;
  location?: string;
  duration?: string;
  description?: string[] | string;
};

type EduItem = {
  degree?: string;
  school?: string;
  year?: string;
  details?: string;
};

type Publication = {
  title?: string;
  authors?: string;
  outlet?: string;
  date?: string;
  url?: string;
};

type Props = {
  data: ResumeData & {
    _layout?: {
      nameFontSize?: number;
      sectionFontSizes?: {
        name?: number;
        sectionTitle?: number;
        body?: number;
        duration?: number;
      };
      truncateCharPerLine?: number;
    };
  };
};

export default function MinimalTemplate({ data }: Props) {
  const {
    name = "John Doe",
    title = "",
    photoUrl = "",
    contact = { phone: "", email: "", address: "", linkedin: "" },
    summary = "",
    experience = [] as ExpItem[],
    education = [] as EduItem[],
    publications = [] as Publication[],
    achievements = [] as string[],
    dateUpdated,
  } = (data as any);

  const layout = data._layout ?? {};
  const fs = layout.sectionFontSizes ?? {};
  const nameFont = fs.name ?? layout.nameFontSize ?? 36;
  const sectionTitleFont = fs.sectionTitle ?? 14;
  const bodyFont = fs.body ?? 12;
  const durationFont = fs.duration ?? 10;
  const truncateChars = layout.truncateCharPerLine ?? 300;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const MIN_SCALE = 0.64;
  const INNER_WIDTH = 760;

  useEffect(() => {
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

    fitToPage();
    window.addEventListener("resize", fitToPage);
    return () => window.removeEventListener("resize", fitToPage);
  }, [data, nameFont, sectionTitleFont, bodyFont, durationFont]);

  const truncate = (s = "", n = truncateChars) =>
    s && s.length > n ? s.slice(0, n - 1).trim() + "…" : s;
  const safeArr = <T,>(a: any): T[] => (Array.isArray(a) ? a : []);

  return (
    <div className="py-8">
      <div
        ref={containerRef}
        className="relative max-w-3xl mx-auto p-8 print:p-4 box-border"
        style={{ WebkitPrintColorAdjust: "exact" }}
      >
        {dateUpdated && (
          <div className="absolute right-4 top-3 text-xs text-gray-500 print:hidden">
            Last updated: {dateUpdated}
          </div>
        )}

        <div
          ref={contentRef}
          className="w-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* HEADER with photo */}
          <header className="relative mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1
                  className="font-extrabold text-gray-900"
                  style={{ fontSize: `${nameFont}px`, lineHeight: 1.02 }}
                >
                  {name}
                </h1>
                {title && (
                  <h2 className="text-gray-700 mt-1">{title}</h2>
                )}

                <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center gap-2">
                  {contact.address && (
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden>📍</span>
                      <span>{contact.address}</span>
                    </span>
                  )}

                  {contact.email && (
                    <>
                      <span className="mx-1 text-gray-300">|</span>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden>✉️</span>
                        <span>{contact.email}</span>
                      </span>
                    </>
                  )}

                  {contact.phone && (
                    <>
                      <span className="mx-1 text-gray-300">|</span>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden>📞</span>
                        <span>{contact.phone}</span>
                      </span>
                    </>
                  )}

                  {contact.linkedin && (
                    <>
                      <span className="mx-1 text-gray-300">|</span>
                      <a
                        className="inline-flex items-center gap-2 text-blue-700 underline"
                        href={contact.linkedin}
                      >
                        <span aria-hidden>🔗</span>
                        <span>
                          {contact.linkedin.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Large rectangular photo */}
              <div className="w-40 h-48 ml-6 flex-shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                    Photo
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* SUMMARY */}
          {summary && (
            <section className="mb-6">
              <p
                className="text-gray-800"
                style={{ fontSize: `${bodyFont}px`, lineHeight: 1.45 }}
              >
                {truncate(summary)}
              </p>
            </section>
          )}

          {/* EDUCATION */}
          {safeArr<EduItem>(education).length > 0 && (
            <section className="mb-6">
              <h2
                className="text-gray-900 font-semibold mb-2"
                style={{ fontSize: `${sectionTitleFont}px` }}
              >
                EDUCATION
              </h2>
              <div
                className="space-y-3 text-gray-800"
                style={{ fontSize: `${bodyFont}px` }}
              >
                {safeArr<EduItem>(education).map((edu, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {edu.degree}
                        </div>
                        <div className="text-sm text-gray-700">
                          {edu.school}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">{edu.year}</div>
                    </div>
                    {edu.details && (
                      <div className="text-sm text-gray-700 mt-1">
                        {truncate(edu.details, 220)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* EXPERIENCE */}
          {safeArr<ExpItem>(experience).length > 0 && (
            <section className="mb-6">
              <h2
                className="text-gray-900 font-semibold mb-3"
                style={{ fontSize: `${sectionTitleFont}px` }}
              >
                EXPERIENCE
              </h2>
              <div className="space-y-5">
                {safeArr<ExpItem>(experience).map((exp, idx) => {
                  const descArr = Array.isArray(exp.description)
                    ? exp.description
                    : typeof exp.description === "string"
                    ? [exp.description]
                    : [];
                  return (
                    <div key={idx}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {exp.role}
                          </div>
                          <div className="text-sm text-gray-700">
                            {exp.company}
                          </div>
                          {descArr.length > 0 && (
                            <ul
                              className="list-disc ml-5 mt-2 text-gray-800"
                              style={{
                                fontSize: `${bodyFont}px`,
                                lineHeight: 1.45,
                              }}
                            >
                              {descArr.map((d, j) => (
                                <li key={j}>{truncate(d, 240)}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div
                          className="text-xs text-gray-600 text-right"
                          style={{
                            fontSize: `${durationFont}px`,
                            minWidth: 110,
                          }}
                        >
                          <div>{exp.location}</div>
                          <div>{exp.duration}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* PUBLICATIONS */}
          {safeArr<Publication>(publications).length > 0 && (
            <section className="mb-6">
              <h2
                className="text-gray-900 font-semibold mb-2"
                style={{ fontSize: `${sectionTitleFont}px` }}
              >
                PUBLICATIONS
              </h2>
              <div
                className="space-y-3 text-gray-800"
                style={{ fontSize: `${bodyFont}px` }}
              >
                {safeArr<Publication>(publications).map((p, i) => (
                  <div key={i}>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-gray-600">
                      {p.authors} • {p.outlet}{" "}
                      {p.date ? `• ${p.date}` : ""}
                    </div>
                    {p.url && (
                      <a
                        className="text-xs text-blue-700 underline break-words"
                        href={p.url}
                      >
                        {p.url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ACHIEVEMENTS */}
          {safeArr<string>(achievements).length > 0 && (
            <section className="mb-6">
              <h3
                className="text-gray-900 font-semibold mb-2"
                style={{ fontSize: `${sectionTitleFont}px` }}
              >
                ACHIEVEMENTS
              </h3>
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
        </div>
      </div>
    </div>
  );
}
