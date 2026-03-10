interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message,
  retry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-full border-2 border-red-800 flex items-center justify-center mb-4">
        <span className="text-red-400 text-xl">!</span>
      </div>
      <h2 className="text-lg font-bold text-white mb-1">{title}</h2>
      {message && (
        <p className="text-sm text-zinc-500 text-center max-w-sm">{message}</p>
      )}
      {retry && (
        <button
          onClick={retry}
          className="mt-4 px-5 py-2 border border-zinc-700 rounded text-sm text-zinc-300 hover:border-white hover:text-white transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
