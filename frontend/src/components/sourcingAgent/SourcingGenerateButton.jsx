import { Search, Loader2 } from "lucide-react";

export default function SourcingGenerateButton({ loading, handleGenerate, hasResult }) {
  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Sourcing Candidates...
        </>
      ) : hasResult ? (
        <>
          <Search className="w-4 h-4" />
          Re-Source Candidates
        </>
      ) : (
        <>
          <Search className="w-4 h-4" />
          Source Candidates
        </>
      )}
    </button>
  );
}