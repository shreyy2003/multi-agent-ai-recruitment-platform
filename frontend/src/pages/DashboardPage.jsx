import { useNavigate } from "react-router-dom";

import {
  ClipboardList,
  Mail,
  CalendarDays,
  FileCheck,
  Mic,
  ArrowRight,
  Sparkles,
  Users,
  Bot,
} from "lucide-react";

function DashboardPage() {

  const navigate = useNavigate();

  const agents = [
    {
      stage: "Stage 1",

      title: "Client Intake Agent",

      description:
        "Convert recruiter-client discussions and raw job descriptions into structured hiring requirements and recruitment workflows.",

      features: [
        "Intake meeting document generation",
        "Role-specific requirement extraction",
        "Pre-screening question generation",
        "Evaluation scorecards & rubrics",
        "JD intelligence & hiring context analysis",
      ],

      icon: ClipboardList,

      route: "/intake-agent",

      status: "Live",

      color:
        "from-cyan-500/20 to-blue-500/20 border-cyan-500/20 hover:border-cyan-400",
    },

    {
      stage: "Stage 2",

      title: "Human Sourcing Layer",

      description: "Upload any job description and let the AI source, rank, and flag the best-matched candidates from live LinkedIn profiles — ready for recruiter review in seconds.",
      
      features: [
        "Real-time candidate discovery from live LinkedIn profiles",
        "Automatic JD parsing — works with raw JD or Stage 1 intake report",
        "AI match scoring — every candidate ranked 0-100 against JD requirements",
        "Soft flag system — auto-reject signals surfaced as warnings, never hard filters",
        "Multi-angle search — 3 optimized queries per JD for maximum profile coverage",
        "On-demand contact unlock — select and reveal LinkedIn profiles instantly",
      ],

      icon: Users,

      route: "/sourcing-agent",

      status: "Live",

      color:
        "from-gray-500/20 to-slate-500/20 border-gray-500/20 hover:border-gray-400",
    },

    {
      stage: "Stage 3",

      title: "Candidate Outreach Agent",

      description:
        "Generate personalized recruiter outreach communication using the role brief and candidate profile context.",

      features: [
        "First-touch InMail drafting",
        "Follow-up email generation",
        "Role brief summarization",
        "Candidate-job alignment messaging",
        "Personalized recruiter communication",
      ],

      icon: Mail,

      route: "/outreach-agent",

      status: "Live",

      color:
        "from-violet-500/20 to-fuchsia-500/20 border-violet-500/20 hover:border-violet-400",
    },


    {
      stage: "Stage 4",

      title: "Interview Scheduling Agent",

      description:
        "Automate recruiter scheduling workflows and eliminate manual interview coordination overhead.",

      features: [
        "Google & Outlook calendar integration",
        "Real-time availability detection",
        "Automatic interview slot generation",
        "30-45 minute interview scheduling",
        "AI-generated scheduling emails",
        "Timezone-aware slot selection",
    ],

      icon: CalendarDays,

      route: "/scheduling-agent",

      status: "Live",

      color:
        "from-emerald-500/20 to-green-500/20 border-emerald-500/20 hover:border-emerald-400",
    },

    {
      stage: "Stage 5",

      title: "Interview & Debrief Agent",

      description:
        "Conduct AI-assisted interviews or recruiter-led interviews and automatically generate structured debrief summaries.",

      features: [
        "Upload transcript + JD with optional resume for triangulated evaluation",
        "AI-powered JD match scoring — fully met, partial, and missing requirements",
        "Evidence-based strengths, concerns, and resume consistency check",
        "Final recommendation: Strong Hire / Hire / Borderline / No Hire",
        "Suggested follow-up questions targeting identified gaps",
        "Download full debrief as PDF or DOCX",
        ],

      icon: Mic,

      route: "/debrief-agent",

      status: "Live",

      color:
        "from-orange-500/20 to-amber-500/20 border-orange-500/20 hover:border-orange-400",
    },

    {
      stage: "Stage 6",

      title: "Candidate Submission Agent",

      description:
        "Automate final candidate submission workflows while keeping recruiter approval in the loop before client delivery.",

      features: [
        "AI-generated submission email from CV + debrief",
        "Domain-specific email templates (Engineering, Product, Data & AI, QA, DevOps, GTM)",
        "Auto CV attachment with optional debrief inclusion",
        "Editable draft preview before sending",
        "Recruiter approval gate — email only sends on explicit confirmation",
        "Gmail SMTP delivery to client contact",
        ],

      icon: FileCheck,

      route: "/submission-agent",

      status: "Live",

      color:
        "from-pink-500/20 to-rose-500/20 border-pink-500/20 hover:border-pink-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-white overflow-hidden">

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">

        {/* HERO SECTION */}
        <div className="mb-16">

          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-5 py-2 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Multi-Agent Recruitment Automation Platform
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold leading-tight max-w-5xl">
            AI Recruitment Workflow Automation System
          </h1>

          <p className="text-gray-400 text-xl mt-8 max-w-4xl leading-relaxed">
            A modular recruiter copilot platform designed to automate intake,
            outreach, scheduling, interviewing, debriefing, and candidate
            submission workflows while keeping recruiters as the supervisory layer.
          </p>

          {/* INFO CARDS */}
          <div className="flex flex-wrap gap-4 mt-10">

            <div className="bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4">
              <p className="text-3xl font-bold text-cyan-400">6</p>

              <p className="text-gray-400 text-sm mt-1">
                Recruitment Workflow Stages
              </p>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4">
              <p className="text-3xl font-bold text-emerald-400">
                Human + AI
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Hybrid Recruitment System
              </p>
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4">
              <p className="text-3xl font-bold text-orange-400">
                Workflow Agents
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Not A Single Chatbot
              </p>
            </div>

          </div>
        </div>

        {/* AGENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {agents.map((agent) => {

            const Icon = agent.icon;

            return (
              <button
                key={agent.title}
                onClick={() =>
                  agent.route !== "#" && navigate(agent.route)
                }
                className={`group relative overflow-hidden text-left bg-[#111827] border rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${agent.color}
                ${agent.route === "#" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >

                {/* HEADER */}
                <div className="flex items-start justify-between mb-8">

                  <div className="flex items-center gap-4">

                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <div>

                      <p className="text-cyan-400 text-sm font-semibold mb-2">
                        {agent.stage}
                      </p>

                      <h2 className="text-2xl font-bold leading-tight">
                        {agent.title}
                      </h2>

                    </div>
                  </div>

                  <div className="flex items-center gap-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        agent.status === "Live"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      } `}
                    >
                      {agent.status}
                    </span>

                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />

                  </div>
                </div>

                {/* DESCRIPTION */}
                <p className="text-gray-400 leading-relaxed mb-8">
                  {agent.description}
                </p>

                {/* FEATURES */}
                <div className="space-y-3">

                  {agent.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3"
                    >

                      <div className="mt-1.5 w-2 h-2 rounded-full bg-cyan-400 shrink-0" />

                      <span className="text-gray-300 text-sm leading-relaxed">
                        {feature}
                      </span>

                    </div>
                  ))}

                </div>

              </button>
            );
          })}
        </div>

        {/* ARCHITECTURE */}
        <div className="mt-20 bg-[#111827] border border-gray-800 rounded-3xl p-10">

          <div className="flex items-center gap-3 mb-8">

            <Bot className="w-7 h-7 text-cyan-400" />

            <h2 className="text-3xl font-bold">
              Multi-Agent Workflow Architecture
            </h2>

          </div>

          <p className="text-gray-400 text-lg leading-relaxed max-w-5xl">
            Each recruitment stage operates as an independent workflow agent or
            orchestration layer. Structured outputs from one stage become inputs
            for the next stage while recruiters remain the approval and decision layer.
          </p>

          {/* FLOW */}
          <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">

            {[
              "Client Intake",
              "Automated Human Sourcing",
              "Outreach",
              "Scheduling",
              "Interview & Debrief",
              "Submission",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-4"
              >

                <div className="bg-cyan-500/10 border border-cyan-500/20 px-5 py-3 rounded-2xl text-cyan-300 font-medium">
                  {step}
                </div>

                {index !== 5 && (
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                )}

              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;