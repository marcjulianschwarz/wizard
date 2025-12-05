import { type InputHTMLAttributes, type RefObject } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: RefObject<HTMLInputElement | null>;
  highlightOnFocus?: boolean;
}

export default function Input({
  className = "",
  ref,
  highlightOnFocus = true,
  ...inputProps
}: InputProps) {
  const focusClass = highlightOnFocus
    ? "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
    : "";
  return (
    <input
      ref={ref}
      {...inputProps}
      // font size is set to 16px here because this is the minimum font-size for iOS not to zoom into search bars.
      className={`w-full  pr-4 pl-4 py-3 text-[16px] border border-neutral-400 rounded-lg bg-neutral-800 ${focusClass} ${className}`}
    ></input>
  );
}
