import { FileText, Upload, GitBranch } from "lucide-react";

export default function JobBriefPanel({
  form, setForm, handleChange,
  jobs, selectedJobId, onJobSelect,
}) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, jd_file: file }));
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">

      {/* Pipeline job selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-violet-300">Load from Pipeline</h3>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-lg ml-auto">Optional</span>
        </div>
        <p className="text-xs text-gray-500">
          Select a saved job to auto-fill the JD brief and load its sourced candidates below.
        </p>
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
        {selectedJobId && (
          <p className="text-xs text-emerald-400">✓ JD auto-filled from pipeline — edit below if needed</p>
        )}
      </div>

      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-semibold text-violet-300">
            Job Brief / Role Description *
          </h3>
        </div>

        <label className="flex items-center justify-center gap-2 border border-dashed border-gray-700 hover:border-violet-500 rounded-xl p-4 mb-4 cursor-pointer transition-all">
          <Upload className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-gray-400">
            {form.jd_file ? form.jd_file.name : "Upload JD PDF/docx (Optional)"}
          </span>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <textarea
          name="job_brief"
          value={form.job_brief}
          onChange={handleChange}
          rows={10}
          placeholder={`Paste the full job description or role brief here...`}
          className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500"
        />
      </div>

    </div>
  );
}