interface NumberPadProps {
  onNumberClick: (number: string) => void;
  onClear: () => void;
  onBackspace: () => void;
}

export default function NumberPad({
  onNumberClick,
  onClear,
  onBackspace,
}: NumberPadProps) {
  return (
    <div className="mb-3 grid grid-cols-3 gap-2 md:mb-6 md:gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          onClick={() => onNumberClick(num.toString())}
          className="h-12 rounded-xl border border-neutral-700 bg-neutral-800 text-xl font-medium text-white transition-all duration-150 hover:bg-neutral-700 active:scale-95 active:bg-neutral-600 sm:h-14 md:h-16"
        >
          {num}
        </button>
      ))}

      {/* Bottom row */}
      <button
        onClick={onClear}
        className="h-12 rounded-xl border border-neutral-700 bg-neutral-800 font-medium text-red-500 transition-all duration-150 hover:bg-red-900/30 active:scale-95 active:bg-red-900/50 sm:h-14 md:h-16"
      >
        <svg
          className="w-5 h-5 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      <button
        onClick={() => onNumberClick("0")}
        className="h-12 rounded-xl border border-neutral-700 bg-neutral-800 text-xl font-medium text-white transition-all duration-150 hover:bg-neutral-700 active:scale-95 active:bg-neutral-600 sm:h-14 md:h-16"
      >
        0
      </button>

      <button
        onClick={onBackspace}
        className="h-12 rounded-xl border border-neutral-700 bg-neutral-800 font-medium text-amber-500 transition-all duration-150 hover:bg-amber-900/30 active:scale-95 active:bg-amber-900/50 sm:h-14 md:h-16"
      >
        <svg
          className="w-5 h-5 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
          />
        </svg>
      </button>
    </div>
  );
}
