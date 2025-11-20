"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { getBrowserApiBase } from "@/lib/api-client";

const modes = {
  login: {
    title: "Welcome back",
    subtitle: "Chat with your team in seconds.",
    action: "Login",
    alternate: {
      text: "Need an account?",
      href: "/register",
      cta: "Create one",
    },
  },
  register: {
    title: "Create your ChatX account",
    subtitle: "Collaborate in real time with your team.",
    action: "Sign up",
    alternate: {
      text: "Already have an account?",
      href: "/login",
      cta: "Login",
    },
  },
};

/**
 * Premium auth form component with glassmorphism
 * Animated inputs and gradient borders
 */
export default function AuthForm({ mode = "login" }) {
  const router = useRouter();
  const config = modes[mode];
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    avatar: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const apiBase = getBrowserApiBase();
    const endpoint =
      mode === "login" ? `${apiBase}/api/auth/login` : `${apiBase}/api/auth/register`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Something went wrong.");
      }

      toast.success(
        mode === "login" ? "Welcome back to ChatX!" : "Account created successfully!",
      );
      router.replace("/chat");
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="glass-panel w-full max-w-md p-10"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8 text-center">
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-2 text-sm font-semibold uppercase tracking-[0.4em] text-primary-400"
        >
          ChatX
        </motion.p>
        <h1 className="mb-2 text-3xl font-bold text-dark-text">{config.title}</h1>
        <p className="text-sm text-dark-muted">{config.subtitle}</p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "register" && (
          <motion.div variants={itemVariants}>
            <label className="mb-2 block text-xs font-medium text-dark-muted">
              Username
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              className="glass-strong w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-dark-text placeholder-dark-muted outline-none transition-all focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
              placeholder="johndoe"
            />
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <label className="mb-2 block text-xs font-medium text-dark-muted">Email</label>
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="glass-strong w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-dark-text placeholder-dark-muted outline-none transition-all focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
            placeholder="you@company.com"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="mb-2 block text-xs font-medium text-dark-muted">Password</label>
          <div className="relative">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="glass-strong w-full rounded-2xl border border-white/10 px-4 py-3 pr-12 text-sm text-dark-text placeholder-dark-muted outline-none transition-all focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted transition-colors hover:text-dark-text"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L12 12m-5.71-5.71L12 12"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </motion.div>

        {mode === "register" && (
          <motion.div variants={itemVariants}>
            <label className="mb-2 block text-xs font-medium text-dark-muted">
              Avatar URL <span className="text-dark-muted/60">(optional)</span>
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="url"
              name="avatar"
              value={form.avatar}
              onChange={handleChange}
              className="glass-strong w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-dark-text placeholder-dark-muted outline-none transition-all focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
              placeholder="https://gravatar.com/avatar.png"
            />
          </motion.div>
        )}

        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="mt-6 w-full rounded-2xl bg-gradient-primary px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-glow-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Please wait...
            </span>
          ) : (
            config.action
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <motion.p
        variants={itemVariants}
        className="mt-6 text-center text-sm text-dark-muted"
      >
        {config.alternate.text}{" "}
        <a
          href={config.alternate.href}
          className="font-semibold text-primary-400 transition-colors hover:text-primary-300"
        >
          {config.alternate.cta}
        </a>
      </motion.p>
    </motion.div>
  );
}
