/** Single password rule for signup, login helpers, and Firebase weak-password copy. */
export const MIN_PASSWORD_LENGTH = 8
export const PASSWORD_RULE_HINT = `At least ${MIN_PASSWORD_LENGTH} characters`
export const PASSWORD_TOO_SHORT = `Password must be ${MIN_PASSWORD_LENGTH}+ characters`
