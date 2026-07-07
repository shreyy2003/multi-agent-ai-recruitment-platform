import {
  Briefcase,
  AtSign,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function MessageTabs({
  activeTab,
  setActiveTab,
  platform,
}) {
  return (
    <div className="flex gap-2 bg-[#111827] border border-gray-800 rounded-2xl p-2">
      <button
        onClick={() => setActiveTab("first")}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
          activeTab === "first"
            ? "bg-violet-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        {platform === "LinkedIn InMail" ? (
          <Briefcase className="w-4 h-4" />
        ) : (
          <AtSign className="w-4 h-4" />
        )}

        First Touch
      </button>

      <button
        onClick={() => setActiveTab("followup")}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
          activeTab === "followup"
            ? "bg-violet-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <RefreshCw className="w-4 h-4" />
        Follow-Up
      </button>

      <button
        onClick={() => setActiveTab("points")}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
          activeTab === "points"
            ? "bg-violet-600 text-white"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        Key Points
      </button>
    </div>
  );
}