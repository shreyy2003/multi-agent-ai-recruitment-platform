import { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  Briefcase,
  ExternalLink,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function MatchBar({ score }) {
  const color =
    score >= 85 ? "bg-emerald-500" :
    score >= 70 ? "bg-violet-500"  :
    score >= 50 ? "bg-amber-500"   :
                  "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-semibold ${
        score >= 85 ? "text-emerald-400" :
        score >= 70 ? "text-violet-400"  :
        score >= 50 ? "text-amber-400"   :
                      "text-red-400"
      }`}>
        {score}%
      </span>
    </div>
  );
}

export default function CandidateCard({
  candidate,
  selected,
  onSelect,
  unlocked,
}) {
  // ── Unlocked cards stay open automatically ────────────────────────────
  const [expanded, setExpanded] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  useEffect(() => {
    if (unlocked) setExpanded(true);
  }, [unlocked]);

  const hasSoftFlags = candidate.soft_flags?.length > 0;
  const visibleSkills = showAllSkills
    ? candidate.skills
    : candidate.skills?.slice(0, 5);
  const hiddenCount = (candidate.skills?.length || 0) - 5;

  return (
    <div
      className={`bg-[#111827] border rounded-2xl p-5 transition-all ${
        unlocked
          ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
          : selected
          ? "border-violet-500/60 shadow-lg shadow-violet-500/10"
          : candidate.blend_source === "available"
          ? "border-teal-800/60 hover:border-teal-700/60"
          : "border-gray-800 hover:border-gray-700"
      }`}
    >
      {/* TOP ROW */}
      <div
        className="flex items-start justify-between gap-3 mb-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">

          {/* Checkbox */}
          <div
            onClick={(e) => { e.stopPropagation(); onSelect(candidate.id); }}
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
              selected
                ? "bg-violet-600 border-violet-600"
                : "border-gray-600 hover:border-violet-500"
            }`}
          >
            {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
          </div>

          {/* Name + title + unlocked badge */}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm">
                {candidate.name}
              </p>
              {unlocked && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Unlock className="w-2.5 h-2.5" />
                  Unlocked
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-0.5">
              {candidate.title}
            </p>
          </div>
        </div>

        {/* Match score + expand chevron */}
        <div className="flex items-start gap-3 shrink-0">
          <div className="text-right">
            <div className="w-28">
              <MatchBar score={candidate.match_score} />
            </div>
            <p className="text-xs text-gray-600 mt-1">JD Match</p>
          </div>
          <div className="mt-1 text-gray-600">
            {expanded
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />
            }
          </div>
        </div>
      </div>

      {/* META ROW */}
      <div className="flex flex-wrap gap-3 mb-3 pl-7">
        {candidate.company && candidate.company !== "Not specified" && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Building2 className="w-3 h-3 text-gray-600" />
            {candidate.company}
          </div>
        )}
        {candidate.location && candidate.location !== "Not specified" && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3 text-gray-600" />
            {candidate.location}
          </div>
        )}
        {candidate.experience && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Briefcase className="w-3 h-3 text-gray-600" />
            {candidate.experience}
          </div>
        )}
      </div>

      {/* SIGNAL BADGES */}
      <div className="flex flex-wrap gap-2 mb-3 pl-7">
        {candidate.blend_source === "available" && (
          <span className="text-xs bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
            ⚡ Available Pick
          </span>
        )}
        {candidate.availability_signal === "open_to_work" && (
          <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            🟢 Open to Work
          </span>
        )}
        {candidate.availability_signal === "recently_left" && (
          <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
            🔵 Recently Left Role
          </span>
        )}
        {candidate.availability_signal === "freelancing" && (
          <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
            🟡 Freelancing / Consulting
          </span>
        )}
        {candidate.career_trajectory === "ascending" && (
          <span className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
            📈 Ascending Career
          </span>
        )}
        {candidate.startup_fit && (
          <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
            🚀 Startup Experience
          </span>
        )}
      </div>

      {/* SKILLS — expandable */}
      {candidate.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 pl-7">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-lg"
            >
              {skill}
            </span>
          ))}
          {/* +N more — clickable to expand */}
          {!showAllSkills && hiddenCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAllSkills(true); }}
              className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/5 border border-violet-500/20 px-2 py-0.5 rounded-lg transition-colors"
            >
              +{hiddenCount} more
            </button>
          )}
          {/* Show less */}
          {showAllSkills && hiddenCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAllSkills(false); }}
              className="text-xs text-gray-500 hover:text-gray-400 px-2 py-0.5 transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* SOFT FLAGS */}
      {hasSoftFlags && (
        <div className="pl-7 mb-3 space-y-1">
          {candidate.soft_flags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-xs text-amber-400"
            >
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              {flag.message}
            </div>
          ))}
        </div>
      )}

      {/* EXPANDED — match reason + unlock */}
      {expanded && (
        <div className="pl-7 mt-3 space-y-3 border-t border-gray-800 pt-3">

          {/* Match reason */}
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-gray-600">Match reason: </span>
            {candidate.match_reason}
          </p>

          {/* Availability note */}
          {candidate.availability_note && (
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="text-gray-600">Availability: </span>
              {candidate.availability_note}
            </p>
          )}

          {/* Contact section */}
          {unlocked ? (
            <div className="space-y-2">
              <a
                href={candidate.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View LinkedIn Profile
              </a>
              <p className="text-xs text-gray-600">
                📧 Email & phone available with Apollo paid integration
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              Select and unlock to view full profile
            </div>
          )}
        </div>
      )}
    </div>
  );
}