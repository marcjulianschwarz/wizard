import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

// A slide-up bottom sheet for the mobile controller's secondary controls. On the
// full-screen phone layout the main area is reserved for the active entry view,
// so display toggles / corrections / end-game live here behind a "More" button.
//
// Purely controlled: rendered while `open`, dismissed by the backdrop, the close
// button, or a downward drag. Desktop never mounts this — it shows the same
// children inline (see ControllerGamePage).
export default function ControllerSheet(props: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { open, onClose, children } = props;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-neutral-800 bg-neutral-950 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle + close */}
            <div className="mb-3 flex items-center justify-between">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-700" />
              <button
                onClick={onClose}
                aria-label="Schließen"
                className="absolute right-4 rounded-lg p-1 text-neutral-500 active:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-2">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
