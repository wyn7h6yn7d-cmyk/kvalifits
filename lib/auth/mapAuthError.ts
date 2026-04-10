type Translator = (key: string) => string;

function msg(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "";
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    return typeof m === "string" ? m : "";
  }
  return "";
}

function code(err: unknown): string {
  if (!err || typeof err !== "object") return "";
  const c = (err as { code?: unknown }).code;
  return typeof c === "string" ? c : "";
}

export function mapAuthError(err: unknown, t: Translator): string {
  const m = msg(err);
  const c = code(err);
  const lower = m.toLowerCase();

  // Supabase Auth: invalid sign-in
  if (
    c === "invalid_credentials" ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return t("errorInvalidCredentials");
  }

  // Email already used
  if (
    c === "user_already_exists" ||
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("already exists")
  ) {
    return t("errorEmailInUse");
  }

  // Email not confirmed
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return t("errorEmailNotConfirmed");
  }

  // Rate limiting / abuse protection
  if (lower.includes("too many requests") || lower.includes("rate limit") || lower.includes("over_email_send_rate_limit")) {
    return t("errorRateLimited");
  }

  // Invalid email
  if (lower.includes("invalid email") || lower.includes("email address is invalid")) {
    return t("errorInvalidEmail");
  }

  // Weak password
  if (lower.includes("password") && (lower.includes("weak") || lower.includes("at least") || lower.includes("too short"))) {
    return t("errorWeakPassword");
  }

  return m || t("unknownError");
}

