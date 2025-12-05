import Button from "@/components/Button/Button";
import ColorButton from "@/components/ColorButton/ColorButton";

interface TrumpCardSelectionProps {
  handleColorClick?: (color: string, card: string) => void;
  selectedTrump?: string;
  selectedConstraint?: string;
  onComplete?: () => void;
}

export default function TrumpCardSelectionView({
  handleColorClick,
  selectedTrump,
  selectedConstraint,
  onComplete,
}: TrumpCardSelectionProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Kartenwahl</h2>
      </div>

      <div className="flex justify-around flex-wrap gap-20 mb-10">
        <div className="flex flex-col items-center gap-3">
          <p className="text-white">Trumpf</p>
          <div className="grid grid-cols-[50px_50px] gap-2.5">
            <ColorButton
              color="green"
              selected={selectedTrump === "greentrump"}
              onClick={() => handleColorClick?.("green", "trump")}
            />
            <ColorButton
              color="blue"
              selected={selectedTrump === "bluetrump"}
              onClick={() => handleColorClick?.("blue", "trump")}
            />
            <ColorButton
              color="red"
              selected={selectedTrump === "redtrump"}
              onClick={() => handleColorClick?.("red", "trump")}
            />
            <ColorButton
              color="yellow"
              selected={selectedTrump === "yellowtrump"}
              onClick={() => handleColorClick?.("yellow", "trump")}
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-white">Bedienung</p>
          <div className="grid grid-cols-[50px_50px] gap-2.5">
            <ColorButton
              color="green"
              selected={selectedConstraint === "greenconstraint"}
              onClick={() => handleColorClick?.("green", "constraint")}
            />
            <ColorButton
              color="blue"
              selected={selectedConstraint === "blueconstraint"}
              onClick={() => handleColorClick?.("blue", "constraint")}
            />
            <ColorButton
              color="red"
              selected={selectedConstraint === "redconstraint"}
              onClick={() => handleColorClick?.("red", "constraint")}
            />
            <ColorButton
              color="yellow"
              selected={selectedConstraint === "yellowconstraint"}
              onClick={() => handleColorClick?.("yellow", "constraint")}
            />
          </div>
        </div>
      </div>
      <Button onClick={onComplete} className="bg-blue-500 w-fit">
        Weiter →
      </Button>
    </div>
  );
}
