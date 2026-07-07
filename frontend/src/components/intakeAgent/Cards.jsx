import { useState } from "react";

import {
  Briefcase,
  ShieldAlert,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Hiring Context Card
// ─────────────────────────────────────────────────────────────
export function HiringContextCard({ context }) {

  const fields = [
    { label: "Salary Range", value: context.salary_range },
    { label: "Location", value: context.location },
    { label: "Work Mode", value: context.work_mode },
    { label: "Notice Period", value: context.notice_period_preference },
    { label: "Experience", value: context.experience_range },
    { label: "Flexibility", value: context.experience_flexibility },
    { label: "Urgency", value: context.urgency },
  ];

  const urgencyColor =
    context.urgency === "High"
      ? "bg-red-500/20 text-red-300 border-red-500/30"
      : context.urgency === "Medium"
      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      : "bg-green-500/20 text-green-300 border-green-500/30";

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden">

      <div className="bg-cyan-600 px-6 py-4 flex items-center gap-3">
        <Briefcase className="w-5 h-5 text-white" />

        <h2 className="text-2xl font-semibold text-white">
          Hiring Context
        </h2>
      </div>

      <div className="p-6">

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">

          {fields.map(({ label, value }) =>
            value ? (
              <div
                key={label}
                className="bg-[#0B1120] border border-gray-700 rounded-2xl p-4"
              >
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">
                  {label}
                </p>

                <p
                  className={`font-medium text-white ${
                    label === "Urgency"
                      ? `inline-block px-3 py-1 rounded-lg border text-sm ${urgencyColor}`
                      : ""
                  }`}
                >
                  {value}
                </p>
              </div>
            ) : null
          )}

        </div>

        {context.client_flags && context.client_flags.length > 0 && (

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">

            <p className="text-sm font-semibold text-amber-300 mb-3">
              ⚠ Client Flags From Previous Rounds
            </p>

            <ul className="space-y-2">

              {context.client_flags.map((flag, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-amber-100"
                >
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />

                  <span>{flag}</span>
                </li>
              ))}

            </ul>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Auto Reject Card
// ─────────────────────────────────────────────────────────────
export function AutoRejectCard({ criteria }) {

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden">

      <div className="bg-red-600 px-6 py-4 flex items-center gap-3">

        <ShieldAlert className="w-5 h-5 text-white" />

        <h2 className="text-2xl font-semibold text-white">
          Auto Reject Criteria
        </h2>
      </div>

      <div className="p-6">

        <p className="text-sm text-gray-400 mb-5">
          Candidates matching any of the following conditions should be
          immediately removed from consideration.
        </p>

        <div className="space-y-4">

          {criteria.map((item, index) => (
            <div
              key={index}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <span className="mt-2 w-2 h-2 rounded-full bg-red-400 shrink-0" />

              <p className="text-red-200 leading-relaxed text-sm">
                {item}
              </p>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// JD Quality Analysis Card
// ─────────────────────────────────────────────────────────────
export function JDQualityCard({ analysis }) {

  if (!analysis) return null;

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden">

      <div className="bg-orange-600 px-6 py-4">

        <h2 className="text-2xl font-semibold text-white">
          JD Quality Analysis
        </h2>

      </div>

      <div className="p-6 space-y-6">

        {/* Quality Score */}
        <div className="bg-[#0B1120] border border-gray-700 rounded-2xl p-5">

          <p className="text-sm text-gray-400 mb-2">
            Overall Quality Score
          </p>

          <p className="text-5xl font-bold text-cyan-400">
            {analysis.overall_quality_score}/100
          </p>

        </div>

        {/* Contradictions */}
        {analysis.contradiction_flags?.length > 0 && (
          <div>

            <h3 className="text-lg font-semibold text-red-400 mb-3">
              Contradictions
            </h3>

            <div className="space-y-3">

              {analysis.contradiction_flags.map((item, index) => (
                <div
                  key={index}
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
                >
                  <p className="text-red-200 text-sm leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* Ambiguity */}
        {analysis.ambiguity_flags?.length > 0 && (
          <div>

            <h3 className="text-lg font-semibold text-yellow-300 mb-3">
              Ambiguity Flags
            </h3>

            <div className="space-y-3">

              {analysis.ambiguity_flags.map((item, index) => (
                <div
                  key={index}
                  className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4"
                >
                  <p className="text-yellow-100 text-sm leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* Unrealistic Expectations */}
        {analysis.unrealistic_expectations?.length > 0 && (
          <div>

            <h3 className="text-lg font-semibold text-orange-300 mb-3">
              Unrealistic Expectations
            </h3>

            <div className="space-y-3">

              {analysis.unrealistic_expectations.map((item, index) => (
                <div
                  key={index}
                  className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4"
                >
                  <p className="text-orange-100 text-sm leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* Missing Information */}
        {analysis.missing_information?.length > 0 && (
          <div>

            <h3 className="text-lg font-semibold text-indigo-300 mb-3">
              Missing Information
            </h3>

            <div className="space-y-3">

              {analysis.missing_information.map((item, index) => (
                <div
                  key={index}
                  className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4"
                >
                  <p className="text-indigo-100 text-sm leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* Market Alignment */}
        <div className="bg-[#0B1120] border border-gray-700 rounded-2xl p-5">

          <h3 className="text-lg font-semibold text-white mb-3">
            Market Alignment
          </h3>

          <p className="text-gray-300 leading-relaxed">
            {analysis.market_alignment}
          </p>

        </div>

        {/* Hiring Risk */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">

          <h3 className="text-lg font-semibold text-red-300 mb-3">
            Hiring Risk Summary
          </h3>

          <p className="text-red-100 leading-relaxed">
            {analysis.hiring_risk_summary}
          </p>

        </div>

        {/* Recommended Fixes */}
        {analysis.recommended_fixes?.length > 0 && (
          <div>

            <h3 className="text-lg font-semibold text-green-300 mb-3">
              Recommended Fixes
            </h3>

            <div className="space-y-3">

              {analysis.recommended_fixes.map((item, index) => (
                <div
                  key={index}
                  className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4"
                >
                  <p className="text-green-100 text-sm leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Scorecard Card
// ─────────────────────────────────────────────────────────────
export function ScorecardCard({ scorecard }) {

  const [expanded, setExpanded] = useState(null);

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden">

      <div className="bg-green-600 px-6 py-4 flex items-center gap-3">

        <BarChart3 className="w-5 h-5 text-white" />

        <h2 className="text-2xl font-semibold text-white">
          Candidate Scorecard
        </h2>

      </div>

      <div className="p-6 space-y-4">

        {scorecard.criteria.map((item, index) => (

          <div
            key={index}
            className="border border-gray-700 rounded-2xl overflow-hidden"
          >

            {/* Header */}
            <button
              onClick={() =>
                setExpanded(expanded === index ? null : index)
              }
              className="w-full p-5 bg-[#0B1120] hover:bg-[#111827] transition flex items-center justify-between text-left"
            >

              <div className="flex items-center gap-4">

                <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                  {item.weight}%
                </span>

                <span className="text-white font-medium">
                  {item.name}
                </span>

              </div>

              <div className="flex items-center gap-3">

                <span className="text-sm text-gray-400 hidden md:block">
                  {item.description}
                </span>

                {expanded === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}

              </div>
            </button>

            {/* Mobile Description */}
            <div className="px-5 py-3 bg-[#0B1120] border-t border-gray-800 md:hidden">
              <p className="text-sm text-gray-400">
                {item.description}
              </p>
            </div>

            {/* Expanded Scoring Guide */}
            {expanded === index && item.scoring_guide && (

              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-700">

                {/* Score 5 */}
                <div className="p-5 bg-green-500/10">

                  <p className="text-xs uppercase tracking-wide font-bold text-green-300 mb-3">
                    Score 5 — Exceptional
                  </p>

                  <p className="text-sm text-green-100 leading-relaxed">
                    {item.scoring_guide.score_5}
                  </p>

                </div>

                {/* Score 3 */}
                <div className="p-5 bg-yellow-500/10">

                  <p className="text-xs uppercase tracking-wide font-bold text-yellow-300 mb-3">
                    Score 3 — Average
                  </p>

                  <p className="text-sm text-yellow-100 leading-relaxed">
                    {item.scoring_guide.score_3}
                  </p>

                </div>

                {/* Score 1 */}
                <div className="p-5 bg-red-500/10">

                  <p className="text-xs uppercase tracking-wide font-bold text-red-300 mb-3">
                    Score 1 — Dealbreaker
                  </p>

                  <p className="text-sm text-red-100 leading-relaxed">
                    {item.scoring_guide.score_1}
                  </p>

                </div>

              </div>
            )}

          </div>
        ))}

        {/* Recommendation Threshold */}
        <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-5">

          <h3 className="font-semibold text-green-300 mb-2">
            Recommendation Threshold
          </h3>

          <p className="text-green-100">
            {scorecard.recommendation_threshold}
          </p>

        </div>

      </div>
    </div>
  );
}