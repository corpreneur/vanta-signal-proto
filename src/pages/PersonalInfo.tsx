import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Motion } from "@/components/ui/motion";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Berlin",
  "Asia/Tokyo", "Australia/Sydney",
];

export default function PersonalInfo() {
  const [userEmail, setUserEmail] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "+1 (555) 234-8901",
    company: "Vanta Capital",
    role: "Managing Partner",
    timezone: "America/New_York",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || "");
        const meta = data.user.user_metadata;
        setForm((f) => ({
          ...f,
          fullName: meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "",
        }));
      }
    });
  }, []);

  const handleSave = () => {
    setSaved(true);
    toast.success("Profile updated.");
    setTimeout(() => setSaved(false), 2000);
  };

  const initial = form.fullName?.charAt(0)?.toUpperCase() || "V";

  return (
    <div className="max-w-[600px] mx-auto px-5 py-8 md:py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Dashboard
      </Link>

      <Motion>
        <h1 className="font-display text-[clamp(22px,4vw,32px)] leading-tight text-foreground mb-1">
          Personal Info
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-8">
          Manage your profile details
        </p>
      </Motion>

      {/* Avatar */}
      <Motion delay={40}>
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
              <span className="font-display text-3xl text-primary">{initial}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:scale-105 transition-transform">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <p className="font-sans text-[15px] font-medium text-foreground">{form.fullName}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </Motion>

      {/* Form */}
      <Motion delay={80}>
        <div className="space-y-5">
          <Field label="Full Name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          <Field label="Email" value={userEmail} disabled hint="Contact support to change email" />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label="Role / Title" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />

          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block">
              Timezone
            </label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full h-10 px-3 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </Motion>

      {/* Save */}
      <Motion delay={120}>
        <div className="flex justify-end mt-8 pt-6 border-t border-border">
          <Button onClick={handleSave} className="gap-2">
            {saved ? <Check className="w-4 h-4" /> : null}
            {saved ? "Saved" : "Save Changes"}
          </Button>
        </div>
      </Motion>
    </div>
  );
}

function Field({
  label, value, onChange, disabled, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void; disabled?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={disabled ? "opacity-60" : ""}
      />
      {hint && <p className="font-mono text-[9px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
