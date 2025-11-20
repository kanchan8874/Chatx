"use client";

import { motion } from "framer-motion";
import AuthForm from "@/components/AuthForm";

export default function LoginPageClient() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="flex w-full max-w-6xl items-center gap-16">
        {/* Left Side - Feature Showcase */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden flex-1 flex-col space-y-6 lg:flex"
        >
          <div className="glass-panel p-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-primary-400"
            >
              ChatX
            </motion.p>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-dark-text">
              Real-time messaging built for{" "}
              <span className="text-gradient">product teams</span>.
            </h1>
            <p className="mb-8 text-lg text-dark-muted">
              ChatX combines secure messaging, typing indicators, delivery states, and
              presence into a single dashboard.
            </p>
            <div className="space-y-4">
              {[
                "JWT + HttpOnly cookies for secure auth",
                "Socket.io delivers live status, typing, and unread counts",
                "MongoDB + Mongoose keep conversations persistent",
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 text-sm text-dark-muted"
                >
                  <div className="flex-shrink-0 rounded-full bg-gradient-primary p-1.5">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  {feature}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full justify-center lg:w-auto"
        >
          <AuthForm mode="login" />
        </motion.div>
      </div>
    </main>
  );
}

