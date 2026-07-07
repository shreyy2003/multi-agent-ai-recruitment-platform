import {
  ChevronDown,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function MessageSettings({
  form,
  handleChange,
  loading,
  handleGenerate,
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">

      <h3 className="text-sm font-semibold text-violet-300">
        ⚙️ Message Settings
      </h3>

      <div className="grid grid-cols-2 gap-3">

        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Platform
          </label>

          <div className="relative">
            <select
              name="platform"
              value={form.platform}
              onChange={handleChange}
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-violet-500"
            >
              <option>LinkedIn InMail</option>
              <option>Email</option>
            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Tone
          </label>

          <div className="relative">
            <select
              name="tone"
              value={form.tone}
              onChange={handleChange}
              className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-violet-500"
            >
              <option>Professional</option>
              <option>Friendly</option>
              <option>Formal</option>
              <option>Casual</option>
            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-3">

        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Recruiter Name *
          </label>

          <input
            name="recruiter_name"
            value={form.recruiter_name}
            onChange={handleChange}
            placeholder="e.g. Shrey"
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Recruiter Company
          </label>

          <input
            name="recruiter_company"
            value={form.recruiter_company}
            onChange={handleChange}
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>

      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all duration-200"
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Drafting Messages...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Outreach Messages
          </>
        )}
      </button>
    </div>
  );
}