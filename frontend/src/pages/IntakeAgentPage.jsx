import { useState } from "react";
import axios from "axios";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import UploadPanel from "../components/intakeAgent/UploadPanel";
import ResultsPanel from "../components/intakeAgent/ResultsPanel";

function IntakeAgentPage() {

  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState("docx");

  // Pipeline save state
  const [saving, setSaving] = useState(false);
  const [savedJobId, setSavedJobId] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    setError("");
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile && !jdText.trim()) {
      setError("Please upload a JD file or paste JD text.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setResponse(null);
      setSavedJobId(null);
      setSaveError("");
      setSelectedDomain("");

      const formData = new FormData();
      if (selectedFile) formData.append("file", selectedFile);
      if (jdText.trim()) formData.append("jd_text", jdText);

      const res = await axios.post(
        "http://localhost:8000/agent/intake",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResponse(res.data);

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Something went wrong while generating intake documents."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const endpoint =
        downloadFormat === "pdf"
          ? "http://localhost:8000/agent/export/pdf"
          : "http://localhost:8000/agent/export/docx";

      const res = await axios.post(
        endpoint,
        { report_data: response },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `intake_report.${downloadFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report.");
    }
  };

  // job_title comes directly from AI response — no manual input needed
  const handleSaveToPipeline = async () => {
    if (!response || !selectedDomain) return;

    try {
      setSaving(true);
      setSaveError("");

      const res = await axios.post(
        "http://localhost:8000/agent/intake/save-to-pipeline",
        {
          job_title: response.job_title,
          structured_jd: response,
          domain: selectedDomain,
        }
      );

      setSavedJobId(res.data.job_id);

    } catch (err) {
      console.error("Save to pipeline failed:", err);
      setSaveError(
        err.response?.data?.detail || "Failed to save to pipeline."
      );
    } finally {
      setSaving(false);
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
              <ClipboardCheck className="w-4 h-4" />
              Stage 1 — Client Intake Agent
            </div>
            <h1 className="text-5xl font-bold">Recruitment Intake Agent</h1>
            <p className="text-gray-400 text-lg mt-4 max-w-3xl">
              AI-powered intake workflow automation and JD intelligence system.
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

        <div className="grid lg:grid-cols-3 gap-6">

          <UploadPanel
            selectedFile={selectedFile}
            jdText={jdText}
            setJdText={setJdText}
            loading={loading}
            error={error}
            handleFileChange={handleFileChange}
            handleUpload={handleUpload}
          />

          <ResultsPanel
            response={response}
            downloadFormat={downloadFormat}
            setDownloadFormat={setDownloadFormat}
            handleDownload={handleDownload}
            handleSaveToPipeline={handleSaveToPipeline}
            saving={saving}
            savedJobId={savedJobId}
            saveError={saveError}
            selectedDomain={selectedDomain}
            setSelectedDomain={setSelectedDomain}
          />

        </div>
      </div>
    </div>
  );
}

export default IntakeAgentPage;