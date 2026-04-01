"use client";

interface FlagToggleButtonProps {
  flagged: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export default function FlagToggleButton({ flagged, disabled = false, onToggle }: FlagToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={flagged}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        flagged
          ? "border-warning bg-warning/15 text-foreground"
          : "border-foreground/10 bg-white text-text-secondary hover:border-warning/60 hover:text-foreground"
      }`}
    >
      <span className="text-xs uppercase tracking-[0.2em]">{flagged ? "Flagged" : "Flag"}</span>
    </button>
  );
}
