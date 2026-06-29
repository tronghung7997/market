"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

const WIDTH_CLASSES = {
  sm: "max-w-[400px]",
  md: "max-w-[500px]",
  lg: "max-w-[600px]",
  xl: "max-w-[720px]",
};

export function SlidePanel({
  isOpen,
  onClose,
  title,
  children,
  width = "lg",
}: SlidePanelProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 h-full w-full bg-white z-[70] shadow-2xl border-l border-slate-200 overflow-y-auto",
              WIDTH_CLASSES[width]
            )}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-[18px] leading-none px-2 py-1 rounded hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
