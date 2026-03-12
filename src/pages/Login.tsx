import { useState } from "react";
import { useNavigate } from "react-router-dom";

const VALID_USERNAME = "vantasignals";
const VALID_PASSWORD = "ScalingEffects26!";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        sessionStorage.setItem("vanta-auth", "true");
        navigate("/");
      } else {
        setError("Invalid credentials");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[360px] opacity-0 animate-fade-up">
        {/* Logo */}
        <div className="mb-12 text-center">
          <h1 className="font-display text-[42px] leading-none text-foreground tracking-tight">
            VANTA
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low">
              Signal Intelligence
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 bg-vanta-bg-elevated border border-vanta-border px-3 font-mono text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none focus:border-vanta-accent-border transition-colors"
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 bg-vanta-bg-elevated border border-vanta-border px-3 font-mono text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none focus:border-vanta-accent-border transition-colors"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="font-mono text-[11px] text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating…" : "Access Platform"}
          </button>
        </form>

        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted text-center mt-10">
          Proprietary · Confidential
        </p>
      </div>
    </div>
  );
};

export default Login;
