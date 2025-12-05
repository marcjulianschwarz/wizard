interface DividerProps {
  text?: string;
}

export default function Divider({ text }: DividerProps) {
  return (
    <div className="flex items-center justify-center relative text-neutral-400 mt-5 mb-5 before:content-[''] before:flex-1 before:h-px before:bg-neutral-400 after:content-[''] after:flex-1 after:h-px after:bg-neutral-400">
      <span className="pr-5 pl-5 font-medium tracking-wide">
        {text?.toUpperCase()}
      </span>
    </div>
  );
}
