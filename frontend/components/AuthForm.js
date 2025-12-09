"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import { getBrowserApiBase } from "@/lib/api-client";
import { validateEmail, validatePassword, validateUsername, formatText } from "@/lib/validation";

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
export default function AuthForm({ mode = "login", onModeChange }) {
  const router = useRouter();
  const config = modes[mode];
  const fileInputRef = useRef(null);
  const isNavigatingRef = useRef(false); // Prevent multiple navigations
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    avatar: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Real-time validation
  const validateField = (name, value) => {
    let validation;
    
    switch (name) {
      case "username":
        validation = validateUsername(value);
        break;
      case "email":
        validation = validateEmail(value);
        break;
      case "password":
        validation = validatePassword(value);
        break;
      default:
        validation = { isValid: true, error: null };
    }
    
    setErrors((prev) => ({
      ...prev,
      [name]: validation.isValid ? "" : validation.error,
    }));
    
    return validation.isValid;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    
    // Format text for username (capitalize first letter)
    let formattedValue = value;
    if (name === "username" && value.length > 0) {
      formattedValue = formatText(value, { capitalizeFirst: false, trim: false });
    }
    
    setForm((prev) => ({ ...prev, [name]: formattedValue }));
    
    // Real-time validation if field has been touched
    if (touched[name]) {
      validateField(name, formattedValue);
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    toast.loading("Uploading avatar...", { id: "avatar-upload" });

    try {
      const apiBase = getBrowserApiBase();
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid response from server"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || "Upload failed"));
            } catch (e) {
              reject(new Error("Upload failed"));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("POST", `${apiBase}/api/upload`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      const result = await uploadPromise;
      
      // Update form data with new avatar URL
      const newAvatarUrl = result.url;
      setForm((prev) => ({ ...prev, avatar: newAvatarUrl }));
      setAvatarPreview(newAvatarUrl);
      
      toast.success("Avatar uploaded successfully!", { id: "avatar-upload" });
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Failed to upload avatar", { id: "avatar-upload" });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {
      username: mode === "register",
      email: true,
      password: true,
    };
    setTouched(allTouched);
    
    // Validate all fields
    let isValid = true;
    if (mode === "register") {
      isValid = validateField("username", form.username) && isValid;
    }
    isValid = validateField("email", form.email) && isValid;
    isValid = validateField("password", form.password) && isValid;
    
    if (!isValid) {
      return;
    }
    
    setIsSubmitting(true);
    const apiBase = getBrowserApiBase();
    const endpoint =
      mode === "login" ? `${apiBase}/api/auth/login` : `${apiBase}/api/auth/register`;

    try {
      console.log(`🔐 ${mode === "login" ? "Login" : "Register"} attempt:`, {
        email: form.email,
        endpoint,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          ...(mode === "register" ? { username: form.username.trim(), avatar: form.avatar } : {}),
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ ${mode === "login" ? "Login" : "Register"} failed:`, data);
        throw new Error(data.error || "Something went wrong.");
      }

      console.log(`✅ ${mode === "login" ? "Login" : "Register"} successful:`, data.user?.email);

      // Prevent multiple navigations
      if (isNavigatingRef.current) {
        return;
      }
      isNavigatingRef.current = true;

      toast.success(
        mode === "login" ? "Welcome back to ChatX!" : "Account created successfully!",
      );
      
      // Wait for cookie to be set in browser (increased delay for Render and server-side cookie sync)
      // This ensures the cookie is available when the server component checks for authentication
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Use window.location.href for reliable redirect
      // This ensures server-side components can immediately read the cookie
      // router.replace() might not trigger server-side re-render fast enough on Render
      console.log("Redirecting to /chat...");
      window.location.href = "/chat";
    } catch (error) {
      console.error(`❌ ${mode === "login" ? "Login" : "Register"} error:`, error);
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
    <motion.main
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="glass-panel w-full max-w-md rounded-r-3xl p-6 shadow-2xl sm:p-8 lg:rounded-l-none lg:h-full lg:flex lg:flex-col lg:justify-center"
      role="main"
    >
      {/* Header - Compact */}
      <motion.header variants={itemVariants} className="mb-5 text-center">
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-2 text-xs font-semibold uppercase tracking-[0.4em] text-primary-400 sm:text-sm"
          aria-label="ChatX brand"
        >
          ChatX
        </motion.p>
        <h1 className="mb-1.5 text-2xl font-bold leading-tight text-dark-text sm:text-3xl">{config.title}</h1>
        <p className="text-sm leading-relaxed text-dark-muted sm:text-base">{config.subtitle}</p>
      </motion.header>

      {/* Form - Compact */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5 sm:space-y-4" aria-label={`${config.action} form`}>
        {mode === "register" && (
          <motion.div variants={itemVariants}>
            <label htmlFor="username" className="mb-2 block text-xs font-medium text-dark-muted sm:text-sm">
              Username
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              id="username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`glass-strong w-full rounded-2xl border px-4 py-3 text-sm text-dark-text placeholder-dark-muted outline-none transition-all focus:ring-2 sm:text-base ${
                touched.username && errors.username
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : "border-white/10 focus:border-primary-500/50 focus:ring-primary-500/20"
              }`}
              placeholder="johndoe"
              aria-required="true"
              aria-invalid={touched.username && errors.username ? "true" : "false"}
              aria-describedby={touched.username && errors.username ? "username-error" : undefined}
            />
            {touched.username && errors.username && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="username-error"
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
              >
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errors.username}</span>
              </motion.p>
            )}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <label htmlFor="email" className="mb-2 block text-xs font-medium text-dark-muted sm:text-sm">
            Email
          </label>
          <motion.input
            whileFocus={{ scale: 1.02 }}
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`glass-strong w-full rounded-2xl border px-4 py-3 text-sm text-dark-text placeholder-dark-muted outline-none transition-all focus:ring-2 sm:text-base ${
              touched.email && errors.email
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                : "border-white/10 focus:border-primary-500/50 focus:ring-primary-500/20"
            }`}
            placeholder="you@company.com"
            aria-required="true"
            aria-invalid={touched.email && errors.email ? "true" : "false"}
            aria-describedby={touched.email && errors.email ? "email-error" : undefined}
            autoComplete="email"
          />
          {touched.email && errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="email-error"
              role="alert"
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
            >
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errors.email}</span>
            </motion.p>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="password" className="mb-2 block text-xs font-medium text-dark-muted sm:text-sm">
            Password
          </label>
          <div className="relative">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`glass-strong w-full rounded-2xl border px-4 py-3 pr-12 text-sm text-dark-text placeholder-dark-muted outline-none transition-all focus:ring-2 sm:text-base ${
                touched.password && errors.password
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : "border-white/10 focus:border-primary-500/50 focus:ring-primary-500/20"
              }`}
              placeholder="••••••••"
              aria-required="true"
              aria-invalid={touched.password && errors.password ? "true" : "false"}
              aria-describedby={touched.password && errors.password ? "password-error" : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L12 12m-5.71-5.71L12 12"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          {touched.password && errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="password-error"
              role="alert"
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
            >
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errors.password}</span>
            </motion.p>
          )}
        </motion.div>

        {mode === "register" && (
          <motion.div variants={itemVariants} className="space-y-3">
            <label className="mb-2 block text-xs font-medium text-dark-muted sm:text-sm">
              Avatar <span className="text-dark-muted/60">(optional)</span>
            </label>
            
            {/* Avatar Preview */}
            {avatarPreview && (
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={avatarPreview}
                      alt="Avatar preview"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-dark-text">Preview</p>
                    <p className="text-xs text-dark-muted truncate">{avatarPreview}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(null);
                      setForm((prev) => ({ ...prev, avatar: "" }));
                    }}
                    className="flex-shrink-0 rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/20"
                    aria-label="Remove avatar"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* Upload Button */}
            <label
              htmlFor="avatar-upload"
              className={`glass-strong flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-2.5 text-xs transition-all ${
                isUploadingAvatar
                  ? "border-primary-400/50 bg-primary-400/10 cursor-wait"
                  : "border-white/20 hover:border-primary-400/50 hover:bg-white/5"
              }`}
            >
              {isUploadingAvatar ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs text-dark-text">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs text-dark-text">{avatarPreview ? "Change Avatar" : "Upload Image"}</span>
                </>
              )}
              <input
                id="avatar-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
                disabled={isUploadingAvatar}
              />
            </label>
            <p className="text-xs text-dark-muted/70 text-center">Max 5MB, JPG/PNG/GIF</p>
          </motion.div>
        )}

        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="mt-5 w-full rounded-2xl bg-gradient-primary px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-glow-primary hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg sm:text-base"
          aria-label={isSubmitting ? "Submitting form" : config.action}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2" aria-live="polite">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                aria-hidden="true"
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
        className="mt-5 text-center text-sm text-dark-muted sm:text-base"
      >
        {config.alternate.text}{" "}
        <button
          type="button"
          onClick={() => {
            if (typeof onModeChange === "function") {
              onModeChange(mode === "login" ? "register" : "login");
            }
          }}
          className="font-semibold text-primary-400 transition-colors hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg rounded underline-offset-4 hover:underline"
        >
          {config.alternate.cta}
        </button>
      </motion.p>
    </motion.main>
  );
}
