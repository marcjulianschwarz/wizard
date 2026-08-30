import { useSocket } from "@/api/hooks";
import { useEffect, useRef, useState } from "react";
import ControllerRoundInfo from "@/components/RoundInfo/ControllerRoundInfo";
import CompactControllerHeader from "@/components/RoundInfo/CompactControllerHeader";
import { useParams } from "react-router";
import PlayerOrderingView from "./views/PlayerOrderingView";
import FortuneWheelView from "./views/FortuneWheelView";
import PredictedHitsView from "./views/PredictedHitsView";
import ActualHitsView from "./views/ActualHitsView";
import FinalView from "./views/FinalView";
import CorrectionPanel from "./views/CorrectionPanel";
import ControllerSheet from "./views/ControllerSheet";
import { endGame, finishRound } from "@/game/loop";
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
  // Why the last "Fertig" was refused (incomplete/illegal round), or null.
  const [roundError, setRoundError] = useState<string | null>(null);
  // Mobile-only: whether the secondary-controls bottom sheet is open.
  const [sheetOpen, setSheetOpen] = useState(false);

  // On first load (e.g. a page reload mid-game) resume at the right phase rather
  // than the round-1 setup: the player-ordering and fortune-wheel steps only run
  // before round 1, so from round 2 on jump straight to the prediction step.
  const didInitPage = useRef(false);
  useEffect(() => {
    if (didInitPage.current || !game) return;
    didInitPage.current = true;
    if (game.state.currentRound > 1) setCurrentPage(2);
  }, [game]);

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
    // finishRound validates the round first: it rotates the turn order, advances
    // the round, and stamps roundResultTrigger — but only if the round is
    // complete and legal. A bad round is refused and surfaced, never committed.
    const result = finishRound(game);
    if (!result.ok) {
      setRoundError(result.errors.join("\n"));
      return;
    }
    setRoundError(null);
    updateGame(result.game);
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
    updateGame(endGame(game));
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

  // The turn-overlay toggles ("Stiche" / "Am Zug") stay on the main screen —
  // they're used frequently mid-round — so they render inline on both layouts.
  const turnToggles = showTurnControls && (
    <div className="grid grid-cols-2 gap-2">
      <TurnToggle
        active={game.state.turnOverlay?.kind === "predict"}
        icon={<Megaphone size={16} />}
        onClick={() => toggleTurnOverlay("predict")}
      >
        Stiche
      </TurnToggle>
      <TurnToggle
        active={game.state.turnOverlay?.kind === "play"}
        icon={<Play size={16} />}
        onClick={() => toggleTurnOverlay("play")}
      >
        Am Zug
      </TurnToggle>
    </div>
  );

  // The secondary controls (display toggles, corrections, end game). Rendered
  // inline in the desktop column and inside the bottom sheet on mobile.
  const secondaryControls = (
    <>
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

      <CorrectionPanel game={game} updateGame={updateGame} />

      <button
        onClick={handleFinale}
        className="mt-1 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-3 text-sm font-medium text-red-400 transition-colors active:bg-red-500/20"
      >
        {isLastRound ? "Spiel beenden" : "Spiel vorzeitig beenden"}
      </button>
    </>
  );

  const roundErrorBlock = roundError && (
    <div className="whitespace-pre-line rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
      {roundError}
    </div>
  );

  return (
    <>
      {/*
        MOBILE: a fixed, full-screen, non-scrolling layout. The controller lives
        on a phone, so the header is dense (round/time/code in one row), the
        secondary controls hide behind a "More" sheet, and the active entry view
        flexes to fill exactly the remaining height. `100dvh` + overflow-hidden
        keeps it pinned with no page scroll. Hidden at `md` and up.
      */}
      <div className="flex h-[100dvh] flex-col overflow-hidden px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <header className="shrink-0 pb-3 pt-3">
          <CompactControllerHeader
            game={game}
            onOpenMore={() => setSheetOpen(true)}
          />
        </header>

        <div className="shrink-0 pb-3">
          <StepIndicator
            activeKey={currentKey}
            firstRound={game.state.currentRound === 1}
          />
        </div>

        {/* The entry view owns the remaining space and sizes itself to fit. */}
        <main className="min-h-0 flex-1 overflow-hidden">
          {pages[currentPage]}
        </main>

        <div className="shrink-0 space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          {roundErrorBlock}
          {turnToggles}
        </div>
      </div>

      {/*
        DESKTOP: the original scrollable, centered column. Plenty of vertical
        room, so the full round header and all controls flow inline.
      */}
      <div className="mx-auto hidden min-h-screen w-full max-w-md flex-col px-4 pb-8 md:flex">
        <header className="py-3">
          <ControllerRoundInfo game={game} />
        </header>

        <StepIndicator
          activeKey={currentKey}
          firstRound={game.state.currentRound === 1}
        />

        <main className="flex-1 pt-4">{pages[currentPage]}</main>

        {roundError && <div className="mt-4">{roundErrorBlock}</div>}

        <div className="mt-8 flex flex-col gap-2 border-t border-neutral-800 pt-4">
          {turnToggles}
          {secondaryControls}
        </div>
      </div>

      {/* Mobile-only secondary-controls sheet, triggered from the header. */}
      <ControllerSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {secondaryControls}
      </ControllerSheet>
    </>
  );
}

// Slim breadcrumb of the round's phases: icon + label, active one highlighted.
// Setup-only steps are hidden past round 1.
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
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const active = idx === activeIdx;
        return (
          <div
            key={step.key}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
              active
                ? "bg-blue-500/15 text-blue-300"
                : idx < activeIdx
                  ? "text-neutral-500"
                  : "text-neutral-700"
            }`}
          >
            <Icon size={14} className="shrink-0" />
            {active && <span className="truncate">{step.label}</span>}
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
