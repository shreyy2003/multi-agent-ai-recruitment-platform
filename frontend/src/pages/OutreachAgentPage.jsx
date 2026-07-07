import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import JobBriefPanel from "../components/outreachAgent/JobBriefPanel";
import CandidateDetails from "../components/outreachAgent/CandidateDetails";
import MessageSettings from "../components/outreachAgent/MessageSettings";
import ResultsPanel from "../components/outreachAgent/ResultsPanel";

import { ArrowLeft, Mail } from "lucide-react";

export default function OutreachAgentPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    job_brief: "",
    jd_file: null,
    candidate_name: "",
    candidate_current_title: "",
    candidate_company: "",
    platform: "LinkedIn InMail",
    tone: "Professional",
    recruiter_name: "",
    recruiter_company: "TJJ - The Jobs Jungle",
  });

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Pipeline state
  const [jobs,          setJobs]          = useState([]);
  const [candidates,    setCandidates]    = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  // Load open jobs on mount
  useEffect(() => {
    fetch("http://localhost:8000/pipeline/jobs?status=open")
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => {});
  }, []);

  // When job selected — fetch its JD and candidates
  const handleJobSelect = async (jobId) => {
    setSelectedJobId(jobId);
    setCandidates([]);
    setForm((prev) => ({ ...prev, job_brief: "", candidate_name: "", candidate_current_title: "", candidate_company: "" }));

    if (!jobId) return;

    try {
      // Fetch full JD to auto-fill job brief
      const jobRes  = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}`);
      const jobData = await jobRes.json();

      // Extract readable JD text from structured_jd
      const intake   = jobData.structured_jd?.intake_document || {};
      const jdText   = [
        jobData.structured_jd?.job_title || "",
        intake.role_overview || "",
        intake.must_have_requirements?.join("\n") || "",
        intake.nice_to_have_requirements?.join("\n") || "",
      ].filter(Boolean).join("\n\n");

      setForm((prev) => ({ ...prev, job_brief: jdText }));

      // Fetch candidates for this job
      const candRes  = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}/candidates`);
      const candData = await candRes.json();
      setCandidates(candData);

    } catch (e) {
      console.error("Failed to load pipeline data:", e);
    }
  };

  // When candidate selected — auto-fill candidate fields
  const handleCandidateSelect = (candidateId) => {
    if (!candidateId) {
      setForm((prev) => ({ ...prev, candidate_name: "", candidate_current_title: "", candidate_company: "" }));
      return;
    }
    const candidate = candidates.find((c) => c.candidate_id === candidateId);
    if (!candidate) return;
    setForm((prev) => ({
      ...prev,
      candidate_name:          candidate.name  || "",
      candidate_current_title: candidate.title || "",
      candidate_company:       candidate.company || "",
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateOutreach = async (regenerate = false) => {
    if (!form.job_brief.trim() && !form.jd_file) {
      setError("Provide either a Job Brief or upload a JD file.");
      return;
    }
    if (!form.candidate_name.trim() || !form.recruiter_name.trim()) {
      setError("Candidate name and recruiter name are required.");
      return;
    }

    setError("");
    setLoading(true);
    if (!regenerate) setResult(null);

    try {
      const formData = new FormData();
      formData.append("job_brief",               form.job_brief);
      if (form.jd_file) formData.append("jd_file", form.jd_file);
      formData.append("candidate_name",          form.candidate_name);
      formData.append("candidate_current_title", form.candidate_current_title);
      formData.append("candidate_company",       form.candidate_company);
      formData.append("platform",                form.platform);
      formData.append("tone",                    form.tone);
      formData.append("recruiter_name",          form.recruiter_name);
      formData.append("recruiter_company",       form.recruiter_company);
      formData.append("regenerate",              regenerate);
      if (regenerate && result?.full_output) {
        formData.append("previous_output", result.full_output);
      }

      const res = await fetch("http://localhost:8000/agent/outreach", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setResult(data);

    } catch (err) {
      setError("Failed to connect to backend. Make sure it's running.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate    = () => generateOutreach(false);
  const handleRegenerate  = () => generateOutreach(true);

  const handleReset = () => {
    setResult(null);
    setForm({
      job_brief: "",
      jd_file: null,
      candidate_name: "",
      candidate_current_title: "",
      candidate_company: "",
      platform: "LinkedIn InMail",
      tone: "Professional",
      recruiter_name: "",
      recruiter_company: "TJJ - The Jobs Jungle",
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10">

        <div className="mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Mail className="w-4 h-4" />
              Stage 3 — Candidate Outreach Agent
            </div>
            <h1 className="text-5xl font-bold">Candidate Outreach Drafter</h1>
            <p className="text-gray-400 text-lg mt-4 max-w-3xl">
              Generate personalized recruiter outreach messages,
              InMails, and follow-up communications using AI-powered role analysis.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 bg-violet-600 hover:bg-violet-500 transition-all duration-200 px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-violet-500/20 self-start lg:self-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back To Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="space-y-6">

            <JobBriefPanel
              form={form}
              setForm={setForm}
              handleChange={handleChange}
              jobs={jobs}
              selectedJobId={selectedJobId}
              onJobSelect={handleJobSelect}
            />

            <CandidateDetails
              form={form}
              handleChange={handleChange}
              candidates={candidates}
              selectedJobId={selectedJobId}
              onCandidateSelect={handleCandidateSelect}
            />

            <MessageSettings
              form={form}
              handleChange={handleChange}
              loading={loading}
              handleGenerate={handleGenerate}
              hasResult={!!result}
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

          </div>

          <ResultsPanel
            result={result}
            loading={loading}
            form={form}
            handleReset={handleReset}
            handleRegenerate={handleRegenerate}
          />

        </div>
      </div>
    </div>
  );
}