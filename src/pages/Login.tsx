import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/vanta-hero.jpg";

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-end sm:justify-center relative overflow-hidden">
      {/* Hero image — full bleed background */}
      <div
        className="absolute inset-0 opacity-0"
        style={{ animation: "fadeUp 1.2s ease-out 0.1s forwards" }}
      >
        <img
          src={heroImage}
          alt=""
          className="w-full h-full object-cover object-top"
        />
        {/* Gradient overlay — heavier bottom fade to fully mask image text behind form */}
        <div className="absolute inset-0 bg-gradient-to-t from-background from-35% via-background/95 via-50% to-background/30" />
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
        >
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 bg-background/60 backdrop-blur-sm border border-vanta-border px-3 font-mono text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none focus:border-vanta-accent-border transition-colors"
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
              className="w-full h-11 bg-background/60 backdrop-blur-sm border border-vanta-border px-3 font-mono text-[13px] text-foreground placeholder:text-vanta-text-muted focus:outline-none focus:border-vanta-accent-border transition-colors"
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
            className="w-full h-11 bg-stone-300 text-stone-900 font-mono text-[11px] uppercase tracking-[0.15em] hover:bg-stone-200 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating…" : "Access Platform"}
          </button>
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
