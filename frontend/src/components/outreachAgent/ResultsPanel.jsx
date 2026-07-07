import { useState } from "react";
import {
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  Briefcase,
  AtSign,
  Sparkles,
} from "lucide-react";

import MessageTabs from "./MessageTabs";

export default function ResultsPanel({
  result,
  loading,
  form,
  handleReset,
  handleRegenerate,
}) {
  const [activeTab, setActiveTab] = useState("first");

  const [copied, setCopied] = useState({
    first: false,
    followup: false,
  });

  const handleCopy = async (text, key) => {
    await navigator.clipboard.writeText(text);

    setCopied((prev) => ({
      ...prev,
      [key]: true,
    }));

    setTimeout(() => {
      setCopied((prev) => ({
        ...prev,
        [key]: false,
      }));
    }, 2000);
  };

  /* EMPTY STATE */
  if (!result && !loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
        <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-violet-400" />
        </div>

        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Messages will appear here
        </h3>

        <p className="text-gray-500 text-sm max-w-xs">
          Fill in the job brief and candidate details,
          then generate personalized outreach drafts.
        </p>
      </div>
    );
  }

  /* LOADING STATE */
  if (loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-10 h-10 text-violet-400 animate-spin mb-4" />

        <p className="text-gray-300 font-medium">
          Drafting personalized messages...
        </p>

        <p className="text-gray-500 text-sm mt-2">
          Pulling key points from job brief
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <MessageTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        platform={form.platform}
      />

      {/* FIRST TOUCH */}
      {activeTab === "first" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-4">

            <div className="flex items-center gap-2">
              {form.platform === "LinkedIn InMail" ? (
                <Briefcase className="w-5 h-5 text-violet-400" />
              ) : (
                <AtSign className="w-5 h-5 text-violet-400" />
              )}

              <h3 className="font-semibold text-white">
                First Touch — {form.platform}
              </h3>
            </div>

            <button
              onClick={() =>
                handleCopy(result.first_touch, "first")
              }
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm text-gray-300"
            >
              {copied.first ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>

          </div>

          <div className="bg-[#0B1120] rounded-xl p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {result.first_touch}
          </div>

        </div>
      )}

      {/* FOLLOW UP */}
      {activeTab === "followup" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-4">

            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-violet-400" />

              <h3 className="font-semibold text-white">
                Follow-Up — {form.platform}
              </h3>
            </div>

            <button
              onClick={() =>
                handleCopy(result.follow_up, "followup")
              }
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm text-gray-300"
            >
              {copied.followup ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>

          </div>

          <div className="bg-[#0B1120] rounded-xl p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {result.follow_up}
          </div>

        </div>
      )}

      {/* KEY POINTS */}
      {activeTab === "points" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">

          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-violet-400" />

            <h3 className="font-semibold text-white">
              Key Points Pulled from Brief
            </h3>
          </div>

          <div className="bg-[#0B1120] rounded-xl p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {result.key_points}
          </div>

        </div>
      )}
      {/* REGENERATE BUTTON */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
        <p className="text-xs text-gray-500 mb-4">
            Not satisfied with the draft? Generate a different version using alternative messaging angles.
        </p>

        <button
            onClick={handleRegenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#0B1120] border border-violet-500/30 hover:border-violet-400 hover:bg-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-violet-300 font-semibold py-4 rounded-2xl transition-all duration-200"
        >
            {loading ? (
            <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating Another Version...
            </>
            ) : (
            <>
                <RefreshCw className="w-5 h-5" />
                Generate Another Version
            </>
            )}
        </button>

        </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between bg-[#111827] border border-gray-800 rounded-2xl px-5 py-4">

        <div className="flex flex-wrap gap-5 text-sm">

          <span className="text-gray-500">
            Candidate:{" "}
            <span className="text-white font-medium">
              {result.candidate_name}
            </span>
          </span>

          <span className="text-gray-500">
            Platform:{" "}
            <span className="text-violet-400 font-medium">
              {result.platform}
            </span>
          </span>

          <span className="text-gray-500">
            Tokens:{" "}
            <span className="text-white font-medium">
              {result.tokens_used}
            </span>
          </span>

        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          New Draft
        </button>

      </div>
    </div>
  );
}