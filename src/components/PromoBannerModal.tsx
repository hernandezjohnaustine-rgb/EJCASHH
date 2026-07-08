import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface PromoBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;          // the poster/banner image to display
  title?: string;            // optional headline shown below the image
  description?: string;      // optional subtext
  ctaText?: string;          // optional call-to-action button label
  onCtaClick?: () => void;   // optional call-to-action handler
}

export default function PromoBannerModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  description,
  ctaText,
  onCtaClick,
}: PromoBannerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm max-h-[85vh] rounded-[28px] overflow-hidden bg-brand-navy border border-brand-border shadow-2xl flex flex-col"
          >
            <button
              onClick={onClose}
              aria-label="Close promo"
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center transition-colors active:scale-90 shadow-lg"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="overflow-y-auto">
              <img
                src={imageUrl}
                alt={title || "Promotional banner"}
                className="w-full h-auto object-contain"
              />
            </div>

            {(title || description || ctaText) && (
              <div className="p-6 flex flex-col gap-3 text-center">
                {title && (
                  <h3 className="text-lg font-display font-black text-brand-primary italic">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-brand-text/60 font-medium">
                    {description}
                  </p>
                )}
                {ctaText && (
                  <button
                    onClick={() => {
                      onCtaClick?.();
                      onClose();
                    }}
                    className="mt-2 w-full py-3 bg-brand-primary text-brand-black rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    {ctaText}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
