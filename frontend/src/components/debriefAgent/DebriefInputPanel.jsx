import { useRef } from "react";
import {
  User, Briefcase, UserCheck,
  Upload, X, FileText, Info, GitBranch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function FileUploadField({ label, required, hint, file, onFile, onClear, accept }) {
  const inputRef = useRef(null);

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-2">
        {label} {required && <span className="text-violet-400">*</span>}
      </label>

      {file ? (
        <div className="flex items-center justify-between bg-[#0B1120] border border-violet-500/40 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-gray-300 truncate max-w-[200px]">
              {file.name}
            </span>
          </div>
          <button onClick={onClear} className="text-gray-500 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-3 bg-[#0B1120] border border-dashed border-gray-700 hover:border-violet-500/50 rounded-xl px-4 py-3 cursor-pointer transition-all"
        >
          <Upload className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">{hint || "Upload PDF or DOCX"}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept || ".pdf,.docx"}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
    </div>
  );
}

export default function DebriefInputPanel({
  form, setForm, handleChange,
  jobs, candidates, selectedJobId, selectedCandId,
  onJobSelect, onCandidateSelect,
}) {
  const navigate = useNavigate();

  const setFile  = (key) => (file) => setForm((prev) => ({ ...prev, [key]: file }));
  const clearFile = (key) => ()   => setForm((prev) => ({ ...prev, [key]: null }));

  return (
    <div className="space-y-5">

      {/* PIPELINE SELECTORS */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-violet-300">Load from Pipeline</h3>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-lg ml-auto">Optional</span>
        </div>
        <p className="text-xs text-gray-500">
          Select a job to auto-fill the JD and job title, then select a candidate to auto-fill their name.
        </p>

        {/* Job dropdown */}
        <select
          value={selectedJobId}
          onChange={(e) => onJobSelect(e.target.value)}
          className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
        >
          <option value="">Select a saved job...</option>
          {jobs.map((job) => (
            <option key={job.job_id} value={job.job_id}>
              {job.job_title.length > 35 ? job.job_title.slice(0, 35) + "..." : job.job_title}
              {job.domain ? ` · ${job.domain.replace(/_/g, " ")}` : ""}
              {` · ${new Date(job.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}`}
            </option>
          ))}
        </select>

        {/* Candidate dropdown */}
        {selectedJobId && candidates.length > 0 && (
          <select
            value={selectedCandId}
            onChange={(e) => onCandidateSelect(e.target.value)}
            className="w-full bg-[#0B1120] border border-violet-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
          >
            <option value="">Select a candidate...</option>
            {candidates.map((c) => (
              <option key={c.candidate_id} value={c.candidate_id}>
                {c.name}
                {c.title ? ` · ${c.title}` : ""}
                {c.company ? ` · ${c.company}` : ""}
              </option>
            ))}
          </select>
        )}

        {selectedJobId && candidates.length === 0 && (
          <p className="text-xs text-gray-500 bg-gray-800/50 rounded-xl px-4 py-3">
            No candidates saved for this job yet — source candidates in Stage 2 first.
          </p>
        )}

        {selectedCandId && (
          <p className="text-xs text-emerald-400">
            ✓ Candidate and JD auto-filled — debrief will be saved to their pipeline record
          </p>
        )}
      </div>

      {/* CANDIDATE + ROLE DETAILS */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-violet-300">👤 Interview Details</h3>

        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Candidate Name <span className="text-violet-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              name="candidate_name"
              value={form.candidate_name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Job Title <span className="text-violet-400">*</span>
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Interviewer Name <span className="text-violet-400">*</span>
          </label>
          <div className="relative">
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              name="interviewer_name"
              value={form.interviewer_name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </div>

      {/* JD SECTION */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-violet-300">📋 Job Description</h3>
          <button
            onClick={() => navigate("/intake-agent")}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all shrink-0"
          >
            <Info className="w-3 h-3" />
            Generate JD with Intake Agent from Stage 1
          </button>
        </div>

        <p className="text-xs text-gray-500 -mt-2">
          Don't have a structured JD? Use Stage 1 to generate one, then paste or upload it here.
        </p>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Paste JD Text</label>
          <textarea
            name="jd_text"
            value={form.jd_text}
            onChange={handleChange}
            placeholder="Paste the job description here..."
            rows={5}
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">or upload</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <FileUploadField
          label="Upload JD File"
          hint="Upload PDF or DOCX"
          file={form.jd_file}
          onFile={setFile("jd_file")}
          onClear={clearFile("jd_file")}
        />
      </div>

      {/* TRANSCRIPT */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-violet-300">🎙️ Interview Transcript</h3>
        <p className="text-xs text-gray-500">
          Export your transcript from Otter, Fireflies, Fathom, or any transcription tool as PDF or DOCX.
        </p>
        <FileUploadField
          label="Transcript File"
          required
          hint="Upload PDF or DOCX transcript"
          file={form.transcript_file}
          onFile={setFile("transcript_file")}
          onClear={clearFile("transcript_file")}
        />
      </div>

      {/* RESUME */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-violet-300">📄 Candidate Resume</h3>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-lg">Optional</span>
        </div>
        <p className="text-xs text-gray-500">
          Uploading the resume enables a consistency check. If a candidate is selected from the
          pipeline, the resume will also be saved for auto-attach in Stage 6.
        </p>
        <FileUploadField
          label="Resume File"
          hint="Upload PDF or DOCX (optional)"
          file={form.resume_file}
          onFile={setFile("resume_file")}
          onClear={clearFile("resume_file")}
        />
      </div>

    </div>
  );
}