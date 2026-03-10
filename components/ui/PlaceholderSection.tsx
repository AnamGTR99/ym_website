interface PlaceholderSectionProps {
  label: string;
  asset?: string;
  dimensions?: string;
  behavior?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function PlaceholderSection({
  label,
  asset,
  dimensions,
  behavior,
  children,
  className = "",
}: PlaceholderSectionProps) {
  return (
    <div
      className={`border border-dashed border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
        Placeholder
      </p>
      <h3 className="text-lg md:text-xl font-bold uppercase tracking-wider text-white text-center">
        {label}
      </h3>
      {asset && (
        <p className="text-sm font-mono text-amber-400/80">
          Asset: {asset}
        </p>
      )}
      {dimensions && (
        <p className="text-xs font-mono text-zinc-400">{dimensions}</p>
      )}
      {behavior && (
        <p className="text-xs font-mono text-cyan-400/70">
          Behavior: {behavior}
        </p>
      )}
      {children}
    </div>
  );
}
