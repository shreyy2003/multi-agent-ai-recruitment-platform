import { useState } from "react";
import axios from "axios";
import {
  FileText, BarChart2, Zap, AlertTriangle, CheckSquare,
  ThumbsUp, HelpCircle, RefreshCw, Copy, Check, ChevronRight,
  Download, MinusCircle, XCircle, GitBranch, CheckCircle2, Loader2,
} from "lucide-react";

const TABS = [
  { key: "summary",    label: "Summary",      icon: FileText      },
  { key: "jd_match",  label: "JD Match",      icon: BarChart2     },
  { key: "strengths", label: "Strengths",      icon: Zap           },
  { key: "concerns",  label: "Concerns",       icon: AlertTriangle },
  { key: "resume",    label: "Resume Check",   icon: CheckSquare   },
  { key: "recommend", label: "Recommendation", icon: ThumbsUp      },
  { key: "followup",  label: "Follow-Up Qs",  icon: HelpCircle    },
];

const RECOMMENDATION_COLORS = {
  "Strong Hire": "text-green-400 bg-green-400/10 border-green-400/30",
  "Hire":        "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Borderline":  "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "No Hire":     "text-red-400 bg-red-400/10 border-red-400/30",
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm text-gray-300 transition-colors"
    >
      {copied ? <><Check className="w-4 h-4 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
    </button>
  );
}

function BulletList({ items, color = "text-gray-300", icon: Icon, iconColor }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          {Icon ? (
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
          ) : (
            <ChevronRight className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
          )}
          <span className={`text-sm ${color}`}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionLabel({ text }) {
  return (
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">{text}</p>
  );
}

function DownloadButtons({ result }) {
  const [downloading, setDownloading] = useState("");

  const handleDownload = async (format) => {
    setDownloading(format);
    try {
      const endpoint =
        format === "pdf"
          ? "http://localhost:8000/agent/debrief/export/pdf"
          : "http://localhost:8000/agent/debrief/export/docx";

      const res = await axios.post(
        endpoint,
        { report_data: result },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data]);
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute(
        "download",
        `debrief_${result.candidate_name.replace(/ /g, "_")}_${result.job_title.replace(/ /g, "_")}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report. Make sure the backend is running.");
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">Download:</span>
      <button
        onClick={() => handleDownload("pdf")}
        disabled={!!downloading}
        className="flex items-center gap-1.5 bg-gray-800 hover:bg-red-500/20 hover:border-red-500/40 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-red-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
      >
        {downloading === "pdf" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        PDF
      </button>
      <button
        onClick={() => handleDownload("docx")}
        disabled={!!downloading}
        className="flex items-center gap-1.5 bg-gray-800 hover:bg-blue-500/20 hover:border-blue-500/40 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-blue-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
      >
        {downloading === "docx" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        DOCX
      </button>
    </div>
  );
}

export default function DebriefResultsPanel({
  result, loading, handleReset,
  selectedCandId, onSaveToPipeline,
  saving, saved, saveError,
}) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!result && !loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[600px]">
        <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Debrief summary will appear here
        </h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Upload the transcript, JD, and optionally the resume — then
          generate the debrief. Results are split into clear sections.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[600px]">
        <RefreshCw className="w-10 h-10 text-violet-400 animate-spin mb-4" />
        <p className="text-gray-300 font-medium">Analysing interview documents...</p>
        <p className="text-gray-500 text-sm mt-2">
          Evaluating against JD{result?.resume_uploaded ? ", resume," : ""} and transcript
        </p>
      </div>
    );
  }

  const visibleTabs = result.resume_uploaded
    ? TABS
    : TABS.filter((t) => t.key !== "resume");

  return (
    <div className="space-y-4">

      {/* TAB BAR */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-2 flex gap-1 overflow-x-auto">
        {visibleTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === key ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ACTION BAR */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl px-5 py-3 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">{result.candidate_name}</span>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-violet-400 font-semibold">{result.jd_match.match_percentage}% match</span>
            <span className="text-gray-700">·</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${
              RECOMMENDATION_COLORS[result.final_recommendation] || "text-gray-300 border-gray-700"
            }`}>
              {result.final_recommendation}
            </span>
          </div>
          <DownloadButtons result={result} />
        </div>

        {/* Save to Pipeline row */}
        <div className="border-t border-gray-800 pt-3 flex items-center justify-between gap-3">
          {saved ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Debrief saved to pipeline — candidate status updated to Interviewed
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                {selectedCandId
                  ? "Save this debrief to the candidate's pipeline record"
                  : "Select a candidate from the pipeline dropdown to save debrief"
                }
              </p>
              <button
                onClick={onSaveToPipeline}
                disabled={!selectedCandId || saving}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                  selectedCandId
                    ? "bg-violet-600 hover:bg-violet-500 text-white"
                    : "bg-gray-800 text-gray-600 cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />Saving...</>
                ) : (
                  <><GitBranch className="w-3 h-3" />Save to Pipeline</>
                )}
              </button>
            </>
          )}
        </div>
        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
      </div>

      {/* SUMMARY */}
      {activeTab === "summary" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold text-white">Executive Summary</h3>
            </div>
            <CopyButton text={result.executive_summary} />
          </div>
          <div className="bg-[#0B1120] rounded-xl p-4 text-gray-300 text-sm leading-relaxed">
            {result.executive_summary}
          </div>
        </div>
      )}

      {activeTab === "jd_match" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">JD Match Analysis</h3>
          </div>
          <div className="bg-[#0B1120] rounded-xl p-5 flex items-center gap-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3"
                  strokeDasharray={`${result.jd_match.match_percentage} ${100 - result.jd_match.match_percentage}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{result.jd_match.match_percentage}%</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Overall JD Match</p>
              <p className="text-white font-semibold mt-1">
                {result.jd_match.match_percentage >= 85 ? "Strong Hire range"
                  : result.jd_match.match_percentage >= 70 ? "Hire range"
                  : result.jd_match.match_percentage >= 50 ? "Borderline range"
                  : "No Hire range"}
              </p>
            </div>
          </div>
          {result.jd_match.matched_requirements?.length > 0 && (
            <div>
              <SectionLabel text="Fully Met Requirements" />
              <div className="bg-[#0B1120] rounded-xl p-4">
                <BulletList items={result.jd_match.matched_requirements} color="text-green-300" />
              </div>
            </div>
          )}
          {result.jd_match.partial_matches?.length > 0 && (
            <div>
              <SectionLabel text="Partially Met" />
              <div className="bg-[#0B1120] rounded-xl p-4">
                <BulletList items={result.jd_match.partial_matches} color="text-yellow-300" icon={MinusCircle} iconColor="text-yellow-500" />
              </div>
            </div>
          )}
          {result.jd_match.missing_requirements?.length > 0 && (
            <div>
              <SectionLabel text="Missing Requirements" />
              <div className="bg-[#0B1120] rounded-xl p-4">
                <BulletList items={result.jd_match.missing_requirements} color="text-red-300" icon={XCircle} iconColor="text-red-500" />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "strengths" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold text-white">Strengths</h3>
            </div>
            <CopyButton text={result.strengths.join("\n")} />
          </div>
          <div className="bg-[#0B1120] rounded-xl p-4 space-y-3">
            <BulletList items={result.strengths} color="text-green-300" />
          </div>
        </div>
      )}

      {activeTab === "concerns" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold text-white">Concerns / Risks</h3>
            </div>
            <CopyButton text={result.concerns.join("\n")} />
          </div>
          <div className="bg-[#0B1120] rounded-xl p-4 space-y-3">
            <BulletList items={result.concerns} color="text-yellow-300" />
          </div>
        </div>
      )}

      {activeTab === "resume" && result.resume_consistency && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">Resume Consistency Check</h3>
          </div>
          {result.resume_consistency.confirmed_skills?.length > 0 && (
            <div>
              <SectionLabel text="Confirmed in Both Resume & Interview" />
              <div className="bg-[#0B1120] rounded-xl p-4">
                <BulletList items={result.resume_consistency.confirmed_skills} color="text-green-300" />
              </div>
            </div>
          )}
          {result.resume_consistency.interview_claims_missing_from_resume?.length > 0 && (
            <div>
              <SectionLabel text="Claimed in Interview — Not on Resume" />
              <div className="bg-[#0B1120] rounded-xl p-4">
                <BulletList items={result.resume_consistency.interview_claims_missing_from_resume} color="text-yellow-300" icon={MinusCircle} iconColor="text-yellow-500" />
              </div>
            </div>
          )}
          {result.resume_consistency.resume_skills_not_discussed?.length > 0 && (
            <div>
              <SectionLabel text="On Resume — Not Discussed in Interview" />
              <div className="bg-[#0B1120] rounded-xl p-4">
                <BulletList items={result.resume_consistency.resume_skills_not_discussed} color="text-gray-400" />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "recommend" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">Final Recommendation</h3>
          </div>
          <div className={`inline-flex items-center gap-2 border px-5 py-3 rounded-xl font-bold text-lg ${
            RECOMMENDATION_COLORS[result.final_recommendation] || "text-gray-300 bg-gray-800 border-gray-700"
          }`}>
            {result.final_recommendation}
          </div>
          <div className="bg-[#0B1120] rounded-xl p-4 text-gray-300 text-sm leading-relaxed">
            {result.recommendation_justification}
          </div>
        </div>
      )}

      {activeTab === "followup" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold text-white">Suggested Follow-Up Questions</h3>
            </div>
            <CopyButton text={result.follow_up_questions.join("\n")} />
          </div>
          <div className="bg-[#0B1120] rounded-xl p-4 space-y-3">
            {result.follow_up_questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-gray-300 text-sm">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-5 text-sm">
          <span className="text-gray-500">
            Role: <span className="text-violet-400 font-medium">{result.job_title}</span>
          </span>
          <span className="text-gray-500">
            Tokens: <span className="text-white font-medium">{result.tokens_used}</span>
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          New Debrief
        </button>
      </div>

    </div>
  );
}