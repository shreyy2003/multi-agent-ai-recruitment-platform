import { useRef } from "react";
import { Upload, X, FileText, Info, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SourcingInputPanel({
  form, setForm, handleChange,
  jobs, selectedJobId, onJobSelect,
}) {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const setFile   = (file) => setForm((p) => ({ ...p, jd_file: file }));
  const clearFile = ()     => setForm((p) => ({ ...p, jd_file: null }));

  return (
    <div className="space-y-5">

      {/* PIPELINE JOB SELECTOR */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 space-y-3">

        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-violet-300">Load from Pipeline</h3>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-lg ml-auto">
            Optional
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Select a saved job from Stage 1 to auto-fill the JD — or paste/upload manually below.
        </p>

        <select
          value={selectedJobId}
          onChange={(e) => onJobSelect(e.target.value)}
          className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
        >
          <option value="">Select a saved job...</option>
          {jobs.map((job) => (
            <option key={job.job_id} value={job.job_id}>
              {job.job_title.length > 35
                ? job.job_title.slice(0, 35) + "..."
                : job.job_title}
              {job.domain ? ` · ${job.domain.replace(/_/g, " ")}` : ""}
              {` · ${new Date(job.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}`}
            </option>
          ))}
        </select>

        {selectedJobId && (
          <p className="text-xs text-emerald-400">
            ✓ JD auto-filled from pipeline — you can edit it below if needed
          </p>
        )}

      </div>

      {/* JD INPUT */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">

        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-violet-300">
            📋 Job Description
          </h3>
          <button
            onClick={() => navigate("/intake-agent")}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all shrink-0"
          >
            <Info className="w-3 h-3" />
            Generate structured JD with Stage 1
          </button>
        </div>

        <p className="text-xs text-gray-500 -mt-2">
          Upload the Stage 1 intake report PDF for best results, or paste/upload any raw JD.
          The agent auto-detects the format.
        </p>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Paste JD Text</label>
          <textarea
            name="jd_text"
            value={form.jd_text}
            onChange={handleChange}
            placeholder="Paste raw job description or Stage 1 intake report text here..."
            rows={6}
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">or upload</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {form.jd_file ? (
          <div className="flex items-center justify-between bg-[#0B1120] border border-violet-500/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-gray-300 truncate max-w-[200px]">
                {form.jd_file.name}
              </span>
            </div>
            <button onClick={clearFile} className="text-gray-500 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 bg-[#0B1120] border border-dashed border-gray-700 hover:border-violet-500/50 rounded-xl px-4 py-3 cursor-pointer transition-all"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              Upload JD or Stage 1 Report (PDF or DOCX)
            </span>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

    </div>
  );
}