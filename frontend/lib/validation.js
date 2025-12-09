/**
 * World-class form validation utilities
 * WCAG compliant, enterprise-level validation
 */

/**
 * Email validation
 */
export function validateEmail(email) {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }
  
  return { isValid: true, error: null };
}

/**
 * Password validation
 */
export function validatePassword(password, minLength = 8) {
  if (!password || password.trim() === "") {
    return { isValid: false, error: "Password is required" };
  }
  
  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters long` };
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
 * Username validation
 */
export function validateUsername(username) {
  if (!username || username.trim() === "") {
    return { isValid: false, error: "Username is required" };
  }
  
  const trimmed = username.trim();
  
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
  
  return { isValid: true, error: null };
}

/**
 * Phone validation
 */
export function validatePhone(phone) {
  if (!phone || phone.trim() === "") {
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
  
  return { isValid: true, error: null };
}

/**
 * Required field validation
 */
export function validateRequired(value, fieldName = "This field") {
  if (!value || value.toString().trim() === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true, error: null };
}

/**
 * Text field validation with length constraints
 */
export function validateText(text, options = {}) {
  const {
    required = true,
    minLength = 0,
    maxLength = Infinity,
    fieldName = "This field",
    allowEmpty = false,
  } = options;
  
  if (!text && !allowEmpty) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (text && text.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` };
  }
  
  if (text && text.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  return { isValid: true, error: null };
}

/**
 * Format text with proper capitalization
 */
export function formatText(text, options = {}) {
  const { capitalizeFirst = false, trim = true } = options;
  
  let formatted = text;
  
  if (trim) {
    formatted = formatted.trim();
  }
  
  if (capitalizeFirst && formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
  
  return formatted;
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  }
  
  return cleaned;
}

