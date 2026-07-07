import { useRef } from "react";
import {
  User, Briefcase, Building2, Mail,
  Upload, X, FileText, Info, StickyNote, GitBranch, CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DOMAINS = [
  { value: "engineering",        label: "Engineering" },
  { value: "product_management", label: "Product Management" },
  { value: "data_ai",            label: "Data & AI" },
  { value: "quality_assurance",  label: "Quality Assurance" },
  { value: "devops_cloud",       label: "DevOps & Cloud" },
  { value: "business_gtm",       label: "Business & GTM" },
];

function FileUploadField({ label, required, hint, file, onFile, onClear, accept, fromPipeline }) {
  const inputRef = useRef(null);
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-2">
        {label} {required && <span className="text-violet-400">*</span>}
      </label>
      {file ? (
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
          fromPipeline
            ? "bg-emerald-500/5 border-emerald-500/30"
            : "bg-[#0B1120] border-violet-500/40"
        }`}>
          <div className="flex items-center gap-2">
            {fromPipeline
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              : <FileText className="w-4 h-4 text-violet-400" />
            }
            <span className="text-sm text-gray-300 truncate max-w-[200px]">{file.name}</span>
            {fromPipeline && <span className="text-xs text-emerald-400">· from pipeline</span>}
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
      <input ref={inputRef} type="file" accept={accept || ".pdf,.docx"} className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)} />
    </div>
  );
}

export default function SubmissionInputPanel({
  form, setForm, handleChange,
  jobs, candidates, selectedJobId, selectedCandId,
  onJobSelect, onCandidateSelect,
  cvFromPipeline, debriefFromPipeline,
}) {
  const navigate  = useNavigate();
  const setFile   = (key) => (file) => setForm((prev) => ({ ...prev, [key]: file }));
  const clearFile = (key) => ()     => setForm((prev) => ({ ...prev, [key]: null }));

  return (
    <div className="space-y-5">

      {/* PIPELINE SELECTORS */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-violet-300">Load from Pipeline</h3>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-lg ml-auto">Optional</span>
        </div>
        <p className="text-xs text-gray-500">
          Select a job and candidate to auto-fill details and attach CV + debrief automatically.
        </p>

        <select value={selectedJobId} onChange={(e) => onJobSelect(e.target.value)}
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

        {selectedJobId && candidates.length > 0 && (
          <select onChange={(e) => onCandidateSelect(e.target.value)} value={selectedCandId}
            className="w-full bg-[#0B1120] border border-violet-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
          >
            <option value="">Select a candidate...</option>
            {candidates.map((c) => (
              <option key={c.candidate_id} value={c.candidate_id}>
                {c.name}{c.title ? ` · ${c.title}` : ""}{c.company ? ` · ${c.company}` : ""}
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
          <div className="space-y-1">
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Candidate details, domain and role auto-filled
            </p>
            {cvFromPipeline && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> CV auto-attached from pipeline
              </p>
            )}
            {debriefFromPipeline && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Debrief auto-attached from pipeline
              </p>
            )}
          </div>
        )}
      </div>

      {/* CANDIDATE + CLIENT DETAILS */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-violet-300">👤 Candidate & Client Details</h3>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Candidate Name <span className="text-violet-400">*</span></label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input name="candidate_name" value={form.candidate_name} onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Role / Job Title <span className="text-violet-400">*</span></label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input name="role" value={form.role} onChange={handleChange}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Client Company Name <span className="text-violet-400">*</span></label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input name="client_name" value={form.client_name} onChange={handleChange}
              placeholder="e.g. Acme Technologies"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Client Contact Email <span className="text-violet-400">*</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input name="client_contact_email" value={form.client_contact_email} onChange={handleChange}
              placeholder="hiring@client.com" type="email"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Domain <span className="text-violet-400">*</span></label>
          <select name="domain" value={form.domain} onChange={handleChange}
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
          >
            <option value="" disabled>Select domain...</option>
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CV UPLOAD */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-violet-300">📄 Candidate CV</h3>
        <p className="text-xs text-gray-500">
          The CV will be attached to the submission email and used by the AI to enrich the email body.
        </p>
        <FileUploadField label="CV File" required hint="Upload PDF or DOCX" accept=".pdf,.docx"
          file={form.cv_file} onFile={setFile("cv_file")} onClear={clearFile("cv_file")}
          fromPipeline={cvFromPipeline}
        />
      </div>

      {/* DEBRIEF UPLOAD */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-violet-300">🎙️ Interview Debrief</h3>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-lg">Optional</span>
        </div>
        <p className="text-xs text-gray-500">
          Including the debrief allows the AI to highlight interview performance in the submission email.
        </p>
        {!debriefFromPipeline && (
          <button onClick={() => navigate("/debrief-agent")}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all w-full justify-center"
          >
            <Info className="w-3 h-3" />
            Don't have one? Generate debrief in Stage 5 → download → upload here
          </button>
        )}
        <FileUploadField label="Debrief File" hint="Upload PDF or DOCX (optional)" accept=".pdf,.docx"
          file={form.debrief_file} onFile={setFile("debrief_file")} onClear={clearFile("debrief_file")}
          fromPipeline={debriefFromPipeline}
        />
      </div>

      {/* ADDITIONAL NOTES */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-violet-300">
            <StickyNote className="inline w-4 h-4 mr-1" />Additional Notes
          </h3>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-lg">Optional</span>
        </div>
        <textarea name="additional_notes" value={form.additional_notes} onChange={handleChange}
          placeholder="e.g. Candidate is available to start immediately."
          rows={3}
          className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>

    </div>
  );
}