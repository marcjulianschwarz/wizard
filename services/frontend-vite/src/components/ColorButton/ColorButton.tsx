interface ColorButtonProps {
  color: "red" | "blue" | "yellow" | "green";
  selected?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
};

export default function ColorButton({
  color,
  selected = false,
  onClick,
}: ColorButtonProps) {
  return (
    <div
      className={`
        w-[50px] h-[50px] rounded-xl cursor-pointer
        transition-all duration-200
        hover:scale-[1.02]
        hover:shadow-[0_0_0_2px_rgb(243,243,243),0_0_50px_rgba(255,255,255,0.5)]
        ${colorClasses[color]}
        ${selected ? "shadow-[0_0_0_2px_rgb(243,243,243),0_0_50px_rgba(255,255,255,0.5)]" : ""}
      `}
      onClick={onClick}
    />
  );
}
