import { Sparkles, Loader2, RefreshCw } from "lucide-react";

export default function SubmissionGenerateButton({ loading, handleGenerate, hasResult }) {
  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating Submission Email...
        </>
      ) : hasResult ? (
        <>
          <RefreshCw className="w-4 h-4" />
          Regenerate Draft
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Generate Submission Draft
        </>
      )}
    </button>
  );
}