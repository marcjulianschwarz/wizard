import { type CardColor } from "@/api/entities";

const COLORS: { value: CardColor; label: string; swatch: string }[] = [
  { value: "green", label: "Grün", swatch: "bg-green-500" },
  { value: "blue", label: "Blau", swatch: "bg-blue-500" },
  { value: "red", label: "Rot", swatch: "bg-red-500" },
  { value: "yellow", label: "Gelb", swatch: "bg-yellow-400" },
];

function ColorRow(props: {
  title: string;
  selected?: CardColor;
  onSelect: (color: CardColor) => void;
}) {
  const { title, selected, onSelect } = props;

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs uppercase tracking-wider text-neutral-500">
        {title}
      </span>
      <div className="flex gap-1.5">
        {COLORS.map((color) => {
          const isSelected = selected === color.value;
          return (
            <button
              key={color.value}
              onClick={() => onSelect(color.value)}
              aria-label={color.label}
              className={`relative h-8 w-8 rounded-lg ${color.swatch} transition-all duration-150 hover:scale-105 ${
                isSelected
                  ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 shadow-[0_0_16px_-2px_rgba(255,255,255,0.5)]"
                  : "opacity-60 hover:opacity-100"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function CardColorSelector(props: {
  trump?: CardColor;
  condition?: CardColor;
  onSelectTrump: (color: CardColor) => void;
  onSelectCondition: (color: CardColor) => void;
  // When true, drop the card chrome so it can sit inside another card.
  bare?: boolean;
}) {
  const { trump, condition, onSelectTrump, onSelectCondition, bare } = props;

  return (
    <div
      className={`flex flex-col gap-2 ${
        bare ? "" : "p-4 bg-neutral-900 rounded-xl border border-neutral-800"
      }`}
    >
      <ColorRow title="Trumpf" selected={trump} onSelect={onSelectTrump} />
      <ColorRow
        title="Bedienung"
        selected={condition}
        onSelect={onSelectCondition}
      />
    </div>
  );
}
