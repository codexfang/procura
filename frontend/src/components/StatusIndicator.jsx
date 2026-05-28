export default function StatusIndicator({ backendOnline }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span
        className={`w-2 h-2 rounded-full ${
          backendOnline ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span>
        {backendOnline ? "Connected" : "Offline — using cached data"}
      </span>
    </div>
  );
}
