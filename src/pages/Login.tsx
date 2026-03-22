import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/vanta-hero.jpg";

type AuthMode = "login" | "signup" | "forgot";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setMessage("Check your email to confirm your account, then sign in.");
      setMode("login");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Password reset email sent. Check your inbox.");
    }
    setLoading(false);
  };

  const handleSubmit = mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-end sm:justify-center relative overflow-hidden">
      {/* Hero image */}
      <div
        className="absolute inset-0 opacity-0"
        style={{ animation: "fadeUp 1.2s ease-out 0.1s forwards" }}
      >
        <img src={heroImage} alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-background from-25% via-background/60 via-50% to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center px-5 pb-10 sm:pb-16">
        {/* Brand */}
        <div
          className="mb-10 text-center opacity-0"
          style={{ animation: "fadeUp 0.8s ease-out 0.5s forwards" }}
        >
          <h1 className="font-display text-[48px] sm:text-[64px] leading-none text-foreground tracking-tight">
            VANTA
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-vanta-text-low mt-3">
            Less noise, more progress
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full space-y-4 opacity-0"
          style={{ animation: "fadeUp 0.7s ease-out 0.8s forwards" }}
          data-testid="auth-form"
        >
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 bg-background/60 backdrop-blur-sm border border-vanta-border px-3 font-mono text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none focus:border-vanta-accent-border transition-colors"
              placeholder="you@example.com"
              autoComplete="email"
              required
              data-testid="email-input"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-background/60 backdrop-blur-sm border border-vanta-border px-3 font-mono text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none focus:border-vanta-accent-border transition-colors"
                placeholder={mode === "signup" ? "Min 8 characters" : "Enter password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                data-testid="password-input"
              />
            </div>
          )}

          {error && <p className="font-mono text-[11px] text-destructive">{error}</p>}
          {message && <p className="font-mono text-[11px] text-vanta-accent">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-foreground text-background font-mono text-[11px] uppercase tracking-[0.15em] hover:bg-foreground/90 transition-colors disabled:opacity-50 mt-2"
          >
            {loading
              ? "Processing..."
              : mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
          </button>

          <div className="flex justify-between pt-1">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                  className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground transition-colors"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                  className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground transition-colors"
                >
                  Forgot Password
                </button>
              </>
            )}
            {mode !== "login" && (
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground transition-colors"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </form>

        <p
          className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted text-center mt-8 opacity-0"
          style={{ animation: "fadeUp 0.6s ease-out 1.1s forwards" }}
        >
          Proprietary · Confidential
        </p>
      </div>
    </div>
  );
};

export default Login;