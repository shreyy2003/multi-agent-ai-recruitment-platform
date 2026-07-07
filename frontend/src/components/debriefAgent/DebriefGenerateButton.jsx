import { Sparkles, RefreshCw } from "lucide-react";

export default function DebriefGenerateButton({
  loading,
  handleGenerate,
  hasResult,
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 space-y-4">
      <p className="text-xs text-gray-500">
        The agent will read all uploaded documents and generate a full
        structured debrief — including JD match %, strengths, concerns,
        and a final hiring recommendation.
      </p>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-violet-500/20"
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Analysing interview & generating debrief...
          </>
        ) : hasResult ? (
          <>
            <RefreshCw className="w-5 h-5" />
            Regenerate Debrief
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Debrief Summary
          </>
        )}
      </button>
    </div>
  );
}