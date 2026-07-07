import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";

import SubmissionInputPanel   from "../components/submissionAgent/SubmissionInputPanel";
import SubmissionGenerateButton from "../components/submissionAgent/SubmissionGenerateButton";
import SubmissionResultsPanel from "../components/submissionAgent/SubmissionResultsPanel";

export default function SubmissionAgentPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    candidate_name: "",
    role: "",
    client_name: "",
    client_contact_email: "",
    domain: "",
    additional_notes: "",
    cv_file: null,
    debrief_file: null,
  });

  const [draft,        setDraft]        = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error,        setError]        = useState("");

  // Pipeline state
  const [jobs,           setJobs]           = useState([]);
  const [candidates,     setCandidates]     = useState([]);
  const [selectedJobId,  setSelectedJobId]  = useState("");
  const [selectedCandId, setSelectedCandId] = useState("");
  const [cvFromPipeline,     setCvFromPipeline]     = useState(false);
  const [debriefFromPipeline, setDebriefFromPipeline] = useState(false);

  // Load open jobs on mount
  useEffect(() => {
    fetch("http://localhost:8000/pipeline/jobs?status=open")
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => {});
  }, []);

  // When job selected — load candidates
  const handleJobSelect = async (jobId) => {
    setSelectedJobId(jobId);
    setSelectedCandId("");
    setCandidates([]);
    setCvFromPipeline(false);
    setDebriefFromPipeline(false);
    setForm((prev) => ({ ...prev, candidate_name: "", role: "", domain: "", cv_file: null, debrief_file: null }));

    if (!jobId) return;

    try {
      const jobRes  = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}`);
      const jobData = await jobRes.json();
      setForm((prev) => ({
        ...prev,
        role:   jobData.structured_jd?.job_title || jobData.job_title || "",
        domain: jobData.domain || "",
      }));

      const candRes  = await fetch(`http://localhost:8000/pipeline/jobs/${jobId}/candidates`);
      const candData = await candRes.json();
      setCandidates(candData);
    } catch (e) {
      console.error("Failed to load pipeline job:", e);
    }
  };

  // When candidate selected — auto-fill name + fetch CV + debrief
  const handleCandidateSelect = async (candidateId) => {
    setSelectedCandId(candidateId);
    setCvFromPipeline(false);
    setDebriefFromPipeline(false);
    setForm((prev) => ({ ...prev, candidate_name: "", cv_file: null, debrief_file: null }));

    if (!candidateId) return;

    const candidate = candidates.find((c) => c.candidate_id === candidateId);
    if (candidate) {
      setForm((prev) => ({ ...prev, candidate_name: candidate.name || "" }));
    }

    // Fetch full candidate record to check cv_file_ref and stage5_debrief
    try {
      const res  = await fetch(`http://localhost:8000/pipeline/candidates/${candidateId}`);
      const data = await res.json();

      // Auto-load CV from pipeline if stored
      if (data.cv_file_ref) {
        const cvRes  = await fetch(`http://localhost:8000/pipeline/candidates/${candidateId}/cv`);
        const cvBlob = await cvRes.blob();
        const filename = data.cv_file_ref.split(/[\\/]/).pop();
        const cvFile = new File([cvBlob], filename, { type: cvBlob.type });
        setForm((prev) => ({ ...prev, cv_file: cvFile }));
        setCvFromPipeline(true);
      }

      // Auto-load debrief PDF from pipeline if stored
      if (data.stage5_debrief) {
        const debriefRes  = await fetch(`http://localhost:8000/pipeline/candidates/${candidateId}/debrief-pdf`);
        const debriefBlob = await debriefRes.blob();
        const candName    = (candidate?.name || "candidate").replace(/ /g, "_");
        const debriefFile = new File([debriefBlob], `debrief_${candName}.pdf`, { type: "application/pdf" });
        setForm((prev) => ({ ...prev, debrief_file: debriefFile }));
        setDebriefFromPipeline(true);
      }

    } catch (e) {
      console.error("Failed to load candidate files:", e);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isFormValid = () =>
    form.candidate_name.trim() &&
    form.role.trim() &&
    form.client_name.trim() &&
    form.client_contact_email.trim() &&
    form.domain &&
    form.cv_file;

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("candidate_name",       form.candidate_name);
    fd.append("role",                 form.role);
    fd.append("client_name",          form.client_name);
    fd.append("client_contact_email", form.client_contact_email);
    fd.append("domain",               form.domain);
    if (form.additional_notes) fd.append("additional_notes", form.additional_notes);
    fd.append("cv_file", form.cv_file);
    if (form.debrief_file) fd.append("debrief_file", form.debrief_file);
    return fd;
  };

  const handleGenerate = async () => {
    if (!form.candidate_name.trim())       { setError("Candidate name is required."); return; }
    if (!form.role.trim())                 { setError("Role / Job title is required."); return; }
    if (!form.client_name.trim())          { setError("Client company name is required."); return; }
    if (!form.client_contact_email.trim()) { setError("Client contact email is required."); return; }
    if (!form.domain)                      { setError("Please select a domain."); return; }
    if (!form.cv_file)                     { setError("Candidate CV is required."); return; }

    setError("");
    setLoading(true);
    setDraft(null);

    try {
      const res = await fetch("http://localhost:8000/submission/generate-draft", {
        method: "POST",
        body: buildFormData(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to generate draft.");
      }
      setDraft(await res.json());
    } catch (err) {
      setError(err.message || "Failed to connect to backend. Make sure it's running.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!isFormValid()) return;
    setError("");
    setRegenerating(true);
    try {
      const res = await fetch("http://localhost:8000/submission/generate-draft", {
        method: "POST",
        body: buildFormData(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to regenerate.");
      }
      setDraft(await res.json());
    } catch (err) {
      setError(err.message || "Failed to regenerate. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleSend = async ({ subject, body }) => {
    const fd = new FormData();
    fd.append("subject",              subject);
    fd.append("body",                 body);
    fd.append("client_contact_email", form.client_contact_email);
    fd.append("candidate_name",       form.candidate_name);
    fd.append("role",                 form.role);
    fd.append("client_name",          form.client_name);
    fd.append("cv_file",              form.cv_file);
    if (form.debrief_file) fd.append("debrief_file", form.debrief_file);

    const res = await fetch("http://localhost:8000/submission/approve-send", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to send email.");
    }

    // Update candidate status to submitted in pipeline
    if (selectedCandId) {
      await fetch(`http://localhost:8000/pipeline/candidates/${selectedCandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      }).catch(() => {});
    }

    return await res.json();
  };

  const handleReset = () => {
    setDraft(null);
    setForm({
      candidate_name: "", role: "", client_name: "",
      client_contact_email: "", domain: "", additional_notes: "",
      cv_file: null, debrief_file: null,
    });
    setError("");
    setSelectedCandId("");
    setCvFromPipeline(false);
    setDebriefFromPipeline(false);
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
              <Send className="w-4 h-4" />
              Stage 6 — Candidate Submission Agent
            </div>
            <h1 className="text-5xl font-bold">Candidate Submission</h1>
            <p className="text-gray-400 text-lg mt-4 max-w-3xl">
              Upload the candidate's CV and optionally a debrief summary. The agent
              generates a professional submission email for the client, which you
              can review, edit, and send with one click.
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
            <SubmissionInputPanel
              form={form}
              setForm={setForm}
              handleChange={handleChange}
              jobs={jobs}
              candidates={candidates}
              selectedJobId={selectedJobId}
              selectedCandId={selectedCandId}
              onJobSelect={handleJobSelect}
              onCandidateSelect={handleCandidateSelect}
              cvFromPipeline={cvFromPipeline}
              debriefFromPipeline={debriefFromPipeline}
            />

            <SubmissionGenerateButton
              loading={loading}
              handleGenerate={handleGenerate}
              hasResult={!!draft}
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
          </div>

          <SubmissionResultsPanel
            draft={draft}
            loading={loading}
            regenerating={regenerating}
            onRegenerate={handleRegenerate}
            onSend={handleSend}
            onReset={handleReset}
          />

        </div>
      </div>
    </div>
  );
}