import { User, Mail, Briefcase, Building2, GitBranch } from "lucide-react";

export default function CandidateSchedulingDetails({
  form, handleChange,
  jobs, candidates, selectedJobId,
  onJobSelect, onCandidateSelect,
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-violet-300">
        👤 Candidate Details
      </h3>

      {/* Pipeline selectors */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs text-gray-400">Load from Pipeline</span>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-lg ml-auto">Optional</span>
        </div>

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

        {/* Candidate dropdown — shown when job selected */}
        {selectedJobId && candidates.length > 0 && (
          <select
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

        {!form.candidate_email && selectedJobId && candidates.length > 0 && (
          <p className="text-xs text-gray-600">
            ℹ️ Email autofill requires Apollo paid integration — enter manually below
          </p>
        )}
      </div>

      <div className="border-t border-gray-800 pt-3 space-y-4">

        {/* Name */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Candidate Name *</label>
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

        {/* Email */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Candidate Email *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              name="candidate_email"
              value={form.candidate_email}
              onChange={handleChange}
              placeholder="rahul@example.com"
              type="email"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Job Title */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Job Title / Role *</label>
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

        {/* Recruiter Name + Company */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Your Name *</label>
            <input
              name="recruiter_name"
              value={form.recruiter_name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Your Company</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                name="recruiter_company"
                value={form.recruiter_company}
                onChange={handleChange}
                placeholder="TJJ - The Jobs Jungle"
                className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}