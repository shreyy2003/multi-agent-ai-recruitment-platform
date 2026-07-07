import { useState } from "react";
import {
  CalendarDays,
  Mail,
  RefreshCw,
  Copy,
  Check,
  Clock,
} from "lucide-react";

export default function SchedulingResultsPanel({
  result,
  loading,
  handleReset,
}) {
  const [activeTab, setActiveTab] = useState("email");
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* EMPTY STATE */
  if (!result && !loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
        <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Scheduling email will appear here
        </h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Fill in candidate details, connect your calendar, and click generate.
          The agent will find 3 free slots and draft the email for you.
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
          Checking calendar for free slots...
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Drafting your scheduling email
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* TABS */}
      <div className="flex gap-2 bg-[#111827] border border-gray-800 rounded-2xl p-2">
        <button
          onClick={() => setActiveTab("email")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "email"
              ? "bg-violet-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Mail className="w-4 h-4" />
          Drafted Email
        </button>

        <button
          onClick={() => setActiveTab("slots")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "slots"
              ? "bg-violet-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Available Slots
        </button>
      </div>

      {/* EMAIL TAB */}
      {activeTab === "email" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold text-white">
                Scheduling Email — {result.candidate_name}
              </h3>
            </div>

            <button
              onClick={() => handleCopy(result.drafted_email)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm text-gray-300"
            >
              {copied ? (
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
            {result.drafted_email}
          </div>
        </div>
      )}

      {/* SLOTS TAB */}
      {activeTab === "slots" && (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">
              3 Free Slots Found
            </h3>
          </div>

          <div className="space-y-3">
            {result.slots.map((slot, i) => (
              <div
                key={i}
                className="bg-[#0B1120] border border-gray-800 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-violet-400 text-sm font-bold">
                    {i + 1}
                  </span>
                </div>

                <div>
                  <p className="text-white text-sm font-medium">
                    {slot.date}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <p className="text-gray-400 text-xs">
                      {slot.start_time} – {slot.end_time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-600 mt-4">
            These slots were pulled live from your {result.calendar_provider === "google" ? "Google" : "Outlook"} Calendar.
          </p>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-between bg-[#111827] border border-gray-800 rounded-2xl px-5 py-4">
        <div className="flex flex-wrap gap-5 text-sm">
          <span className="text-gray-500">
            Candidate:{" "}
            <span className="text-white font-medium">{result.candidate_name}</span>
          </span>
          <span className="text-gray-500">
            Role:{" "}
            <span className="text-violet-400 font-medium">{result.job_title}</span>
          </span>
          <span className="text-gray-500">
            Duration:{" "}
            <span className="text-white font-medium">{result.duration_minutes} min</span>
          </span>
          <span className="text-gray-500">
            Tokens:{" "}
            <span className="text-white font-medium">{result.tokens_used}</span>
          </span>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          New Schedule
        </button>
      </div>
    </div>
  );
}