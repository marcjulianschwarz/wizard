import type { CSSProperties, ReactNode } from "react";

// A two-sided card that flips around its vertical axis. Whichever side is turned
// away is never visible through the other — this is a plain CSS 3D flip, which
// works *iff* the 3D context is preserved unbroken from the perspective scene
// down to the two faces.
//
// The rules that keep it from bleeding through (learned the hard way):
//   - The SCENE sets `perspective`. It must NOT rotate.
//   - The FLIPPER sets `transform-style: preserve-3d` and carries the rotation.
//     It must NOT set `overflow`, `opacity`, `filter`, `clip-path`, or `mask` —
//     each of those forces the browser to *flatten* the 3D context (downgrading
//     `preserve-3d` to `flat`), which collapses both faces onto one plane so the
//     back one shows through. This is the single most common cause of a "leaky"
//     flip card.
//   - Each FACE sets `backface-visibility: hidden` together with its own
//     `rotateY` on the *same element*. A face may clip its own content with
//     `overflow: hidden` — that only affects the face's children, not the
//     flipper's 3D context, so it's safe.
//
// Because both faces stay mounted and are hidden purely by backface culling,
// there is no timer, no content swap, and no mid-flip flash.

interface FlipCardProps {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  durationMs?: number;
  className?: string;
  // Applied to both faces so callers can size/round/border them identically.
  faceClassName?: string;
  faceStyle?: CSSProperties;
}

export default function FlipCard({
  flipped,
  front,
  back,
  durationMs = 500,
  className,
  faceClassName,
  faceStyle,
}: FlipCardProps) {
  // The face fills the scene and clips its own overflow. `backfaceVisibility`
  // hidden is what culls the away side.
  const baseFace: CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    overflow: "hidden",
    ...faceStyle,
  };

  return (
    // SCENE: perspective only, never transformed.
    <div className={className} style={{ perspective: 1200, height: "100%" }}>
      {/* FLIPPER: preserves 3D and rotates. No overflow/opacity/filter here. */}
      <div
        style={{
          position: "relative",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: `transform ${durationMs}ms ease-out`,
        }}
      >
        {/* FRONT face: no extra rotation. */}
        <div className={faceClassName} style={{ ...baseFace, transform: "rotateY(0deg)" }}>
          {front}
        </div>
        {/* BACK face: pre-rotated 180° so it reads correctly once flipped. */}
        <div className={faceClassName} style={{ ...baseFace, transform: "rotateY(180deg)" }}>
          {back}
        </div>
      </div>
    </div>
  );
}
