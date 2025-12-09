/**
 * Backend validation utilities
 * Server-side validation for API routes
 */

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: "Email is required" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Invalid email format" };
  }
  
  if (trimmed.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }
  
  return { isValid: true, error: null, normalized: trimmed };
}

/**
 * Validate password
 */
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Password is required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: "Password is too long" };
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: "Password must contain at least one letter and one number" };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate username
 */
export function validateUsername(username) {
  if (!username || typeof username !== "string") {
    return { isValid: false, error: "Username is required" };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: "Username is required" };
  }
  
  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" };
  }
  
  if (trimmed.length > 30) {
    return { isValid: false, error: "Username must be less than 30 characters" };
  }
  
  // Only alphanumeric, underscore, and hyphen allowed
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { isValid: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
  }
  
  // First character must be a letter or number
  if (!/^[a-zA-Z0-9]/.test(trimmed)) {
    return { isValid: false, error: "Username must start with a letter or number" };
  }
  
  return { isValid: true, error: null, normalized: trimmed };
}

/**
 * Validate phone number
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, error: "Phone number is required" };
  }
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  
  // Check if it's all digits
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: "Phone number must contain only digits" };
  }
  
  // Check length (typically 10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { isValid: false, error: "Phone number must be between 10 and 15 digits" };
  }
  
  return { isValid: true, error: null, normalized: cleaned };
}

/**
 * Validate optional phone number
 */
export function validateOptionalPhone(phone) {
  if (!phone || phone.trim() === "") {
    return { isValid: true, error: null, normalized: "" };
  }
  return validatePhone(phone);
}

