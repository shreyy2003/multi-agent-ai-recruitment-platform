export function Section({ title, content }) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-3">
        {title}
      </h3>

      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
        <p className="text-gray-300 whitespace-pre-line leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
}

export function ListSection({ title, items }) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-3">
        {title}
      </h3>

      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5">
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-gray-300"
            >
              <span className="mt-2 w-2 h-2 rounded-full bg-cyan-400 shrink-0" />

              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}