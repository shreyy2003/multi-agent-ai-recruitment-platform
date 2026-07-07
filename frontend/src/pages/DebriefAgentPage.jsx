import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList } from "lucide-react";

import DebriefInputPanel from "../components/debriefAgent/DebriefInputPanel";
import DebriefGenerateButton from "../components/debriefAgent/DebriefGenerateButton";
import DebriefResultsPanel from "../components/debriefAgent/DebriefResultsPanel";

export default function DebriefAgentPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    candidate_name: "",
    job_title: "",
    interviewer_name: "",
    jd_text: "",
    jd_file: null,
    transcript_file: null,
    resume_file: null,
  });

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Pipeline state
  const [jobs,             setJobs]             = useState([]);
  const [candidates,       setCandidates]       = useState([]);
  const [selectedJobId,    setSelectedJobId]    = useState("");
  const [selectedCandId,   setSelectedCandId]   = useState("");
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);
  const [saveError,        setSaveError]        = useState("");

  // Load open jobs on mount
  useEffect(() => {
    fetch("http://localhost:8000/pipeline/jobs?status=open")
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => {});
  }, []);

  // When job selected — auto-fill JD text + load candidates
  const handleJobSelect = async (jobId) => {
    setSelectedJobId(jobId);
    setSelectedCandId("");
    setCandidates([]);
    setSaved(false);
    setForm((prev) => ({ ...prev, job_title: "", candidate_name: "", jd_text: "" }));

    if (!jobId) return;

    try {
      const jobRes  = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}`);
      const jobData = await jobRes.json();

      // Build readable JD text from structured_jd
      const intake  = jobData.structured_jd?.intake_document || {};
      const jdText  = [
        jobData.structured_jd?.job_title || "",
        intake.role_overview || "",
        "Must Have:\n" + (intake.must_have_requirements?.join("\n") || ""),
        "Nice To Have:\n" + (intake.nice_to_have_requirements?.join("\n") || ""),
      ].filter(Boolean).join("\n\n");

      setForm((prev) => ({
        ...prev,
        job_title: jobData.structured_jd?.job_title || jobData.job_title || "",
        jd_text:   jdText,
      }));

      const candRes  = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}/candidates`);
      const candData = await candRes.json();
      setCandidates(candData);

    } catch (e) {
      console.error("Failed to load pipeline data:", e);
    }
  };

  // When candidate selected — auto-fill name
  const handleCandidateSelect = (candidateId) => {
    setSelectedCandId(candidateId);
    setSaved(false);
    if (!candidateId) {
      setForm((prev) => ({ ...prev, candidate_name: "" }));
      return;
    }
    const candidate = candidates.find((c) => c.candidate_id === candidateId);
    if (!candidate) return;
    setForm((prev) => ({ ...prev, candidate_name: candidate.name || "" }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!form.candidate_name.trim()) { setError("Candidate name is required."); return; }
    if (!form.job_title.trim())      { setError("Job title is required."); return; }
    if (!form.interviewer_name.trim()) { setError("Interviewer name is required."); return; }
    if (!form.jd_text.trim() && !form.jd_file) { setError("Provide either a JD text or upload a JD file."); return; }
    if (!form.transcript_file) { setError("Transcript file is required."); return; }

    setError("");
    setLoading(true);
    setResult(null);
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append("candidate_name",   form.candidate_name);
      formData.append("job_title",        form.job_title);
      formData.append("interviewer_name", form.interviewer_name);
      formData.append("jd_text",          form.jd_text);
      if (form.jd_file)        formData.append("jd_file",        form.jd_file);
      formData.append("transcript_file",  form.transcript_file);
      if (form.resume_file)    formData.append("resume_file",    form.resume_file);

      const res = await fetch("http://localhost:8000/agent/debrief", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to generate debrief.");
      }

      const data = await res.json();
      setResult(data);

    } catch (err) {
      setError(err.message || "Failed to connect to backend. Make sure it's running.");
    } finally {
      setLoading(false);
    }
  };

  // Save debrief + resume ref to pipeline
  const handleSaveToPipeline = async () => {
    if (!selectedCandId || !result) return;

    setSaving(true);
    setSaveError("");

    try {
      // Upload resume to backend storage if provided and get a ref
      let cvFileRef = null;
      if (form.resume_file) {
        const uploadData = new FormData();
        uploadData.append("resume_file", form.resume_file);
        uploadData.append("candidate_id", selectedCandId);

        const uploadRes = await fetch("http://localhost:8000/pipeline/upload-resume", {
          method: "POST",
          body: uploadData,
        });

        if (uploadRes.ok) {
          const uploadData2 = await uploadRes.json();
          cvFileRef = uploadData2.file_ref;
        }
      }

      // Save debrief + status + cv_file_ref to candidate record
      const updates = {
        stage5_debrief: result,
        status: "interviewed",
        ...(cvFileRef && { cv_file_ref: cvFileRef }),
      };

      await fetch(`http://localhost:8000/pipeline/candidates/${selectedCandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      setSaved(true);

    } catch (e) {
      setSaveError("Failed to save to pipeline. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setForm({
      candidate_name: "",
      job_title: "",
      interviewer_name: "",
      jd_text: "",
      jd_file: null,
      transcript_file: null,
      resume_file: null,
    });
    setError("");
    setSaved(false);
    setSaveError("");
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
              <ClipboardList className="w-4 h-4" />
              Stage 5 — Interview Debrief Agent
            </div>
            <h1 className="text-5xl font-bold">Post-Interview Debrief</h1>
            <p className="text-gray-400 text-lg mt-4 max-w-3xl">
              Upload the interview transcript, job description, and optionally
              the candidate's resume. The agent evaluates fit, highlights
              strengths and risks, and gives a final hiring recommendation.
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
            <DebriefInputPanel
              form={form}
              setForm={setForm}
              handleChange={handleChange}
              jobs={jobs}
              candidates={candidates}
              selectedJobId={selectedJobId}
              selectedCandId={selectedCandId}
              onJobSelect={handleJobSelect}
              onCandidateSelect={handleCandidateSelect}
            />

            <DebriefGenerateButton
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

          <div className="space-y-6">
            <DebriefResultsPanel
              result={result}
              loading={loading}
              handleReset={handleReset}
              selectedCandId={selectedCandId}
              onSaveToPipeline={handleSaveToPipeline}
              saving={saving}
              saved={saved}
              saveError={saveError}
            />
          </div>

        </div>
      </div>
    </div>
  );
}