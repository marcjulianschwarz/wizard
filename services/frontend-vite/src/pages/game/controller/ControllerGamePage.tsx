import { useSocket } from "@/api/hooks";
import { useState } from "react";
import ControllerRoundInfo from "@/components/RoundInfo/ControllerRoundInfo";
import { useParams } from "react-router";
import PlayerOrderingView from "./views/PlayerOrderingView";
import FortuneWheelView from "./views/FortuneWheelView";
import PredictedHitsView from "./views/PredictedHitsView";
import ActualHitsView from "./views/ActualHitsView";
import FinalView from "./views/FinalView";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  ListOrdered,
  Sparkles,
  Trophy,
  Megaphone,
  Play,
  MonitorOff,
} from "lucide-react";

// The ordered phases of a round. `first` steps only run before round 1.
const STEPS = [
  { key: "order", label: "Reihenfolge", icon: ListOrdered, firstRoundOnly: true },
  { key: "wheel", label: "Glücksrad", icon: Sparkles, firstRoundOnly: true },
  { key: "pred", label: "Ansagen", icon: Megaphone, firstRoundOnly: false },
  { key: "made", label: "Stiche", icon: Trophy, firstRoundOnly: false },
] as const;

export default function ControllerGamePage() {
  const { gameCode } = useParams();
  const { game, updateGame } = useSocket(gameCode);
  useDocumentTitle("Controller");

  const [currentPage, setCurrentPage] = useState(0);

  function handleNextPage() {
    if (currentPage < pages.length - 1) {
      setCurrentPage((currentPage) => currentPage + 1);
    }
  }

  function toggleTurnOverlay(kind: "predict" | "play") {
    if (!game) return;
    // Toggle off if this kind is already showing, otherwise show it.
    const next =
      game.state.turnOverlay?.kind === kind ? undefined : { kind };
    updateGame({
      ...game,
      state: { ...game.state, turnOverlay: next },
    });
  }

  // Manually toggle the dashboard's welcome screen. Showing it also clears any
  // active wheel so the two full-screen overlays never stack.
  function toggleWelcome() {
    if (!game) return;
    const show = !game.state.showWelcome;
    updateGame({
      ...game,
      state: {
        ...game.state,
        showWelcome: show,
        setupBlackout: show ? false : game.state.setupBlackout,
        fortuneWheel: show ? undefined : game.state.fortuneWheel,
      },
    });
  }

  // Manually toggle a full black-out of the dashboard.
  function toggleBlackout() {
    if (!game) return;
    const show = !game.state.setupBlackout;
    updateGame({
      ...game,
      state: {
        ...game.state,
        setupBlackout: show,
        showWelcome: show ? false : game.state.showWelcome,
      },
    });
  }

  function handleRoundDonePage() {
    if (!game) return;

    // Rotate player order for next round (move first player to end)
    const rotatedPlayerStates = [
      ...game.state.playerStates.slice(1),
      game.state.playerStates[0],
    ];

    const updatedGame = {
      ...game,
      state: {
        ...game.state,
        playerStates: rotatedPlayerStates,
        currentRound: game.state.currentRound + 1,
        // Tell the display to pop the round-points badges for the round just
        // finished (before the increment above).
        roundResultTrigger: game.state.currentRound,
      },
    };
    updateGame(updatedGame);
    // Skip player ordering + fortune wheel for subsequent rounds; jump straight
    // to the prediction view.
    setCurrentPage(2);
  }

  function handleFinale() {
    if (!game) return;
    const confirmed = window.confirm(
      maxRounds === game.state.currentRound
        ? "Möchtest du das Spiel jetzt beenden?"
        : "Möchtest du das Spiel wirklich vorzeitig beenden?",
    );
    if (!confirmed) return;
    const updatedGame = {
      ...game,
      state: {
        ...game.state,
        running: false,
      },
    };
    updateGame(updatedGame);
  }

  if (!game) {
    return <p>Lade Spieldaten...</p>;
  }

  const maxRounds = 60 / game.state.playerStates.length;

  // Once the game is over, drop the round UI entirely and show the final screen.
  if (!game.state.running) {
    return (
      <div className="flex flex-col justify-center p-10">
        <FinalView game={game} updateGame={updateGame} />
      </div>
    );
  }

  const pages = [
    <PlayerOrderingView
      key="order"
      game={game}
      updateGame={updateGame}
      onComplete={handleNextPage}
    />,
    <FortuneWheelView
      key="wheel"
      game={game}
      updateGame={updateGame}
      onComplete={handleNextPage}
    />,
    <PredictedHitsView
      key="pred"
      game={game}
      updateGame={updateGame}
      onComplete={handleNextPage}
    />,
    <ActualHitsView
      key="made"
      game={game}
      updateGame={updateGame}
      onComplete={handleRoundDonePage}
    />,
  ];

  // `pages` and `STEPS` share the same order, so the step key mirrors the page.
  const currentKey = STEPS[currentPage].key;
  const isLastRound = maxRounds === game.state.currentRound;
  // The display-overlay toggles ("announce" / "am Zug") only make sense once
  // players are predicting or playing out the round.
  const showTurnControls = currentKey === "pred" || currentKey === "made";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      {/* Sticky header: round info + join code / dashboard link. */}
      <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/80 px-5 py-4 backdrop-blur">
        <ControllerRoundInfo game={game} />
      </header>

      {/* Step indicator so the operator always knows where they are. */}
      <StepIndicator
        activeKey={currentKey}
        firstRound={game.state.currentRound === 1}
      />

      {/* Current step, in a consistent contained panel. */}
      <main className="flex-1 px-5 pb-40 pt-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          {pages[currentPage]}
        </div>
      </main>

      {/* Fixed bottom action bar: dashboard-display controls + end game. */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-5 py-4">
          {showTurnControls && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Dashboard-Einblendung
              </p>
              <div className="grid grid-cols-2 gap-2">
                <TurnToggle
                  active={game.state.turnOverlay?.kind === "predict"}
                  icon={<Megaphone size={16} />}
                  onClick={() => toggleTurnOverlay("predict")}
                >
                  Stiche angeben
                </TurnToggle>
                <TurnToggle
                  active={game.state.turnOverlay?.kind === "play"}
                  icon={<Play size={16} />}
                  onClick={() => toggleTurnOverlay("play")}
                >
                  Am Zug
                </TurnToggle>
              </div>
            </div>
          )}

          {/* Manual dashboard screen controls, available at any point. */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
              Dashboard-Anzeige
            </p>
            <div className="grid grid-cols-2 gap-2">
              <TurnToggle
                active={!!game.state.showWelcome}
                icon={<Sparkles size={16} />}
                onClick={toggleWelcome}
              >
                Willkommen
              </TurnToggle>
              <TurnToggle
                active={!!game.state.setupBlackout}
                icon={<MonitorOff size={16} />}
                onClick={toggleBlackout}
              >
                Schwarz
              </TurnToggle>
            </div>
          </div>

          <button
            onClick={handleFinale}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            {isLastRound ? "Spiel beenden" : "Spiel vorzeitig beenden"}
          </button>
        </div>
      </footer>
    </div>
  );
}

// Horizontal breadcrumb of the round's phases, highlighting the active one and
// checking off completed ones. Setup-only steps are hidden past round 1.
function StepIndicator({
  activeKey,
  firstRound,
}: {
  activeKey: string;
  firstRound: boolean;
}) {
  const steps = STEPS.filter((s) => firstRound || !s.firstRoundOnly);
  const activeIdx = steps.findIndex((s) => s.key === activeKey);

  return (
    <div className="flex items-center gap-1.5 px-5 py-4">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const state =
          idx < activeIdx ? "done" : idx === activeIdx ? "active" : "todo";
        return (
          <div key={step.key} className="flex flex-1 items-center gap-1.5">
            <div
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                state === "active"
                  ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/40"
                  : state === "done"
                    ? "text-neutral-400"
                    : "text-neutral-600"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate text-xs font-medium">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// A toggle button for the dashboard turn-overlay controls.
function TurnToggle({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-blue-500 text-white"
          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
