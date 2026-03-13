import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/vanta-hero.jpg";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      setError("Invalid or expired reset link.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <img src={heroImage} alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-background from-35% via-background/95 via-50% to-background/30" />
      </div>

      <div className="relative z-10 w-full max-w-[360px] px-5">
        <h1 className="font-display text-[32px] text-foreground mb-2">Reset Password</h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-8">
          Set your new password
        </p>

        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-background/60 backdrop-blur-sm border border-vanta-border px-3 font-mono text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none focus:border-vanta-accent-border transition-colors"
                placeholder="Min 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full h-11 bg-background/60 backdrop-blur-sm border border-vanta-border px-3 font-mono text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none focus:border-vanta-accent-border transition-colors"
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>

            {error && <p className="font-mono text-[11px] text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-stone-300 text-stone-900 font-mono text-[11px] uppercase tracking-[0.15em] hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <p className="font-mono text-[11px] text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;