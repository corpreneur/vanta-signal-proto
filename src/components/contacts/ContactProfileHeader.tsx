import { useState } from "react";
import { Phone, MessageSquare, Mail, Edit3, Check, X, Building2, Briefcase, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ContactProfileHeaderProps {
  name: string;
  strength: number;
  strengthLabel: string;
  signalCount: number;
  daysSinceLast: number;
}

/** Fetch stored profile metadata from CONTEXT signals with _vanta_contact_profile */
function useContactProfile(name: string) {
  return useQuery({
    queryKey: ["contact-profile", name],
    queryFn: async () => {
      const { data } = await supabase
        .from("signals")
        .select("raw_payload")
        .eq("sender", name)
        .eq("signal_type", "CONTEXT")
        .order("captured_at", { ascending: false })
        .limit(50);

      // Find the latest profile-type context signal
      const profileSignal = (data || []).find(
        (row: any) => (row.raw_payload as any)?._vanta_contact_profile
      );
      const contextSignal = (data || []).find(
        (row: any) => (row.raw_payload as any)?._vanta_contact_context
      );

      return {
        role: (profileSignal?.raw_payload as any)?.role || "",
        company: (profileSignal?.raw_payload as any)?.company || "",
        email: (profileSignal?.raw_payload as any)?.email || "",
        phone: (profileSignal?.raw_payload as any)?.phone || "",
        where: (contextSignal?.raw_payload as any)?.where || "",
        keyDetail: (contextSignal?.raw_payload as any)?.key_detail || "",
      };
    },
  });
}

export default function ContactProfileHeader({ name, strength, strengthLabel, signalCount, daysSinceLast }: ContactProfileHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: profile } = useContactProfile(name);

  // Sync local state when profile loads
  const displayRole = editing ? role : (profile?.role || "");
  const displayCompany = editing ? company : (profile?.company || "");
  const displayEmail = editing ? email : (profile?.email || "");
  const displayPhone = editing ? phone : (profile?.phone || "");

  const startEdit = () => {
    setRole(profile?.role || "");
    setCompany(profile?.company || "");
    setEmail(profile?.email || "");
    setPhone(profile?.phone || "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("signals").insert({
      sender: name,
      summary: `Profile updated: ${role || "—"} at ${company || "—"}`,
      source_message: `Role: ${role}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}`,
      signal_type: "CONTEXT",
      source: "manual",
      priority: "low",
      raw_payload: {
        _vanta_contact_profile: true,
        role,
        company,
        email,
        phone,
        updated_at: new Date().toISOString(),
      },
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      qc.invalidateQueries({ queryKey: ["contact-profile", name] });
      toast.success("Profile updated");
      setEditing(false);
    }
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const strengthColor =
    strength >= 75 ? "bg-emerald-500" :
    strength >= 50 ? "bg-sky-500" :
    strength >= 25 ? "bg-amber-500" : "bg-muted-foreground";

  return (
    <div className="flex flex-col sm:flex-row gap-5 items-start">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground font-display text-xl ${strengthColor}`}>
          {initials}
        </div>
        {/* Strength ring */}
        <svg className="absolute -inset-1 w-[72px] h-[72px]" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          <circle
            cx="36" cy="36" r="34" fill="none"
            stroke="hsl(var(--primary))" strokeWidth="2"
            strokeDasharray={`${(strength / 100) * 213.6} 213.6`}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
            className="transition-all duration-700"
          />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-display text-[clamp(24px,4vw,32px)] leading-tight text-foreground truncate">
            {name}
          </h1>
          {!editing && (
            <button
              onClick={startEdit}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit profile"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role & Company */}
        {editing ? (
          <div className="space-y-2 mb-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5 block">Role</label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Managing Partner"
                  className="w-full bg-background border border-border px-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex-1">
                <label className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5 block">Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Capital"
                  className="w-full bg-background border border-border px-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5 block">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-background border border-border px-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex-1">
                <label className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5 block">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="w-full bg-background border border-border px-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Check className="w-3 h-3" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            {(displayRole || displayCompany) && (
              <p className="font-mono text-[11px] text-muted-foreground flex items-center gap-2 mb-1">
                {displayRole && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {displayRole}
                  </span>
                )}
                {displayRole && displayCompany && <span className="text-border">·</span>}
                {displayCompany && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {displayCompany}
                  </span>
                )}
              </p>
            )}
            {profile?.where && (
              <p className="font-mono text-[9px] text-muted-foreground/70 mb-1">
                Met: {profile.where}
              </p>
            )}
            {profile?.keyDetail && (
              <p className="font-mono text-[9px] text-muted-foreground/70">
                Key: {profile.keyDetail}
              </p>
            )}
          </div>
        )}

        {/* Quick action buttons */}
        <div className="flex gap-2">
          {displayPhone && (
            <a
              href={`tel:${displayPhone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Phone className="w-3 h-3" /> Call
            </a>
          )}
          {displayEmail && (
            <a
              href={`mailto:${displayEmail}`}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Mail className="w-3 h-3" /> Email
            </a>
          )}
          <button className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <MessageSquare className="w-3 h-3" /> Text
          </button>
          <button
            onClick={() => window.open("https://zoom.us/start/videomeeting", "_blank", "noopener,noreferrer")}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-vanta-accent-zoom-border text-vanta-accent-zoom hover:bg-vanta-accent-zoom-faint transition-colors"
          >
            <Video className="w-3 h-3" /> Zoom
          </button>
          <a
            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> LinkedIn
          </a>
        </div>
      </div>

      {/* Strength badge */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`font-mono text-2xl font-bold ${
          strength >= 75 ? "text-emerald-500" :
          strength >= 50 ? "text-sky-500" :
          strength >= 25 ? "text-amber-500" : "text-muted-foreground"
        }`}>
          {strength}
        </span>
        <span className={`font-mono text-[9px] uppercase tracking-widest ${
          strength >= 75 ? "text-emerald-500" :
          strength >= 50 ? "text-sky-500" :
          strength >= 25 ? "text-amber-500" : "text-muted-foreground"
        }`}>
          {strengthLabel}
        </span>
      </div>
    </div>
  );
}
