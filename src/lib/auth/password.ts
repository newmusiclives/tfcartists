/**
 * Password validation utilities for per-user credentials.
 *
 * Rules:
 *  - Minimum 8 characters
 *  - At least one letter (a-z or A-Z)
 *  - At least one number (0-9)
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least one letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return { valid: errors.length === 0, errors };
}
