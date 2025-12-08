"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import UserBadge from "@/components/UserBadge";
import { getProfile, updateProfile } from "@/lib/profile";

/**
 * Profile page component
 * Premium UI with edit functionality
 */
export default function ProfilePageClient({ initialUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });

  useEffect(() => {
    // Refresh user data
    loadProfile();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedUser = await updateProfile(formData);
      setUser(updatedUser);
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
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background-dark via-background-dark to-primary-900/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="glass-strong flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </motion.button>
          <h1 className="text-2xl font-bold text-gradient bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Profile
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        {/* Profile Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          {/* Avatar Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-4">
              <UserBadge user={user} size="xl" showStatus={false} />
              {isEditing && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-2 -right-2"
                >
                  <label className="glass-strong flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-white/20">
                    <svg className="h-5 w-5 text-dark-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        // Handle image upload (placeholder for now)
                        toast.info("Image upload feature coming soon");
                      }}
                    />
                  </label>
                </motion.div>
              )}
            </div>
            <h2 className="text-xl font-semibold text-dark-text">{user?.username || "User"}</h2>
            <p className="text-sm text-dark-muted">{user?.email}</p>
          </div>

          {/* Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-text">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="glass-strong w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-dark-text placeholder-dark-muted outline-none transition-all focus:border-primary-400 focus:bg-white/10"
                  placeholder="Enter username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-text">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="glass-strong w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-dark-text placeholder-dark-muted outline-none transition-all focus:border-primary-400 focus:bg-white/10"
                  placeholder="Enter email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-text">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="glass-strong w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-dark-text placeholder-dark-muted outline-none transition-all focus:border-primary-400 focus:bg-white/10"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-text">Avatar URL</label>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  className="glass-strong w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-dark-text placeholder-dark-muted outline-none transition-all focus:border-primary-400 focus:bg-white/10"
                  placeholder="Enter avatar URL (optional)"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
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
            <div className="space-y-6">
              {/* Display Info */}
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs text-dark-muted">Username</p>
                  <p className="text-lg font-semibold text-dark-text">{user?.username || "N/A"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-dark-muted">Email</p>
                  <p className="text-lg font-semibold text-dark-text">{user?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-dark-muted">Phone</p>
                  <p className="text-lg font-semibold text-dark-text">{user?.phone || "Not set"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-dark-muted">Member Since</p>
                  <p className="text-lg font-semibold text-dark-text">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className="w-full rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-glow-primary"
              >
                Edit Profile
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

