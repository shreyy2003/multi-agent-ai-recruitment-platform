import {
  ClipboardList,
  MessageSquare,
  Download,
  GitBranch,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
  HiringContextCard,
  AutoRejectCard,
  JDQualityCard,
  ScorecardCard,
} from "./Cards";

import {
  Section,
  ListSection,
} from "./SharedSections";

const DOMAINS = [
  { value: "engineering", label: "Engineering" },
  { value: "product_management", label: "Product Management" },
  { value: "data_ai", label: "Data & AI" },
  { value: "quality_assurance", label: "Quality Assurance" },
  { value: "devops_cloud", label: "DevOps & Cloud" },
  { value: "business_gtm", label: "Business & GTM" },
];

function ResultsPanel({
  response,
  downloadFormat,
  setDownloadFormat,
  handleDownload,
  handleSaveToPipeline,
  saving,
  savedJobId,
  saveError,
  selectedDomain,
  setSelectedDomain,
}) {

  return (
    <div className="lg:col-span-2 space-y-6">

      {!response && (
        <div className="bg-[#111827] border border-gray-800 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[500px] text-center">
          <ClipboardList className="w-20 h-20 text-gray-600 mb-6" />
          <h2 className="text-3xl font-bold text-white">
            Intake Documents Will Appear Here
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl text-lg leading-relaxed">
            Upload a job description and let the AI agent generate structured
            intake documents, screening questions, and evaluation scorecards.
          </p>
        </div>
      )}

      {response && (
        <>
          {/* Header bar */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl p-6 shadow-lg">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Intake Documents Generated
                </h2>
                <p className="text-cyan-100 mt-1 text-sm">
                  Save to pipeline after selecting the domain to auto-fill candidate details in Stages 2–6,
                  or download directly without saving.
                </p>
              </div>

              <div className="flex items-center gap-3">

                {/* Download */}
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="bg-white text-black p-2 rounded-2xl font-medium"
                >
                  <option value="docx">DOCX</option>
                  <option value="pdf">PDF</option>
                </select>

                <button
                  onClick={handleDownload}
                  className="bg-white text-black p-2 rounded-2xl font-semibold flex items-center gap-2 hover:bg-gray-200 transition"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>

                {/* Tokens */}
                <div className="bg-white/10 rounded-xl px-2 py-2 text-center">
                  <p className="text-xs text-cyan-100">Tokens Used</p>
                  <p className="text-lg font-bold text-white">
                    {response.tokens_used}
                  </p>
                </div>

                {/* Saved confirmation */}
                {savedJobId && (
                  <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved to Pipeline
                  </div>
                )}

              </div>
            </div>

            {/* Save to pipeline row — only when not yet saved */}
            {!savedJobId && (
              <div className="mt-4 border-t border-white/10 pt-4 space-y-3">

                <div className="flex flex-wrap items-center gap-3">

                  {/* AI-extracted job title — read only */}
                  <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/5 border border-white/15 text-white px-4 py-2.5 rounded-xl text-sm">
                    <span className="text-white/40 text-xs shrink-0">Role</span>
                    <span className="w-px h-4 bg-white/20" />
                    <span className="font-medium truncate">
                      {response.job_title || "Extracting..."}
                    </span>
                  </div>

                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="bg-white/5 border border-white/15 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-white/40 cursor-pointer"
                  >
                    <option value="">Select domain...</option>
                    {DOMAINS.map((d) => (
                      <option key={d.value} value={d.value} className="text-black bg-white">
                        {d.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSaveToPipeline}
                    disabled={saving || !selectedDomain}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      selectedDomain
                        ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                    ) : (
                      <><GitBranch className="w-4 h-4" />Save to Pipeline</>
                    )}
                  </button>

                </div>
              </div>
            )}

            {saveError && (
              <p className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {saveError}
              </p>
            )}

          </div>

          {response.hiring_context && (
            <HiringContextCard context={response.hiring_context} />
          )}

          {response.jd_quality_analysis && (
            <JDQualityCard analysis={response.jd_quality_analysis} />
          )}

          <div className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 flex items-center gap-3">
              <ClipboardList className="w-5 h-5" />
              <h2 className="text-2xl font-semibold text-white">
                Intake Meeting Document
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <Section
                title="Role Overview"
                content={response.intake_document.role_overview}
              />
              <ListSection
                title="Key Responsibilities"
                items={response.intake_document.key_responsibilities}
              />
              <ListSection
                title="Must Have Requirements"
                items={response.intake_document.must_have_requirements}
              />
              <ListSection
                title="Nice To Have Requirements"
                items={response.intake_document.nice_to_have_requirements}
              />
              <Section
                title="Ideal Candidate Profile"
                content={response.intake_document.ideal_candidate_profile}
              />
            </div>
          </div>

          {response.auto_reject_criteria?.length > 0 && (
            <AutoRejectCard criteria={response.auto_reject_criteria} />
          )}

          <div className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              <h2 className="text-2xl font-semibold text-white">
                Prescreening Questions
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {response.prescreening_questions.map((q, index) => (
                <div
                  key={index}
                  className="border border-gray-700 rounded-2xl p-5 bg-[#0B1120]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-white">
                      Q{index + 1}. {q.question}
                    </h3>
                    <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm">
                      {q.category}
                    </span>
                  </div>
                  <div className="bg-[#111827] border border-gray-700 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                      What To Listen For
                    </p>
                    <p className="text-gray-400 leading-relaxed">
                      {q.listen_for}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ScorecardCard scorecard={response.scorecard} />

        </>
      )}

    </div>
  );
}

export default ResultsPanel;