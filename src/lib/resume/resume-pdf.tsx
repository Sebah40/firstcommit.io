import { Document, Page, Text, View, StyleSheet, Font, Link } from "@react-pdf/renderer";
import path from "path";
import type { ResumeData } from "@/types";

Font.register({
  family: "Outfit",
  fonts: [
    { src: path.join(process.cwd(), "node_modules/@fontsource/outfit/files/outfit-latin-400-normal.woff"), fontWeight: 400 },
    { src: path.join(process.cwd(), "node_modules/@fontsource/outfit/files/outfit-latin-500-normal.woff"), fontWeight: 500 },
    { src: path.join(process.cwd(), "node_modules/@fontsource/outfit/files/outfit-latin-700-normal.woff"), fontWeight: 700 },
  ],
});

// Night Owl palette
const OWL = {
  bg: "#011627",
  fg: "#a8b2d8",
  name: "#d6deeb",
  label: "#7fdbca",
  contact: "#4d7f8f",
  company: "#82aaff",
  date: "#637777",
  section: "#c792ea",
  divider: "#0d2436",
  bullet: "#7fdbca",
  tagBg: "#01223a",
  tagBorder: "#1e3a4a",
  italic: "#4d7f8f",
};

const SKILL_COLORS = ["#ecc48d", "#ffcb8b", "#7fdbca", "#c792ea"];

function fmtDate(d?: string | null): string {
  if (!d) return "";
  if (d.length === 4) return d;
  const [year, month] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return month ? `${months[parseInt(month) - 1]} ${year}` : year;
}

function dateRange(start?: string, end?: string): string {
  const s = fmtDate(start);
  const e = end ? fmtDate(end) : "Present";
  if (!s && !e) return "";
  return `${s}${s ? " — " : ""}${e}`;
}

const s = StyleSheet.create({
  page: {
    backgroundColor: OWL.bg,
    fontFamily: "Outfit",
    fontSize: 9.5,
    color: OWL.fg,
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 32,
    paddingRight: 32,
  },
  header: { marginBottom: 8 },
  name: {
    fontSize: 22,
    fontFamily: "Outfit", fontWeight: 700,
    color: OWL.name,
    marginBottom: 3,
  },
  label: { fontSize: 11, color: OWL.label, marginBottom: 4 },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    color: OWL.contact,
    fontSize: 8.5,
    marginBottom: 5,
  },
  contactUrl: { color: OWL.company },
  summary: { fontSize: 8.5, color: OWL.fg, lineHeight: 1.5 },
  section: { marginBottom: 9 },
  sectionTitleRow: {
    borderBottomWidth: 1,
    borderBottomColor: OWL.divider,
    paddingBottom: 3,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: "Outfit", fontWeight: 700,
    color: OWL.section,
  },
  entry: { marginBottom: 5 },
  entryRow: { flexDirection: "row", justifyContent: "space-between" },
  entryLeft: { flexDirection: "row", flexWrap: "wrap", flex: 1, gap: 4 },
  position: { fontFamily: "Outfit", fontWeight: 700, color: OWL.name, fontSize: 9 },
  company: { color: OWL.company, fontSize: 10, fontFamily: "Outfit", fontWeight: 700 },
  dateText: { color: OWL.date, fontSize: 8 },
  jobSummary: {
    color: OWL.italic,
    fontSize: 8,
    fontFamily: "Outfit", fontWeight: 400,
    marginTop: 1,
    marginBottom: 2,
  },
  bulletRow: { flexDirection: "row", marginBottom: 1.5 },
  bulletMark: { color: OWL.bullet, fontSize: 9, width: 11 },
  bulletText: { color: OWL.fg, fontSize: 8.5, flex: 1, lineHeight: 1.4 },
  skillRow: { flexDirection: "row", marginBottom: 3.5, alignItems: "flex-start" },
  skillName: {
    color: OWL.date,
    fontSize: 8,
    fontFamily: "Outfit", fontWeight: 700,
    width: 64,
    paddingTop: 1,
  },
  tagGroup: { flexDirection: "row", flexWrap: "wrap", flex: 1, gap: 3 },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  langPair: { flexDirection: "row", gap: 4 },
  langName: { fontFamily: "Outfit", fontWeight: 700, color: OWL.name, fontSize: 9 },
  langFluency: { color: OWL.date, fontSize: 9 },
});

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={s.sectionTitleRow}>
      <Text style={s.sectionTitle}>{children.toUpperCase()}</Text>
    </View>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={{
      backgroundColor: OWL.tagBg,
      borderWidth: 0.5,
      borderColor: OWL.tagBorder,
      borderRadius: 2,
      paddingHorizontal: 4,
      paddingVertical: 1.5,
    }}>
      <Text style={{ color, fontSize: 7.5 }}>{label}</Text>
    </View>
  );
}

export function ResumePdf({ data }: { data: ResumeData }) {
  const {
    basics,
    work = [],
    projects,
    skills = [],
    education = [],
    languages,
    certifications,
    custom_sections,
  } = data;

  const location = [basics.location?.city, basics.location?.region, basics.location?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.name}>{basics.name}</Text>
          {basics.label && <Text style={s.label}>{basics.label}</Text>}
          <View style={s.contactRow}>
            {basics.email && <Text>{basics.email}</Text>}
            {basics.phone && <Text>{basics.phone}</Text>}
            {location && <Text>{location}</Text>}
            {basics.url && (
              <Text style={s.contactUrl}>
                {basics.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </Text>
            )}
          </View>
          {basics.summary && <Text style={s.summary}>{basics.summary}</Text>}
        </View>

        {/* Experience */}
        {work.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Experience</SectionTitle>
            {work.map((job, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryRow}>
                  <View style={s.entryLeft}>
                    <Text style={s.position}>{job.position}</Text>
                    <Text style={s.company}>{job.company}</Text>
                  </View>
                  <Text style={s.dateText}>{dateRange(job.startDate, job.endDate)}</Text>
                </View>
                {job.highlights?.map((h, j) => (
                  <View key={j} style={s.bulletRow}>
                    <Text style={s.bulletMark}>›</Text>
                    <Text style={s.bulletText}>{h}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Projects</SectionTitle>
            {projects.map((proj, i) => {
              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firstcommit.io";
              const projUrl = proj.url || (proj.guide_id ? `${siteUrl}/guide/${proj.guide_id}` : null);
              return (
              <View key={i} style={s.entry}>
                <View style={s.entryRow}>
                  <Text style={s.position}>{proj.name}</Text>
                  {(proj.startDate || proj.endDate) && (
                    <Text style={s.dateText}>{dateRange(proj.startDate, proj.endDate)}</Text>
                  )}
                </View>
                {projUrl && (
                  <Link src={projUrl} style={{ fontSize: 7.5, color: OWL.company, marginBottom: 2 }}>
                    {projUrl.replace(/^https?:\/\//, "")}
                  </Link>
                )}
                {proj.techs && proj.techs.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 2, marginBottom: 2 }}>
                    {proj.techs.map((t, ti) => <Tag key={ti} label={t} color="#ecc48d" />)}
                  </View>
                )}
                {proj.description && <Text style={s.jobSummary}>{proj.description}</Text>}
                {proj.highlights?.map((h, j) => (
                  <View key={j} style={s.bulletRow}>
                    <Text style={s.bulletMark}>›</Text>
                    <Text style={s.bulletText}>{h}</Text>
                  </View>
                ))}
              </View>
              );
            })}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Skills</SectionTitle>
            {skills.map((cat, i) => (
              <View key={i} style={s.skillRow}>
                <Text style={s.skillName}>{cat.name}</Text>
                <View style={s.tagGroup}>
                  {cat.keywords.map((kw, ki) => (
                    <Tag key={ki} label={kw} color={SKILL_COLORS[i % SKILL_COLORS.length]} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Education</SectionTitle>
            {education.map((edu, i) => (
              <View key={i} style={{ ...s.entryRow, marginBottom: 4 }}>
                <View style={s.entryLeft}>
                  <Text style={s.position}>{edu.institution}</Text>
                  <Text style={{ color: OWL.contact, fontSize: 9 }}>
                    {[edu.studyType, edu.area].filter(Boolean).join(" in ")}
                  </Text>
                </View>
                <Text style={s.dateText}>{dateRange(edu.startDate, edu.endDate)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Certifications</SectionTitle>
            {certifications.map((cert, i) => (
              <View key={i} style={{ ...s.entryRow, marginBottom: 4 }}>
                <View style={s.entryLeft}>
                  <Text style={s.position}>{cert.name}</Text>
                  {cert.issuer && <Text style={{ color: OWL.contact, fontSize: 9 }}>{cert.issuer}</Text>}
                </View>
                {cert.date && <Text style={s.dateText}>{fmtDate(cert.date)}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={s.section}>
            <SectionTitle>Languages</SectionTitle>
            <View style={s.langRow}>
              {languages.map((lang, i) => (
                <View key={i} style={s.langPair}>
                  <Text style={s.langName}>{lang.language}</Text>
                  {lang.fluency && <Text style={s.langFluency}>— {lang.fluency}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Custom sections */}
        {custom_sections?.map((sec, i) => (
          <View key={i} style={s.section}>
            <SectionTitle>{sec.title}</SectionTitle>
            {sec.items.map((item, j) => (
              <View key={j} style={s.bulletRow}>
                <Text style={s.bulletMark}>›</Text>
                <Text style={s.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

      </Page>
    </Document>
  );
}
