"use client";

import { motion } from "framer-motion";

/**
 * Premium typing indicator with animated dots
 * Shows when someone is typing in the chat
 */
export default function TypingIndicator({ users = [] }) {
  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const dotDelays = [0, 0.2, 0.4];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="glass-strong flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3">
        {users.length > 0 && (
          <span className="text-xs text-dark-muted">
            {users.length === 1
              ? `${users[0]} is typing`
              : `${users.length} people are typing`}
          </span>
        )}
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={dotVariants}
              animate="animate"
              style={{ animationDelay: `${dotDelays[index]}s` }}
              className="h-2 w-2 rounded-full bg-primary-400"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

