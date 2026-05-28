export default function DraftSection({ heading, content, onChange }) {
  return (
    <div className="card p-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">{heading}</h4>
      <textarea
        className="input-field min-h-[100px] resize-y text-sm"
        value={content}
        onChange={(e) => onChange?.(heading, e.target.value)}
        placeholder={`Write ${heading.toLowerCase()} content...`}
      />
    </div>
  );
}
