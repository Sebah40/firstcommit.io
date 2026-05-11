# TAILORING_RULES — read before tailoring a resume

These rules apply when an agent calls `firstcommit_tailor_resume`. The tool itself does NOT run an LLM — the **calling agent** rewrites the resume. Read this file first, then craft the `resume_data` payload.

Your job is to rewrite the resume so it reads naturally for the target role, NOT to stuff it with keywords from the posting. A recruiter reading 50 resumes a day can spot a tailored-by-AI resume in 5 seconds. Your output must pass as something the candidate wrote themselves with that role in mind.

## Hard rules

1. **Never copy phrases verbatim from the job posting.** If the posting says "asegurar la correcta implementación de políticas de Data Governance", you do NOT write that. Translate the underlying concept into the candidate's own voice using their actual experience (e.g., "defined KPI integrity rules anchored to invoice dates").
2. **Every claim must map to a real fact in the source resume.** You are reframing, not fabricating. If the posting requires a skill the candidate doesn't have, do not invent it. List adjacent/transferable skills honestly or omit.
3. **Keyword density check.** Count distinct phrases of 3+ words from the job posting that appear verbatim or near-verbatim in your output. Target: zero. Hard ceiling: two, only for unavoidable technical terms (tool names, certifications).
4. **Vocabulary substitution, not insertion.** When the source resume uses engineering vocabulary ("built", "integrated", "deployed") and the target role expects analyst vocabulary ("analyzed", "modeled", "delivered insights to stakeholders"), substitute — don't just append. Total bullet length should stay roughly the same.
5. **Preserve the candidate's voice.** Read the source resume and identify their writing patterns: bullet length, use of arrows/symbols, sentence structure, level of formality, language (English, Spanish, mixed). Match those patterns. A resume that suddenly switches to corporate-speak is a tell.
6. **No buzzword density spikes.** If the source mentions "stakeholders" zero times, don't put it in three bullets. Add it once, naturally, where it actually applies.
7. **Keep the differentiators.** If the candidate has unique experience the posting doesn't ask for (e.g., AI/MCP work for a data analyst role), do not strip it — reposition it as a differentiator at the bottom of the summary or skills, not the top. Recruiters value candidates who exceed the spec; they distrust candidates who match it too perfectly.
8. **Don't reorder experience chronologically-illogically.** Keep reverse-chronological order. Don't promote a 2-month freelance gig to the top because it matches the posting better.
9. **Headlines: hybrid, not literal.** Do not change the headline to the exact job title from the posting. Use a hybrid framing that's true to the candidate ("BI & Data Analyst with automation focus", not "Data Analyst" when the candidate's background is broader).
10. **Quantify only what's quantifiable from source.** Do not invent metrics. If the source says "adopted across every department", you can say "adopted by 4 departments" only if that count is verifiable from the source. Otherwise keep the qualitative phrasing.

## Self-check before returning

- Could the candidate confidently defend every line of this resume in a 30-minute interview? If no, revise.
- Does this resume read like the candidate happens to be a great fit, or like the candidate retrofitted themselves to the posting? Aim for the former.
- Diff against the source. If more than ~40% of the content is rewritten, you're probably overfitting. Pull back.
