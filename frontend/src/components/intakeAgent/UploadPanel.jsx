import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function UploadPanel({
  selectedFile,
  jdText,
  setJdText,
  loading,
  error,
  handleFileChange,
  handleUpload,
}) {

  return (
    <div className="lg:col-span-1">

      <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6">

        <div className="flex items-center gap-3 mb-6">

          <Upload className="w-6 h-6 text-cyan-400" />

          <h2 className="text-2xl font-semibold text-white">
            Upload Job Description
          </h2>

        </div>

        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 bg-[#0B1120] hover:border-cyan-500 transition-all duration-200">

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className="cursor-pointer text-center block"
          >

            <Upload className="mx-auto w-14 h-14 text-gray-500 mb-4" />

            <p className="text-lg font-medium text-white">
              Click to Upload JD
            </p>

            <p className="text-sm text-gray-400 mt-2">
              PDF or DOCX only
            </p>

          </label>

          <div className="mt-6">

            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Or Paste Job Description
            </label>

            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste raw job description here..."
              rows={10}
              className="w-full bg-[#111827] border border-gray-700 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />

          </div>
        </div>

        {selectedFile && (

          <div className="mt-5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 flex items-center gap-3">

            <FileText className="w-5 h-5 text-cyan-400" />

            <div>
              <p className="font-medium text-white">
                {selectedFile.name}
              </p>

              <p className="text-sm text-gray-400">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>

          </div>
        )}

        {error && (

          <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">

            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />

            <p className="text-red-200 text-sm">
              {error}
            </p>

          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 text-black py-3 rounded-2xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3"
        >

          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Generate Intake Documents
            </>
          )}

        </button>

        <div className="mt-8 bg-[#0B1120] rounded-2xl p-5 border border-gray-800">

          <h3 className="font-semibold text-white mb-4">
            Features Included
          </h3>

          <ul className="space-y-2 text-sm text-gray-400">

            <li>• AI-powered JD parsing</li>

            <li>• Skills & requirement extraction</li>

            <li>• Hiring context analysis</li>

            <li>• Auto-reject disqualifiers</li>

            <li>• Pre-screening questions</li>

            <li>• Candidate scorecards</li>

            <li>• PDF/DOCX export support</li>

          </ul>
        </div>

      </div>
    </div>
  );
}

export default UploadPanel;