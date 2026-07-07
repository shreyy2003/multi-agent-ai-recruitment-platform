import { User, Building2, GitBranch } from "lucide-react";

export default function CandidateDetails({
  form, handleChange,
  candidates, selectedJobId, onCandidateSelect,
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-violet-300">
        👤 Candidate Details
      </h3>

      {/* Candidate dropdown — only shown when a job is selected and has candidates */}
      {selectedJobId && candidates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-violet-400" />
            <label className="text-xs text-gray-400">Load from Pipeline</label>
          </div>
          <select
            onChange={(e) => onCandidateSelect(e.target.value)}
            className="w-full bg-[#0B1120] border border-violet-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
          >
            <option value="">Select a sourced candidate...</option>
            {candidates.map((c) => (
              <option key={c.candidate_id} value={c.candidate_id}>
                {c.name}
                {c.title ? ` · ${c.title}` : ""}
                {c.company ? ` · ${c.company}` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600">
            ℹ️ Email autofill requires Apollo paid integration
          </p>
        </div>
      )}

      {selectedJobId && candidates.length === 0 && (
        <p className="text-xs text-gray-500 bg-gray-800/50 rounded-xl px-4 py-3">
          No candidates saved for this job yet — source and save candidates in Stage 2 first.
        </p>
      )}

      {/* Manual fields — always editable */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          Candidate Name *
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-2">Current Title</label>
          <input
            name="candidate_current_title"
            value={form.candidate_current_title}
            onChange={handleChange}
            placeholder="Backend Engineer"
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Current Company</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              name="candidate_company"
              value={form.candidate_company}
              onChange={handleChange}
              placeholder="Infosys"
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </div>

    </div>
  );
}