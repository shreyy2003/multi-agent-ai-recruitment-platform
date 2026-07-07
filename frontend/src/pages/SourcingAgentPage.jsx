import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";

import SourcingInputPanel    from "../components/sourcingAgent/SourcingInputPanel";
import SourcingGenerateButton from "../components/sourcingAgent/SourcingGenerateButton";
import SourcingResultsPanel  from "../components/sourcingAgent/SourcingResultsPanel";
import SourcingProgress from "../components/sourcingAgent/SourcingProgress";

export default function SourcingAgentPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    jd_text: "",
    jd_file: null,
  });

  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepMessage, setStepMessage] = useState("");

  // Pipeline state
  const [jobs,           setJobs]           = useState([]);
  const [selectedJobId,  setSelectedJobId]  = useState("");
  const [savingCandidates, setSavingCandidates] = useState(false);
  const [savedCount,     setSavedCount]     = useState(0);
  const [saveError,      setSaveError]      = useState("");

  const STEPS = [
    "Reading job description",
    "Building search queries",
    "Searching LinkedIn profiles",
    "Extracting candidate profiles",
    "Scoring and ranking",
    "Building final list",
  ];

  // Load saved jobs from pipeline for dropdown
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:8000/pipeline/jobs?status=open");
        const data = await res.json();
        setJobs(data);
      } catch (e) {
        console.error("Failed to load pipeline jobs:", e);
      }
    };
    fetchJobs();
  }, []);

  // When a job is selected from dropdown, fetch its structured JD and auto-fill
  const handleJobSelect = async (jobId) => {
    setSelectedJobId(jobId);
    if (!jobId) return;

    try {
      const res = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}`);
      const data = await res.json();

      // structured_jd is the full intake response JSON — convert to text for the sourcing agent
      const jdText = JSON.stringify(data.structured_jd, null, 2);
      setForm((prev) => ({ ...prev, jd_text: jdText, jd_file: null }));
      setResult(null);
      setSavedCount(0);
      setSaveError("");
    } catch (e) {
      console.error("Failed to load job JD:", e);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!form.jd_text.trim() && !form.jd_file) {
      setError("Please paste a JD or upload a file.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);
    setSavedCount(0);
    setSaveError("");
    setCurrentStep(0);
    setStepMessage("Starting sourcing...");

    try {
      const formData = new FormData();

      if (form.jd_text.trim()) formData.append("jd_text", form.jd_text);
      if (form.jd_file)        formData.append("jd_file", form.jd_file);

      const response = await fetch(
        "http://localhost:8000/sourcing/source/stream",
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to source candidates.");
      }

      if (!response.body) throw new Error("Streaming not supported.");

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;

          const event = JSON.parse(line.slice(6));

          if (event.type === "progress") {
            setCurrentStep(event.step);
            setStepMessage(event.message);
          }
          if (event.type === "complete") {
            setResult(event.data);
            setStepMessage(event.message);
            setLoading(false);
          }
          if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to connect to backend. Make sure it's running.");
      setLoading(false);
    }
  };

  // Save sourced candidates to pipeline under the selected job
  const handleSaveCandidates = async (candidates) => {
    if (!selectedJobId) {
      setSaveError("Select a job from the pipeline dropdown first.");
      return;
    }

    setSavingCandidates(true);
    setSaveError("");
    let count = 0;
    const seenUrls = new Set();

    try {
      for (const candidate of candidates) {
        // Skip duplicates by linkedin_url within this save batch
        const key = candidate.linkedin_url || candidate.name;
        if (seenUrls.has(key)) continue;
        seenUrls.add(key);

        await fetch("http://localhost:8000/pipeline/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id:       selectedJobId,
            name:         candidate.name,
            title:        candidate.title,
            company:      candidate.company !== "Not specified" ? candidate.company : null,
            email:        candidate.email   || null,
            phone:        candidate.phone   || null,
            linkedin_url: candidate.linkedin_url || null,
          }),
        });
        count++;
      }
      setSavedCount(count);
    } catch (e) {
      setSaveError("Failed to save some candidates. Please try again.");
    } finally {
      setSavingCandidates(false);
    }
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
              <Users className="w-4 h-4" />
              Stage 2 — Human Sourcing Agent
            </div>
            <h1 className="text-5xl font-bold">Candidate Sourcing</h1>
            <p className="text-gray-400 text-lg mt-4 max-w-3xl">
              Upload a JD or Stage 1 intake report. The agent searches LinkedIn profiles,
              extracts candidates, and ranks them by JD match score — powered by
              Tavily web search and Groq AI re-ranking.
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
            <SourcingInputPanel
              form={form}
              setForm={setForm}
              handleChange={handleChange}
              jobs={jobs}
              selectedJobId={selectedJobId}
              onJobSelect={handleJobSelect}
            />

            <SourcingGenerateButton
              loading={loading}
              handleGenerate={handleGenerate}
              hasResult={!!result}
            />

            {loading && (
              <SourcingProgress
                currentStep={currentStep}
                stepMessage={stepMessage}
                steps={STEPS}
              />
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
          </div>

          <SourcingResultsPanel
            result={result}
            loading={loading}
            selectedJobId={selectedJobId}
            onSaveCandidates={handleSaveCandidates}
            savingCandidates={savingCandidates}
            savedCount={savedCount}
            saveError={saveError}
          />

        </div>
      </div>
    </div>
  );
}