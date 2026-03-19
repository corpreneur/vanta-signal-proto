import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  User, CreditCard, Settings2, LogOut, ChevronRight,
  Bell, Shield, Palette, BookOpen, HelpCircle, Mail,
  Receipt, Link2, Lock, MessageSquare, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ProfileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ACCOUNT_ITEMS = [
  { label: "Personal Info", icon: User, href: "/settings/profile" },
  { label: "My Plan", icon: Sparkles, href: "/settings/plan" },
  { label: "Billing History", icon: Receipt, href: "/settings/billing" },
  { label: "Connected Accounts", icon: Link2, href: "/settings/connected" },
];

const VANTA_SETTINGS = [
  { label: "My Rules", icon: BookOpen, href: "/my-rules" },
  { label: "Filter Modes", icon: Settings2, href: "/focus" },
  { label: "Notifications Preferences", icon: Bell, href: "/settings/notifications" },
  { label: "Privacy & Data", icon: Lock, href: "/settings/privacy" },
  { label: "Admin", icon: Shield, href: "/admin" },
];

const SUPPORT_ITEMS = [
  { label: "Help & Support", icon: HelpCircle, href: "/releases" },
  { label: "Send Feedback", icon: MessageSquare, href: "/releases" },
  { label: "Release Notes", icon: BookOpen, href: "/releases" },
];

function MenuRow({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors group">
      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span className="flex-1 text-left font-sans text-[14px]">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default function ProfileMenuDrawer({ open, onClose }: ProfileMenuDrawerProps) {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || null);
        const meta = data.user.user_metadata;
        setUserName(meta?.full_name || meta?.name || data.user.email?.split("@")[0] || "User");
      }
    });
  }, [open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate("/login");
  };

  const handleNav = (href: string) => {
    onClose();
    navigate(href);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[360px] bg-background border-l border-border p-0 flex flex-col">

        {/* ── User header ── */}
        <SheetHeader className="px-6 pt-8 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
              <span className="font-display text-[22px] text-primary">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-display text-[17px] text-foreground text-left truncate">{userName}</SheetTitle>
              {userEmail && <p className="font-mono text-[11px] text-muted-foreground truncate">{userEmail}</p>}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Account section */}
          <div className="px-6 py-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Account</p>
            <div className="space-y-0.5">
              {ACCOUNT_ITEMS.map((item) => (
                <MenuRow key={item.label} label={item.label} icon={item.icon} onClick={() => handleNav(item.href)} />
              ))}
            </div>
          </div>

          <div className="mx-6 border-t border-border" />

          {/* VANTA Settings section */}
          <div className="px-6 py-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Vanta Settings</p>
            <div className="space-y-0.5">
              {VANTA_SETTINGS.map((item) => (
                <MenuRow key={item.label} label={item.label} icon={item.icon} onClick={() => handleNav(item.href)} />
              ))}
            </div>
          </div>

          <div className="mx-6 border-t border-border" />

          {/* Appearance */}
          <div className="px-6 py-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Appearance</p>
            <div className="flex items-center gap-3 px-3 py-3">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 font-sans text-[14px] text-foreground/80">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="mx-6 border-t border-border" />

          {/* Support & Help */}
          <div className="px-6 py-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Support</p>
            <div className="space-y-0.5">
              {SUPPORT_ITEMS.map((item) => (
                <MenuRow key={item.label} label={item.label} icon={item.icon} onClick={() => handleNav(item.href)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Log Out footer ── */}
        <div className="px-6 py-4 border-t border-border">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors group">
            <LogOut className="w-4 h-4" />
            <span className="font-sans text-[14px] font-medium">Log Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
