import { useState } from "react";
import { Loader2, Users, Unlock, X, Inbox, GitBranch, CheckCircle2 } from "lucide-react";
import CandidateCard from "./CandidateCard";

export default function SourcingResultsPanel({
  result,
  loading,
  selectedJobId,
  onSaveCandidates,
  savingCandidates,
  savedCount,
  saveError,
}) {
  const [selected,    setSelected]    = useState([]);
  const [unlocked,    setUnlocked]    = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(null); // null | { candidates, label }

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirmUnlock = () => {
    setUnlocked((prev) => [...new Set([...prev, ...selected])]);
    setSelected([]);
    setShowConfirm(false);
  };

  if (!result && !loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-4 p-12 text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center">
          <Inbox className="w-7 h-7 text-violet-400" />
        </div>
        <div>
          <p className="text-white font-semibold">No candidates yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Upload or paste a JD to source top matching candidates.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-4 p-12 text-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        <div className="space-y-1">
          <p className="text-gray-300 text-sm font-medium">Sourcing candidates...</p>
          <p className="text-gray-600 text-xs">Searching LinkedIn profiles and ranking by JD match</p>
        </div>
      </div>
    );
  }

  const candidates = result?.candidates || [];

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-violet-300">Top Candidates</h3>
            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-lg">
              {candidates.length} found
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Mode: </span>
            <span className={`px-2 py-0.5 rounded-lg ${
              result?.input_mode === "structured"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
            }`}>
              {result?.input_mode === "structured" ? "Stage 1 Intake" : "Raw JD"}
            </span>
          </div>
        </div>

        {result?.jd_params && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-[#0B1120] border border-gray-700 px-2 py-1 rounded-lg text-gray-400">
              <span className="text-gray-600">Role: </span>{result.jd_params.job_title}
            </span>
            <span className="text-xs bg-[#0B1120] border border-gray-700 px-2 py-1 rounded-lg text-gray-400">
              <span className="text-gray-600">Level: </span>{result.jd_params.seniority}-Level
            </span>
            <span className="text-xs bg-[#0B1120] border border-gray-700 px-2 py-1 rounded-lg text-gray-400">
              <span className="text-gray-600">Location: </span>{result.jd_params.location}
            </span>
            <span className="text-xs bg-[#0B1120] border border-gray-700 px-2 py-1 rounded-lg text-gray-400">
              <span className="text-gray-600">Experience: </span>{result.jd_params.experience_years}
            </span>
          </div>
        )}

        {/* Save to pipeline row */}
        <div className="border-t border-gray-800 pt-3">
          {savedCount > 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {savedCount} candidate{savedCount > 1 ? "s" : ""} saved to pipeline
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                {selectedJobId
                  ? selected.length > 0
                    ? `${selected.length} candidate${selected.length > 1 ? "s" : ""} selected — save selected or all`
                    : "Select candidates to save, or save all to pipeline"
                  : "Select a job from the dropdown to save candidates to pipeline"
                }
              </p>
              {selectedJobId && candidates.length > 0 && (
                <div className="flex items-center gap-2">
                  {/* Save selected — only shown when candidates are checked */}
                  {selected.length > 0 && (
                    <button
                      onClick={() => {
                        const selectedCandidates = candidates.filter(c => selected.includes(c.id));
                        setShowSaveConfirm({ candidates: selectedCandidates, label: `${selected.length} selected` });
                      }}
                      disabled={savingCandidates}
                      className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                    >
                      <GitBranch className="w-3 h-3" />
                      Save {selected.length} Selected
                    </button>
                  )}
                  {/* Save all — always available */}
                  <button
                    onClick={() => setShowSaveConfirm({ candidates, label: `all ${candidates.length}` })}
                    disabled={savingCandidates}
                    className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg font-medium transition-all"
                  >
                    <GitBranch className="w-3 h-3" />
                    Save All
                  </button>
                </div>
              )}
            </div>
          )}
          {saveError && (
            <p className="mt-2 text-xs text-red-400">{saveError}</p>
          )}
        </div>
      </div>

      {/* UNLOCK BAR — only show if selected candidates include non-unlocked ones */}
      {selected.filter(id => !unlocked.includes(id)).length > 0 && (
        <div className="bg-violet-600/10 border border-violet-500/30 rounded-2xl px-5 py-3 flex items-center justify-between">
          <p className="text-sm text-violet-300">
            {selected.filter(id => !unlocked.includes(id)).length} candidate{selected.filter(id => !unlocked.includes(id)).length > 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected([])}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-all font-medium"
            >
              <Unlock className="w-3 h-3" />
              Unlock {selected.filter(id => !unlocked.includes(id)).length} Profile{selected.filter(id => !unlocked.includes(id)).length > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* CANDIDATE CARDS */}
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            selected={selected.includes(candidate.id)}
            onSelect={toggleSelect}
            unlocked={unlocked.includes(candidate.id)}
          />
        ))}
      </div>

      <p className="text-xs text-gray-700 text-center">
        {result?.tokens_used?.toLocaleString()} tokens used
      </p>

      {/* UNLOCK CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold">Unlock Profiles</h4>
              <button onClick={() => setShowConfirm(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              This will unlock LinkedIn profiles for{" "}
              <span className="text-white font-medium">
                {selected.length} candidate{selected.length > 1 ? "s" : ""}
              </span>. Full email and phone contact requires Apollo paid integration.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="flex-1 text-sm text-white bg-violet-600 hover:bg-violet-500 py-2.5 rounded-xl transition-all font-medium"
              >
                Confirm & Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE TO PIPELINE CONFIRM MODAL */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold">Save to Pipeline</h4>
              <button onClick={() => setShowSaveConfirm(null)} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              This will save{" "}
              <span className="text-white font-medium">{showSaveConfirm.label}</span>{" "}
              to the pipeline under the selected job. Their details will be available
              for auto-fill in Stages 3–6.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveConfirm(null)}
                className="flex-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSaveCandidates(showSaveConfirm.candidates);
                  setShowSaveConfirm(null);
                }}
                className="flex-1 text-sm text-white bg-violet-600 hover:bg-violet-500 py-2.5 rounded-xl transition-all font-medium"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}