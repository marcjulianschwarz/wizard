import type { PlayerState } from "@/api/entities";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

export const WHEEL_SPIN_SECONDS = 5;
const FULL_SPINS = 6; // extra whole turns before landing, for suspense

// Rich, well-separated wedge colours (each wedge gets a light→dark radial pair).
const WEDGE_COLORS: [string, string][] = [
  ["#60a5fa", "#2563eb"],
  ["#4ade80", "#16a34a"],
  ["#fbbf24", "#d97706"],
  ["#f472b6", "#db2777"],
  ["#fb923c", "#ea580c"],
  ["#c084fc", "#9333ea"],
  ["#2dd4f4", "#0891b2"],
  ["#f87171", "#dc2626"],
];

interface FortuneWheelProps {
  players: PlayerState[];
  size: number;
  // Index the wheel should land on. When null the wheel sits idle.
  targetIndex: number | null;
  // Bumps to (re)trigger a spin, even for the same target.
  spinNonce: number;
  // Fires once the wheel has settled on the target.
  onSettled?: (index: number) => void;
}

// Build an SVG path for one pie wedge, centred at (c, c) with radius r spanning
// [startAngle, endAngle] degrees (0deg = pointing up, clockwise).
function wedgePath(
  c: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
  };
  const [x1, y1] = toXY(startAngle);
  const [x2, y2] = toXY(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export default function FortuneWheel({
  players,
  size,
  targetIndex,
  spinNonce,
  onSettled,
}: FortuneWheelProps) {
  const segmentAngle = 360 / players.length;
  const c = size / 2;
  const r = c - 6;
  const labelRadius = r * 0.62;

  // The last spinNonce whose animation has completed. While this lags behind
  // the incoming spinNonce, the wheel is mid-spin.
  const [settledNonce, setSettledNonce] = useState(0);
  const spinning = targetIndex !== null && settledNonce !== spinNonce;
  const landed = spinning ? null : targetIndex;

  // Absolute target rotation, computed purely from the inputs so it's fully
  // declarative — no effects, no manual animate(), no StrictMode double-run
  // trap. Each spin (spinNonce) adds FULL_SPINS whole turns, and the fractional
  // part lands the target wedge's centre under the top pointer. Because the
  // value only ever grows, motion animates from the previous value to this one.
  const targetRotation = useMemo(() => {
    if (targetIndex === null) return 0;
    const segmentCenter = targetIndex * segmentAngle + segmentAngle / 2;
    // Land the wedge centre at the top (0deg), normalised into [0, 360).
    const landingAngle = ((-segmentCenter % 360) + 360) % 360;
    return spinNonce * FULL_SPINS * 360 + landingAngle;
  }, [spinNonce, targetIndex, segmentAngle]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ambient glow, stronger while spinning. */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #3b82f6aa, transparent 70%)" }}
        animate={{ opacity: spinning ? [0.35, 0.75, 0.35] : 0.3, scale: spinning ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 1.4, repeat: spinning ? Infinity : 0, ease: "easeInOut" }}
      />

      {/* Pointer: a rounded teardrop needle with a sharp tip dipping into the
          wheel and a glossy knob on top. */}
      <motion.div
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{ top: -size * 0.09 }}
        animate={{ y: spinning ? [0, size * 0.012, 0] : 0 }}
        transition={{ duration: 0.35, repeat: spinning ? Infinity : 0, ease: "easeInOut" }}
      >
        <svg
          width={size * 0.09}
          height={size * 0.13}
          viewBox="0 0 44 64"
          style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.45))" }}
        >
          <defs>
            <linearGradient id="pointer-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          {/* Teardrop: round top, tapering to a point at the bottom. */}
          <path
            d="M22 62 C10 42 4 34 4 22 A18 18 0 1 1 40 22 C40 34 34 42 22 62 Z"
            fill="url(#pointer-body)"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1.5"
          />
          {/* Glossy inner highlight */}
          <circle cx="22" cy="20" r="7.5" fill="#fff" opacity="0.9" />
          <circle cx="22" cy="20" r="4" fill="#93c5fd" />
        </svg>
      </motion.div>

      {/* Wheel. Rotate a wrapping motion.div (HTML) rather than the <svg>
          itself — CSS transforms on <svg> don't rotate reliably about the
          centre across browsers, which left the wheel visually frozen. */}
      <motion.div
        className="drop-shadow-2xl"
        style={{ width: size, height: size }}
        animate={{ rotate: targetRotation }}
        transition={{
          duration: WHEEL_SPIN_SECONDS,
          // Launch fast, then a long suspenseful deceleration (ease-out).
          ease: [0.15, 0.85, 0.25, 1],
        }}
        onAnimationComplete={() => {
          if (targetIndex === null) return;
          setSettledNonce(spinNonce);
          onSettled?.(targetIndex);
        }}
      >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          {players.map((_, idx) => {
            const [light, dark] = WEDGE_COLORS[idx % WEDGE_COLORS.length];
            return (
              <radialGradient
                id={`wedge-${idx}`}
                key={idx}
                cx="50%"
                cy="50%"
                r="65%"
              >
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={dark} />
              </radialGradient>
            );
          })}
        </defs>

        {/* Rim */}
        <circle cx={c} cy={c} r={r + 4} fill="#0a0a0a" />

        {players.map((ps, idx) => {
          const start = idx * segmentAngle;
          const end = (idx + 1) * segmentAngle;
          const isWinner = landed === idx;
          return (
            <path
              key={ps.player.name}
              d={wedgePath(c, r, start, end)}
              fill={`url(#wedge-${idx})`}
              stroke={isWinner ? "#ffffff" : "rgba(255,255,255,0.18)"}
              strokeWidth={isWinner ? 4 : 1.5}
              style={{
                filter: isWinner
                  ? "brightness(1.15)"
                  : landed !== null
                    ? "brightness(0.6)"
                    : "none",
                transition: "filter 0.4s ease",
              }}
            />
          );
        })}

        {/* Labels: emoji + name, laid along each wedge's radius, kept upright. */}
        {players.map((ps, idx) => {
          const mid = idx * segmentAngle + segmentAngle / 2;
          const rad = ((mid - 90) * Math.PI) / 180;
          const lx = c + labelRadius * Math.cos(rad);
          const ly = c + labelRadius * Math.sin(rad);
          // Flip text on the left half so names never read upside-down.
          const flip = mid > 180 ? 180 : 0;
          return (
            <g
              key={`label-${ps.player.name}`}
              transform={`translate(${lx} ${ly}) rotate(${mid + flip})`}
            >
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={size * 0.045}
                fontWeight={700}
                style={{
                  paintOrder: "stroke",
                  stroke: "rgba(0,0,0,0.45)",
                  strokeWidth: 3,
                }}
              >
                <tspan dy="-0.05em">
                  {ps.player.color} {ps.player.name}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
      </motion.div>

      {/* Center hub */}
      <div
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-neutral-500 bg-gradient-to-br from-neutral-700 to-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        style={{ width: size * 0.12, height: size * 0.12 }}
      >
        <div className="absolute inset-1.5 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
