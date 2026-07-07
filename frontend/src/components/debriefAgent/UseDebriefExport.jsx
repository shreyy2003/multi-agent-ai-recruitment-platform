import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function safeFilename(candidateName, jobTitle) {
  const clean = (s) => s.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `debrief_${clean(candidateName)}_${clean(jobTitle)}`;
}

// ── PDF Export ─────────────────────────────────────────────────────────────────

export function downloadDebriefPDF(result) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Colours
  const VIOLET = [124, 58, 237];
  const DARK   = [30, 30, 50];
  const GRAY   = [120, 120, 140];
  const WHITE  = [255, 255, 255];
  const GREEN  = [52, 211, 153];
  const RED    = [248, 113, 113];
  const YELLOW = [251, 191, 36];

  const REC_COLORS = {
    "Strong Hire": [52, 211, 153],
    "Hire":        [96, 165, 250],
    "Borderline":  [251, 191, 36],
    "No Hire":     [248, 113, 113],
  };

  // ── utility ──
  function checkPage(needed = 10) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function sectionHeader(title) {
    checkPage(14);
    doc.setFillColor(...VIOLET);
    doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(title.toUpperCase(), margin + 4, y + 5.5);
    y += 12;
    doc.setTextColor(...DARK);
  }

  function bodyText(text, color = DARK) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentW);
    lines.forEach((line) => {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5.5;
    });
    y += 2;
  }

  function bulletItem(text, color = DARK) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...VIOLET);
    doc.text("›", margin + 1, y);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentW - 8);
    lines.forEach((line, i) => {
      checkPage(6);
      doc.text(line, margin + 6, y);
      if (i < lines.length - 1) y += 5;
    });
    y += 6;
  }

  function subLabel(text) {
    checkPage(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(text.toUpperCase(), margin, y);
    y += 6;
  }

  function spacer(h = 4) { y += h; }

  // ── HEADER ──
  doc.setFillColor(...VIOLET);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text("Post-Interview Debrief", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `${result.candidate_name}  ·  ${result.job_title}  ·  ${formatDate()}`,
    margin, 20
  );

  y = 36;

  // ── META ROW ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text(`Interviewer: ${result.interviewer_name}`, margin, y);
  doc.text(
    `JD Match: ${result.jd_match.match_percentage}%`,
    pageW - margin,
    y,
    { align: "right" }
  );
  y += 3;
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── EXECUTIVE SUMMARY ──
  sectionHeader("Executive Summary");
  bodyText(result.executive_summary);
  spacer();

  // ── JD MATCH ──
  sectionHeader("JD Match Analysis");

  // Match % badge
  const recColor = REC_COLORS[result.final_recommendation] || VIOLET;
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, 50, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...VIOLET);
  doc.text(`${result.jd_match.match_percentage}%`, margin + 8, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("Overall JD Match", margin + 22, y + 5);
  const matchLabel =
    result.jd_match.match_percentage >= 75
      ? "Strong match"
      : result.jd_match.match_percentage >= 50
      ? "Moderate match"
      : "Weak match";
  doc.text(matchLabel, margin + 22, y + 10);
  y += 18;

  subLabel("Matched Requirements");
  result.jd_match.matched_requirements.forEach((r) => bulletItem(r, GREEN));
  spacer(2);

  subLabel("Key Gaps");
  result.jd_match.key_gaps.forEach((g) => bulletItem(g, RED));
  spacer();

  // ── STRENGTHS ──
  sectionHeader("Strengths");
  result.strengths.forEach((s) => bulletItem(s, [34, 197, 94]));
  spacer();

  // ── CONCERNS ──
  sectionHeader("Concerns / Risks");
  result.concerns.forEach((c) => bulletItem(c, YELLOW));
  spacer();

  // ── RESUME CONSISTENCY ──
  if (result.resume_uploaded && result.resume_consistency) {
    sectionHeader("Resume Consistency Check");

    subLabel("Confirmed Skills");
    result.resume_consistency.confirmed_skills.forEach((s) =>
      bulletItem(s, GREEN)
    );
    spacer(2);

    subLabel("Claims Needing Verification");
    result.resume_consistency.claims_needing_verification.forEach((c) =>
      bulletItem(c, YELLOW)
    );
    spacer();
  }

  // ── RECOMMENDATION ──
  sectionHeader("Final Recommendation");
  checkPage(20);

  doc.setFillColor(...(REC_COLORS[result.final_recommendation] || GRAY));
  doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(result.final_recommendation, margin + 4, y + 7);
  y += 16;

  bodyText(result.recommendation_justification);
  spacer();

  // ── FOLLOW-UP QUESTIONS ──
  sectionHeader("Suggested Follow-Up Questions");
  result.follow_up_questions.forEach((q, i) => {
    bulletItem(`${i + 1}. ${q}`);
  });

  // ── FOOTER on each page ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(
      `TJJ - The Jobs Jungle  ·  Confidential  ·  Page ${p} of ${totalPages}`,
      pageW / 2,
      pageH - 8,
      { align: "center" }
    );
  }

  doc.save(`${safeFilename(result.candidate_name, result.job_title)}.pdf`);
}

// ── DOCX Export ────────────────────────────────────────────────────────────────

export async function downloadDebriefDOCX(result) {

  function heading1(text) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 },
    });
  }

  function heading2(text) {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 80 },
    });
  }

  function body(text) {
    return new Paragraph({
      children: [new TextRun({ text, size: 22 })],
      spacing: { after: 80 },
    });
  }

  function bullet(text) {
    return new Paragraph({
      children: [new TextRun({ text: `› ${text}`, size: 22 })],
      indent: { left: 360 },
      spacing: { after: 60 },
    });
  }

  function spacer() {
    return new Paragraph({ text: "", spacing: { after: 120 } });
  }

  function label(text) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          size: 18,
          color: "888888",
        }),
      ],
      spacing: { before: 160, after: 60 },
    });
  }

  const children = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Post-Interview Debrief",
          bold: true,
          size: 36,
          color: "7C3AED",
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${result.candidate_name}  ·  ${result.job_title}  ·  ${formatDate()}`,
          size: 20,
          color: "888888",
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Interviewer: ${result.interviewer_name}   |   JD Match: ${result.jd_match.match_percentage}%`,
          size: 20,
          color: "888888",
        }),
      ],
      spacing: { after: 200 },
    }),
  );

  // Executive Summary
  children.push(heading1("Executive Summary"), body(result.executive_summary), spacer());

  // JD Match
  children.push(
    heading1("JD Match Analysis"),
    new Paragraph({
      children: [
        new TextRun({ text: `Overall Match: `, bold: true, size: 22 }),
        new TextRun({
          text: `${result.jd_match.match_percentage}%`,
          bold: true,
          size: 28,
          color: "7C3AED",
        }),
      ],
      spacing: { after: 120 },
    }),
    label("Matched Requirements"),
    ...result.jd_match.matched_requirements.map(bullet),
    label("Key Gaps"),
    ...result.jd_match.key_gaps.map(bullet),
    spacer(),
  );

  // Strengths
  children.push(
    heading1("Strengths"),
    ...result.strengths.map(bullet),
    spacer(),
  );

  // Concerns
  children.push(
    heading1("Concerns / Risks"),
    ...result.concerns.map(bullet),
    spacer(),
  );

  // Resume Consistency
  if (result.resume_uploaded && result.resume_consistency) {
    children.push(
      heading1("Resume Consistency Check"),
      label("Confirmed Skills"),
      ...result.resume_consistency.confirmed_skills.map(bullet),
      label("Claims Needing Verification"),
      ...result.resume_consistency.claims_needing_verification.map(bullet),
      spacer(),
    );
  }

  // Recommendation
  children.push(
    heading1("Final Recommendation"),
    new Paragraph({
      children: [
        new TextRun({
          text: result.final_recommendation,
          bold: true,
          size: 28,
          color: "7C3AED",
        }),
      ],
      spacing: { after: 100 },
    }),
    body(result.recommendation_justification),
    spacer(),
  );

  // Follow-Up Questions
  children.push(
    heading1("Suggested Follow-Up Questions"),
    ...result.follow_up_questions.map((q, i) => bullet(`${i + 1}. ${q}`)),
  );

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          run: { color: "7C3AED", bold: true, size: 26 },
          paragraph: {
            spacing: { before: 300, after: 100 },
            border: {
              bottom: {
                color: "7C3AED",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${safeFilename(result.candidate_name, result.job_title)}.docx`);
}