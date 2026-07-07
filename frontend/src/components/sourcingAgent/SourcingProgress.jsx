export default function SourcingProgress({
  currentStep,
  stepMessage,
  steps,
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
      <p className="text-sm text-gray-400">{stepMessage}</p>

      <div className="space-y-2">
        {steps.map((label, i) => {
          const stepNum = i + 1;

          const done = stepNum < currentStep;
          const active = stepNum === currentStep;

          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                  done
                    ? "bg-emerald-500"
                    : active
                    ? "bg-violet-500 animate-pulse"
                    : "bg-gray-700"
                }`}
              />

              <span
                className={`text-xs transition-colors ${
                  done
                    ? "text-emerald-400"
                    : active
                    ? "text-violet-300"
                    : "text-gray-600"
                }`}
              >
                {label}
              </span>

              {done && (
                <span className="text-emerald-500 text-xs ml-auto">
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}