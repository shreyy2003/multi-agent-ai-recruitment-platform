import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays } from "lucide-react";
import CalendarConnect from "../components/schedulingAgent/CalendarConnect";
import CandidateSchedulingDetails from "../components/schedulingAgent/CandidateSchedulingDetails";
import SchedulingSettings from "../components/schedulingAgent/SchedulingSettings";
import SchedulingResultsPanel from "../components/schedulingAgent/SchedulingResultsPanel";

export default function SchedulingAgentPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    candidate_name: "",
    candidate_email: "",
    job_title: "",
    duration_minutes: 30,
    recruiter_name: "",
    recruiter_company: "TJJ - The Jobs Jungle",
  });

  const [selectedProvider, setSelectedProvider] = useState("");
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

  // When job selected — fetch candidates + auto-fill job title
  const handleJobSelect = async (jobId) => {
    setSelectedJobId(jobId);
    setCandidates([]);
    setForm((prev) => ({ ...prev, job_title: "", candidate_name: "", candidate_email: "" }));

    if (!jobId) return;

    try {
      const jobRes  = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}`);
      const jobData = await jobRes.json();
      setForm((prev) => ({ ...prev, job_title: jobData.structured_jd?.job_title || jobData.job_title || "" }));

      const candRes  = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}/candidates`);
      const candData = await candRes.json();
      setCandidates(candData);
    } catch (e) {
      console.error("Failed to load pipeline data:", e);
    }
  };

  // When candidate selected — auto-fill name + email
  const handleCandidateSelect = (candidateId) => {
    if (!candidateId) {
      setForm((prev) => ({ ...prev, candidate_name: "", candidate_email: "" }));
      return;
    }
    const candidate = candidates.find((c) => c.candidate_id === candidateId);
    if (!candidate) return;
    setForm((prev) => ({
      ...prev,
      candidate_name:  candidate.name  || "",
      candidate_email: candidate.email || "",
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!form.candidate_name.trim()) { setError("Candidate name is required."); return; }
    if (!form.candidate_email.trim()) { setError("Candidate email is required."); return; }
    if (!form.job_title.trim()) { setError("Job title is required."); return; }
    if (!form.recruiter_name.trim()) { setError("Your name is required."); return; }
    if (!selectedProvider) { setError("Please connect and select a calendar provider."); return; }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("candidate_name",    form.candidate_name);
      formData.append("candidate_email",   form.candidate_email);
      formData.append("job_title",         form.job_title);
      formData.append("duration_minutes",  form.duration_minutes);
      formData.append("recruiter_name",    form.recruiter_name);
      formData.append("recruiter_company", form.recruiter_company);
      formData.append("calendar_provider", selectedProvider);

      const res = await fetch("http://localhost:8000/agent/scheduling", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to generate scheduling email.");
      }

      const data = await res.json();
      setResult(data);

    } catch (err) {
      setError(err.message || "Failed to connect to backend. Make sure it's running.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setForm({
      candidate_name: "",
      candidate_email: "",
      job_title: "",
      duration_minutes: 30,
      recruiter_name: "",
      recruiter_company: "TJJ - The Jobs Jungle",
    });
    setSelectedProvider("");
    setError("");
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
              <CalendarDays className="w-4 h-4" />
              Stage 4 — Interview Scheduling Agent
            </div>
            <h1 className="text-5xl font-bold">Interview Scheduling Pack</h1>
            <p className="text-gray-400 text-lg mt-4 max-w-3xl">
              Automatically finds 3 free slots from your calendar and drafts
              a ready-to-send scheduling email for the candidate.
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
            <CalendarConnect
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
            />

            <CandidateSchedulingDetails
              form={form}
              handleChange={handleChange}
              jobs={jobs}
              candidates={candidates}
              selectedJobId={selectedJobId}
              onJobSelect={handleJobSelect}
              onCandidateSelect={handleCandidateSelect}
            />

            <SchedulingSettings
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

          <SchedulingResultsPanel
            result={result}
            loading={loading}
            handleReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}