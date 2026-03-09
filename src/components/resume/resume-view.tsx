"use client";

import { Printer, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ResumeData } from "@/types";

interface ResumeViewProps {
  resumeData: ResumeData;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  cvUrl: string | null;
  updatedAt: string | null;
}

function formatDate(d?: string | null): string {
  if (!d) return "";
  if (d.length === 4) return d;
  const [year, month] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return month ? `${months[parseInt(month) - 1]} ${year}` : year;
}

function DateRange({ start, end }: { start?: string; end?: string }) {
  if (!start && !end) return null;
  return (
    <span className="text-sm text-neutral-500">
      {formatDate(start)}{start && " — "}{end ? formatDate(end) : "Present"}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wider text-neutral-900 print:border-neutral-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ResumeView({ resumeData, username, displayName, avatarUrl, cvUrl, updatedAt }: ResumeViewProps) {
  const { basics, education, work, skills, projects, certifications, languages, custom_sections } = resumeData;

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 min-h-screen bg-neutral-100 print:bg-white">
      {/* Toolbar — hidden in print */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background print:hidden sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${username}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            {displayName || username}
          </Link>
          <span className="text-sm text-muted-foreground/40">/</span>
          <span className="text-sm font-medium text-foreground">Resume</span>
        </div>
        <div className="flex items-center gap-2">
          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download size={12} />
              Original PDF
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            <Printer size={12} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Resume paper */}
      <div className="mx-auto my-8 max-w-[8.5in] bg-white shadow-lg print:shadow-none print:my-0">
        <div className="px-12 py-10 print:px-8 print:py-6 font-serif text-neutral-800 leading-relaxed text-[15px]">

          {/* Header */}
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {basics.name}
            </h1>
            {basics.label && (
              <p className="mt-0.5 text-base text-neutral-600">{basics.label}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-neutral-500">
              {basics.email && <span>{basics.email}</span>}
              {basics.phone && <span>{basics.phone}</span>}
              {basics.location?.city && (
                <span>
                  {basics.location.city}
                  {basics.location.region ? `, ${basics.location.region}` : ""}
                  {basics.location.country ? `, ${basics.location.country}` : ""}
                </span>
              )}
              {basics.url && (
                <a href={basics.url} className="text-neutral-600 underline" target="_blank" rel="noopener noreferrer">
                  {basics.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          </header>

          {/* Summary */}
          {basics.summary && (
            <Section title="Summary">
              <p className="text-sm leading-relaxed text-neutral-700">{basics.summary}</p>
            </Section>
          )}

          {/* Work Experience */}
          {work.length > 0 && (
            <Section title="Experience">
              <div className="space-y-4">
                {work.map((job, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="font-semibold text-neutral-900">{job.position}</span>
                        <span className="text-neutral-500">{" — "}{job.company}</span>
                      </div>
                      <DateRange start={job.startDate} end={job.endDate} />
                    </div>
                    {job.summary && (
                      <p className="mt-1 text-sm text-neutral-600">{job.summary}</p>
                    )}
                    {job.highlights && job.highlights.length > 0 && (
                      <ul className="mt-1.5 list-disc pl-5 text-sm text-neutral-700 space-y-0.5">
                        {job.highlights.map((h, j) => (
                          <li key={j}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <Section title="Projects">
              <div className="space-y-4">
                {projects.map((proj, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="font-semibold text-neutral-900">
                          {proj.guide_id ? (
                            <a
                              href={`/guide/${proj.guide_id}`}
                              className="underline decoration-neutral-300 hover:decoration-neutral-500 transition-colors"
                            >
                              {proj.name}
                            </a>
                          ) : (
                            proj.name
                          )}
                        </span>
                        {proj.techs && proj.techs.length > 0 && (
                          <span className="ml-2 text-xs text-neutral-500">
                            {proj.techs.join(", ")}
                          </span>
                        )}
                      </div>
                      <DateRange start={proj.startDate} end={proj.endDate} />
                    </div>
                    {proj.description && (
                      <p className="mt-0.5 text-sm text-neutral-600">{proj.description}</p>
                    )}
                    {proj.highlights && proj.highlights.length > 0 && (
                      <ul className="mt-1.5 list-disc pl-5 text-sm text-neutral-700 space-y-0.5">
                        {proj.highlights.map((h, j) => (
                          <li key={j}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <Section title="Education">
              <div className="space-y-3">
                {education.map((edu, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="font-semibold text-neutral-900">{edu.institution}</span>
                        <span className="text-neutral-500">
                          {" — "}{edu.studyType ? `${edu.studyType} in ` : ""}{edu.area}
                        </span>
                      </div>
                      <DateRange start={edu.startDate} end={edu.endDate} />
                    </div>
                    {edu.gpa && (
                      <p className="text-sm text-neutral-600">GPA: {edu.gpa}</p>
                    )}
                    {edu.honors && edu.honors.length > 0 && (
                      <p className="text-sm text-neutral-600">{edu.honors.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <Section title="Skills">
              <div className="space-y-1.5">
                {skills.map((cat, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold text-neutral-900">{cat.name}:</span>{" "}
                    <span className="text-neutral-700">{cat.keywords.join(", ")}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <Section title="Certifications">
              <div className="space-y-1.5">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex items-baseline justify-between text-sm">
                    <div>
                      <span className="font-semibold text-neutral-900">{cert.name}</span>
                      {cert.issuer && <span className="text-neutral-500">{" — "}{cert.issuer}</span>}
                    </div>
                    {cert.date && <span className="text-neutral-500">{formatDate(cert.date)}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <Section title="Languages">
              <p className="text-sm text-neutral-700">
                {languages.map((l) => `${l.language}${l.fluency ? ` (${l.fluency})` : ""}`).join(", ")}
              </p>
            </Section>
          )}

          {/* Custom Sections */}
          {custom_sections && custom_sections.map((sec, i) => (
            <Section key={i} title={sec.title}>
              <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-0.5">
                {sec.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </Section>
          ))}

          {/* Footer */}
          {updatedAt && (
            <footer className="mt-8 pt-4 border-t border-neutral-200 text-center text-xs text-neutral-400 print:mt-4">
              Last updated {new Date(updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              {" — "}
              <a href={`https://firstcommit.io/resume/${username}`} className="underline">
                firstcommit.io/resume/{username}
              </a>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
