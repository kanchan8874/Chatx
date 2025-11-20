"use client";

import { motion } from "framer-motion";

/**
 * Premium loading skeleton component with shimmer effect
 */
export default function LoadingSkeleton({ variant = "default", className = "" }) {
  const shimmer = {
    initial: { x: "-100%" },
    animate: {
      x: "100%",
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear",
      },
    },
  };

  if (variant === "message") {
    return (
      <div className={`flex gap-3 px-4 py-2 ${className}`}>
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-dark-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded-lg bg-dark-surface" />
          <div className="h-16 w-3/4 rounded-2xl bg-dark-surface" />
        </div>
      </div>
    );
  }

  if (variant === "chat") {
    return (
      <div className={`flex gap-3 p-4 ${className}`}>
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-dark-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded-lg bg-dark-surface" />
          <div className="h-3 w-24 rounded-lg bg-dark-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-dark-surface ${className}`}>
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="h-full w-full" />
    </div>
  );
}

