import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  CheckCircle,
  Loader2,
  FileText,
  Edit3,
  Check,
  RotateCcw,
  Inbox,
} from "lucide-react";

export default function SubmissionResultsPanel({
  draft,
  loading,
  regenerating,
  onRegenerate,
  onSend,
  onReset,
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [editingSubject, setEditingSubject] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Sync editable fields when a new draft arrives
  useEffect(() => {
    if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
      setSent(false);
    }
  }, [draft]);

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend({ subject, body });
      setSent(true);
    } catch (err) {
      // error bubbles up to page if needed
    } finally {
      setSending(false);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!draft && !loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-4 p-12 text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center">
          <Inbox className="w-7 h-7 text-violet-400" />
        </div>
        <div>
          <p className="text-white font-semibold">No draft yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details and generate a submission email to preview it here.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-4 p-12 text-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-gray-400 text-sm">Generating submission email...</p>
      </div>
    );
  }

  // ── Sent state ─────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="bg-[#111827] border border-green-500/30 rounded-2xl flex flex-col items-center justify-center gap-5 p-12 text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Submission Sent!</p>
          <p className="text-gray-400 text-sm mt-1">
            Email delivered to{" "}
            <span className="text-violet-300">{draft.client_contact_email}</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 bg-[#0B1120] border border-gray-700 rounded-lg px-3 py-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-gray-300">{draft.cv_filename}</span>
            </div>
            {draft.debrief_filename && (
              <div className="flex items-center gap-1.5 bg-[#0B1120] border border-gray-700 rounded-lg px-3 py-1.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-gray-300">{draft.debrief_filename}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-xl transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Start New Submission
        </button>
      </div>
    );
  }

  // ── Draft preview ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 space-y-4">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Preview
          </h3>
          <span className="text-xs text-gray-500 bg-gray-800/60 px-2 py-1 rounded-lg">
            Review & edit before sending
          </span>
        </div>

        {/* To */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 text-xs w-12">To:</span>
          <span className="text-gray-300">{draft.client_contact_email}</span>
        </div>

        {/* Subject */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 w-12">Subject</span>
            <button
              onClick={() => setEditingSubject(!editingSubject)}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              {editingSubject ? <><Check className="w-3 h-3" />Done</> : <><Edit3 className="w-3 h-3" />Edit</>}
            </button>
          </div>
          {editingSubject ? (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#0B1120] border border-violet-500/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400"
            />
          ) : (
            <p className="text-sm text-white bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-2.5">
              {subject}
            </p>
          )}
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Body</span>
            <span className="text-xs text-gray-600">Editable</span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="w-full bg-[#0B1120] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4">
        <p className="text-xs text-gray-500 mb-2">Attachments</p>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-[#0B1120] border border-gray-700 rounded-lg px-3 py-1.5">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-gray-300">{draft.cv_filename}</span>
          </div>
          {draft.debrief_filename && (
            <div className="flex items-center gap-1.5 bg-[#0B1120] border border-gray-700 rounded-lg px-3 py-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-gray-300">{draft.debrief_filename}</span>
            </div>
          )}
        </div>
      </div>

      {/* Approve & Send */}
      <button
        onClick={handleSend}
        disabled={sending || regenerating}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20"
      >
        {sending ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
        ) : (
          <><Send className="w-4 h-4" />Approve & Send to Client</>
        )}
      </button>

    </div>
  );
}