"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthForm from "@/components/AuthForm";

const benefits = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Enterprise Security",
    description: "HttpOnly JWT cookies and encrypted sessions keep your data secure",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: "Real-time Sync",
    description: "Socket.io delivers instant presence, typing indicators, and unread counts",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12.75 3l-8.25 9.75-1.5 1.5zm13.5 0L21 2.25 19.5 1.5 16.5 4.5l-1.5 1.5 2.25 7.5zm-6 0l-3 3m0 0l-3 3m3-3v6.75" />
      </svg>
    ),
    title: "Lightning Fast",
    description: "Optimized performance with MongoDB and Mongoose for instant message delivery",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: "Beautiful UI",
    description: "Tailwind CSS ensures responsive, modern layouts that work everywhere",
    gradient: "from-orange-500 to-amber-500",
  },
];

export default function AuthPage({ initialMode = "register" }) {
  const [mode, setMode] = useState(initialMode);

  return (
    <main className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background-dark via-background-dark to-primary-900/20 p-3 sm:p-4 md:p-6" role="main">
      <div className="flex w-full max-w-6xl flex-col items-center gap-0 lg:flex-row lg:items-stretch lg:min-h-[600px]">
        {/* Left Side - Premium Benefits (Always Same) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative hidden w-full flex-col justify-center lg:flex lg:w-1/2"
        >
          {/* Premium Gradient Background with Mesh - Only Left Corners Rounded */}
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-l-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>

          {/* Content Container - Increased Height */}
          <div className="relative space-y-6 sm:space-y-8 md:space-y-10 p-5 sm:p-7 md:p-9">
            {/* Header Section - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-2 sm:space-y-3"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-indigo-400/80"
              >
                Why ChatX
              </motion.p>
              
              <h1 className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-white">
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent blur-xl opacity-40">
                  Secure, scalable, real-time chat in minutes.
                </span>
                <span className="relative">
                  Secure, scalable,{" "}
                  <span className="relative bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                    real-time chat
                  </span>{" "}
                  in minutes.
                </span>
              </h1>
            </motion.div>

            {/* Premium Feature Cards - Increased Spacing */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="grid gap-3 sm:gap-3.5"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.5 + index * 0.08, 
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  whileHover={{ x: 2, transition: { duration: 0.15 } }}
                  className="group relative"
                >
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/10 sm:p-4">
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${benefit.gradient} opacity-0 blur-lg transition-opacity duration-200 group-hover:opacity-15`} />
                    <div className="relative flex items-center gap-3">
                      <div className={`flex-shrink-0 rounded-lg bg-gradient-to-br ${benefit.gradient} p-2 shadow-md shadow-purple-500/20 transition-all duration-200 group-hover:scale-105`}>
                        <div className="text-white [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
                          {benefit.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white sm:text-base">
                          {benefit.title}
                        </h3>
                        <p className="text-xs leading-snug text-slate-400 sm:text-sm line-clamp-2">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Premium Stats Section - Increased Spacing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="flex flex-wrap items-center gap-3 pt-3"
            >
              {[
                { label: "99.9% Uptime", dotColor: "bg-emerald-400", shadowColor: "shadow-emerald-400/50" },
                { label: "Enterprise Ready", dotColor: "bg-blue-400", shadowColor: "shadow-blue-400/50" },
                { label: "Free Forever", dotColor: "bg-purple-400", shadowColor: "shadow-purple-400/50" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.85 + index * 0.05, duration: 0.25 }}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-sm"
                >
                  <div className={`h-1.5 w-1.5 rounded-full ${stat.dotColor} animate-pulse shadow-md ${stat.shadowColor}`} />
                  <span className="text-xs font-medium text-slate-300">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form (Switches between login/register) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full items-center justify-center lg:w-1/2 lg:items-stretch"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <AuthForm mode={mode} onModeChange={setMode} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}

