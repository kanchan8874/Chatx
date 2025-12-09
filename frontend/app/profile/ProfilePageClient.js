"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import { getProfile, updateProfile } from "@/lib/profile";
import { getBrowserApiBase } from "@/lib/api-client";
import { validateEmail, validateUsername, validatePhone, formatText, formatPhone } from "@/lib/validation";

/**
 * Format date consistently to avoid hydration errors
 */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
}

/**
 * Profile page component
 * Premium UI with edit functionality
 */
export default function ProfilePageClient({ initialUser }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    phone: "",
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    phone: false,
  });

  useEffect(() => {
    // Refresh user data
    loadProfile();
  }, []);

  useEffect(() => {
    // Update avatar preview when user changes
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user?.avatar]);

  const loadProfile = async () => {
    try {
      const profileData = await getProfile();
      setUser(profileData);
      setFormData({
        username: profileData?.username || "",
        email: profileData?.email || "",
        phone: profileData?.phone || "",
        avatar: profileData?.avatar || "",
      });
    } catch (error) {
      toast.error("Failed to load profile");
    }
  };

  const validateField = (name, value) => {
    let validation;
    
    switch (name) {
      case "username":
        validation = validateUsername(value);
        break;
      case "email":
        validation = validateEmail(value);
        break;
      case "phone":
        if (value && value.trim() !== "") {
          validation = validatePhone(value);
        } else {
          validation = { isValid: true, error: null }; // Phone is optional
        }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format phone number
    let formattedValue = value;
    if (name === "phone" && value) {
      formattedValue = formatPhone(value);
    } else if (name === "username" && value.length > 0) {
      formattedValue = formatText(value, { capitalizeFirst: false, trim: false });
    }
    
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    
    // Real-time validation if field has been touched
    if (touched[name]) {
      validateField(name, formattedValue);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      username: true,
      email: true,
      phone: true,
    });
    
    // Validate all fields
    let isValid = true;
    isValid = validateField("username", formData.username) && isValid;
    isValid = validateField("email", formData.email) && isValid;
    if (formData.phone && formData.phone.trim() !== "") {
      isValid = validateField("phone", formData.phone) && isValid;
    }
    
    if (!isValid) {
      return;
    }
    
    setIsLoading(true);

    try {
      const updatedUser = await updateProfile(formData);
      setUser(updatedUser);
      setAvatarPreview(updatedUser?.avatar || null);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      avatar: user?.avatar || "",
    });
    setAvatarPreview(user?.avatar || null);
    setErrors({ username: "", email: "", phone: "" });
    setTouched({ username: false, email: false, phone: false });
    setIsEditing(false);
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
            // Could show progress if needed
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
      setFormData((prev) => ({ ...prev, avatar: newAvatarUrl }));
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

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-y-auto bg-gradient-to-br from-background-dark via-background-dark to-primary-900/20 p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-80 w-70 rounded-full bg-primary-500/20 blur-3xl animate-pulse-slow" />
        <div 
          className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl animate-pulse-slow" 
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl z-10 flex flex-col py-4 my-4 lg:my-8"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-2 sm:mb-4 md:mb-5 flex-shrink-0 flex items-center justify-between gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="glass-strong flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text touch-manipulation backdrop-blur-xl"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </motion.button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient bg-gradient-to-r from-primary-400 via-purple-400 to-accent-400 bg-clip-text text-transparent flex-1 text-center">
            Profile
          </h1>
          <div className="w-16 sm:w-24" /> {/* Spacer for centering */}
        </motion.div>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 lg:p-8 shadow-2xl border border-white/10 backdrop-blur-2xl relative overflow-hidden flex-1 flex flex-col min-h-0 max-h-full"
        >
          {/* Decorative Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          {/* Avatar Section - Premium Design */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-3 sm:mb-5 md:mb-6 flex-shrink-0 flex flex-col items-center relative"
          >
            {/* Avatar Container with Multiple Rings */}
            <div className="relative mb-2 sm:mb-3 md:mb-4">
              {/* Outer Glow Ring */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500/30 via-purple-500/30 to-accent-500/30 blur-xl animate-pulse-slow" 
                style={{ transform: 'scale(1.15)' }}
              />
              
              {/* Middle Ring */}
              <div 
                className="absolute inset-0 rounded-full border-3 border-primary-500/20 ring-6 ring-primary-500/10" 
                style={{ transform: 'scale(1.08)' }}
              />
              
              {/* Avatar Circle - Increased Size */}
              <div className="relative h-20 w-20 sm:h-32 sm:w-32 md:h-36 md:w-36 overflow-hidden rounded-full border-3 border-white/20 ring-3 ring-primary-500/30 shadow-2xl bg-gradient-to-br from-primary-500 to-purple-500">
                {avatarPreview || user?.avatar ? (
                  <Image
                    src={avatarPreview || user?.avatar}
                    alt={`${user?.username || "User"}'s avatar`}
                    width={176}
                    height={176}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 via-purple-500 to-accent-500 text-4xl sm:text-5xl md:text-6xl font-bold text-white shadow-inner">
                    {(user?.username || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Edit Avatar Button */}
              {isEditing && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 z-10"
                >
                  <label 
                    htmlFor="avatar-upload"
                    className="glass-strong flex h-12 w-12 sm:h-14 sm:w-14 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-white/20 hover:scale-110 active:scale-95 shadow-lg border-2 border-white/20 backdrop-blur-xl"
                    title="Change avatar"
                  >
                    {isUploadingAvatar ? (
                      <svg className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 sm:h-7 sm:w-7 text-dark-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
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
                </motion.div>
              )}
            </div>
            
            {/* User Info with Premium Typography */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center space-y-0.5 sm:space-y-1"
            >
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-dark-text bg-gradient-to-r from-white via-primary-100 to-white bg-clip-text">
                {user?.username || "User"}
              </h2>
              <p className="text-xs sm:text-sm text-dark-text flex items-center justify-center gap-1.5" style={{ fontSize: '13px' }}>
                <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate max-w-[200px] sm:max-w-none">{user?.email}</span>
              </p>
            </motion.div>
          </motion.div>

          {/* Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
              {/* Username */}
              <div>
                <label htmlFor="profile-username" className="mb-2 block text-sm font-medium text-dark-text">
                  Username
                </label>
                <input
                  id="profile-username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`glass-strong w-full rounded-xl border px-4 py-3 text-dark-text placeholder-dark-muted outline-none transition-all focus:bg-white/10 ${
                    touched.username && errors.username
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-primary-400"
                  }`}
                  placeholder="Enter username"
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
              </div>

              {/* Email */}
              <div>
                <label htmlFor="profile-email" className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-dark-text">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`glass-strong w-full rounded-lg sm:rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-dark-text placeholder-dark-muted outline-none transition-all focus:bg-white/10 touch-manipulation ${
                    touched.email && errors.email
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-primary-400"
                  }`}
                  placeholder="Enter email"
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
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="profile-phone" className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-dark-text">
                  Phone
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`glass-strong w-full rounded-lg sm:rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-dark-text placeholder-dark-muted outline-none transition-all focus:bg-white/10 touch-manipulation ${
                    touched.phone && errors.phone
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-primary-400"
                  }`}
                  placeholder="Enter phone number (optional)"
                  aria-invalid={touched.phone && errors.phone ? "true" : "false"}
                  aria-describedby={touched.phone && errors.phone ? "phone-error" : undefined}
                  autoComplete="tel"
                />
                {touched.phone && errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="phone-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.phone}</span>
                  </motion.p>
                )}
              </div>

              {/* Avatar Upload Section */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-text">Avatar</label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {avatarPreview && (
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={avatarPreview}
                            alt="Avatar preview"
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-text">Avatar Preview</p>
                          <p className="text-xs text-dark-muted truncate">{avatarPreview}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarPreview(null);
                            setFormData((prev) => ({ ...prev, avatar: "" }));
                          }}
                          className="flex-shrink-0 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20"
                          aria-label="Remove avatar"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <label
                    htmlFor="avatar-upload-form"
                    className={`glass-strong flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition-all ${
                      isUploadingAvatar
                        ? "border-primary-400/50 bg-primary-400/10 cursor-wait"
                        : "border-white/20 hover:border-primary-400/50 hover:bg-white/5"
                    }`}
                  >
                    <svg className="h-5 w-5 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm font-medium text-dark-text">
                      {isUploadingAvatar ? "Uploading..." : avatarPreview ? "Change Avatar" : "Upload Avatar Image"}
                    </span>
                    <input
                      id="avatar-upload-form"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                  <p className="text-xs text-dark-muted text-center">
                    Click to select an image (Max 5MB, JPG/PNG/GIF)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 sm:gap-4 pt-3 sm:pt-4 flex-shrink-0">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="glass-strong flex-1 rounded-xl px-6 py-3 text-sm font-semibold text-dark-text transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-glow-primary disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </motion.button>
              </div>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2.5 sm:space-y-4 md:space-y-5 flex flex-col"
            >
              {/* Display Info - Premium Card Style */}
              <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                {/* Username Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-strong rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border border-white/10 hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20 p-1.5 sm:p-2 md:p-2.5 group-hover:scale-110 transition-transform">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="mb-0.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-dark-muted">Username</p>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-dark-text truncate" style={{ fontSize: '14px' }}>{user?.username || "N/A"}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Email Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 }}
                  className="glass-strong rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border border-white/10 hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-1.5 sm:p-2 md:p-2.5 group-hover:scale-110 transition-transform">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="mb-0.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-dark-muted">Email</p>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-dark-text truncate" style={{ fontSize: '13px', wordBreak: 'break-all' }}>{user?.email || "N/A"}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Phone Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="glass-strong rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border border-white/10 hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-1.5 sm:p-2 md:p-2.5 group-hover:scale-110 transition-transform">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="mb-0.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-dark-muted">Phone</p>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-dark-text" style={{ fontSize: '14px' }}>{user?.phone || "Not set"}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Member Since Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 }}
                  className="glass-strong rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 border border-white/10 hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-1.5 sm:p-2 md:p-2.5 group-hover:scale-110 transition-transform">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="mb-0.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-dark-muted">Member Since</p>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-dark-text" style={{ fontSize: '14px' }}>
                        {formatDate(user?.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Edit Button - Premium Style */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className="w-full rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r from-primary-500 via-purple-500 to-accent-500 px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 text-xs sm:text-sm font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:shadow-primary-500/50 relative overflow-hidden group mt-1 sm:mt-2"
                style={{ fontSize: '14px' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

