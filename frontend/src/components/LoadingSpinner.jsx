export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-gov-600 border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  );
}
