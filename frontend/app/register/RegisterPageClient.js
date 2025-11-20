"use client";

import { motion } from "framer-motion";
import AuthForm from "@/components/AuthForm";

export default function RegisterPageClient() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="flex w-full max-w-5xl flex-col items-center gap-12 md:flex-row">
        {/* Left Side - Benefits */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-6"
        >
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-2 text-sm font-semibold uppercase tracking-[0.4em] text-primary-400"
            >
              Why ChatX
            </motion.p>
            <h1 className="text-4xl font-bold text-dark-text">
              Secure, scalable,{" "}
              <span className="text-gradient">real-time chat</span> in minutes.
            </h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6"
          >
            <p className="mb-4 text-sm font-semibold text-dark-text">Your benefits</p>
            <ul className="space-y-3 text-sm text-dark-muted">
              {[
                "HttpOnly JWT cookies keep sessions secure",
                "Socket.io handles presence, typing, and unread counts",
                "Tailwind UI ensures responsive layouts out of the box",
              ].map((benefit, index) => (
                <motion.li
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 rounded-full bg-gradient-primary p-1">
                    <svg
                      className="h-2.5 w-2.5 text-white"
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
                  {benefit}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full justify-center md:w-auto"
        >
          <AuthForm mode="register" />
        </motion.div>
      </div>
    </main>
  );
}

