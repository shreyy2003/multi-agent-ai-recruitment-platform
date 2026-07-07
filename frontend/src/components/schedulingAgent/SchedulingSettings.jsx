import { Clock, Sparkles, RefreshCw } from "lucide-react";

export default function SchedulingSettings({
  form,
  handleChange,
  loading,
  handleGenerate,
  hasResult,
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-5">
      <h3 className="text-sm font-semibold text-violet-300">
        ⚙️ Interview Settings
      </h3>

      {/* Duration */}
      <div>
        <label className="block text-xs text-gray-400 mb-3">
          Interview Duration *
        </label>
        <div className="flex gap-3">
          {[30, 45].map((mins) => (
            <button
              key={mins}
              onClick={() =>
                handleChange({
                  target: { name: "duration_minutes", value: mins },
                })
              }
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                form.duration_minutes === mins
                  ? "border-violet-500 bg-violet-500/10 text-violet-300"
                  : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              {mins} minutes
            </button>
          ))}
        </div>
      </div>

      {/* Working Hours Info */}
      <div className="bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-500">
          <span className="text-gray-400 font-medium">Slot search window:</span>{" "}
          10:00 AM – 9:00 PM, Monday to Friday, next 7 business days.
          One slot per day, spread across different days.
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-violet-500/20"
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Finding slots & drafting email...
          </>
        ) : hasResult ? (
          <>
            <RefreshCw className="w-5 h-5" />
            Regenerate Scheduling Email
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Find Slots & Draft Email
          </>
        )}
      </button>
    </div>
  );
}