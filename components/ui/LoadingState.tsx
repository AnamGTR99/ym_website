interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      {label && (
        <p className="text-xs font-mono text-zinc-600 mt-3 uppercase tracking-wider">
          {label}
        </p>
      )}
    </div>
  );
}
