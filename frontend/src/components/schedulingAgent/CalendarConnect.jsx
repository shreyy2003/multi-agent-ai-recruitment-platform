import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader, Calendar } from "lucide-react";

const PROVIDERS = [
  {
    key: "google",
    label: "Google Calendar",
    icon: "🗓️",
    hint: "Connects via Google OAuth. A browser window will open to sign in.",
  },
  {
    key: "outlook",
    label: "Outlook / Microsoft 365",
    icon: "📅",
    hint: "Connects via device code flow. Check the backend console for a login code.",
  },
];

export default function CalendarConnect({ selectedProvider, setSelectedProvider }) {
  const [status, setStatus] = useState({ google: false, outlook: false });
  const [connecting, setConnecting] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:8000/agent/scheduling/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      // backend not yet running — silently ignore
    }
  };

  const handleConnect = async (provider) => {
    setConnecting(provider);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:8000/agent/scheduling/connect/${provider}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Connection failed");
      setStatus((prev) => ({ ...prev, [provider]: true }));
      setSelectedProvider(provider);
    } catch (e) {
      setError(`Failed to connect ${provider}. Check backend console.`);
    } finally {
      setConnecting("");
    }
  };

  const handleDisconnect = async (provider) => {
    setConnecting(provider);
    setError("");
    try {
      await fetch(
        `http://localhost:8000/agent/scheduling/disconnect/${provider}`,
        { method: "POST" }
      );
      setStatus((prev) => ({ ...prev, [provider]: false }));
      if (selectedProvider === provider) setSelectedProvider("");
    } catch {
      setError("Failed to disconnect. Try again.");
    } finally {
      setConnecting("");
    }
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-violet-300">
          Calendar Connection *
        </h3>
      </div>

      <p className="text-xs text-gray-500">
        Connect your calendar so the agent can find your free slots automatically.
        Select the provider you use.
      </p>

      <div className="space-y-3">
        {PROVIDERS.map((p) => {
          const isConnected = status[p.key];
          const isSelected = selectedProvider === p.key;
          const isLoading = connecting === p.key;

          return (
            <div
              key={p.key}
              onClick={() => isConnected && setSelectedProvider(p.key)}
              className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
                isSelected
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-gray-700 bg-[#0B1120] hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{p.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.hint}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {isConnected ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Connected</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnect(p.key);
                        }}
                        disabled={isLoading}
                        className="ml-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
                      >
                        {isLoading ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          "Disconnect"
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(p.key);
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        "Connect"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="mt-2 pt-2 border-t border-violet-500/20">
                  <p className="text-xs text-violet-300 font-medium">
                    ✓ This calendar will be used to find free slots
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}