import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode | React.ReactNode[];
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  className = "",
  children,
  leftIcon,
  rightIcon,
  ...buttonProps
}: ButtonProps) {
  const baseClasses =
    "px-4 py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 disabled:text-white transition-colors cursor-pointer";

  return (
    <button {...buttonProps} className={`${baseClasses} ${className}`.trim()}>
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
