import { Mail } from "lucide-react";
import { PARTNER_LOGOS } from "@/components/PartnerLogos";

const EMAIL_OPTIONS = [
  {
    label: "Apple Mail",
    desc: "Default iOS email",
    url: "mailto:",
    logoKey: "apple_mail",
  },
  {
    label: "Gmail",
    desc: "Google email",
    url: "googlegmail:///co",
    fallback: "https://mail.google.com/mail/?view=cm",
    logoKey: "gmail",
  },
  {
    label: "Outlook",
    desc: "Microsoft email",
    url: "ms-outlook://compose",
    fallback: "https://outlook.live.com/mail/0/deeplink/compose",
    logoKey: "outlook_mail",
  },
];

export default function EmailComposeSheet({ onClose }: { onClose: () => void }) {
  function handlePick(option: (typeof EMAIL_OPTIONS)[number]) {
    if (option.fallback) {
      const w = window.open(option.url, "_blank");
      setTimeout(() => {
        if (!w || w.closed) {
          window.open(option.fallback, "_blank");
        }
      }, 500);
    } else {
      window.open(option.url, "_blank");
    }
    onClose();
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-medium">
          Open Email In…
        </h3>
      </div>

      <div className="space-y-1.5">
        {EMAIL_OPTIONS.map((opt) => {
          const Logo = PARTNER_LOGOS[opt.logoKey];
          return (
            <button
              key={opt.label}
              onClick={() => handlePick(opt)}
              className="w-full flex items-center gap-3 p-3.5 border border-border bg-card hover:border-foreground/20 hover:bg-muted transition-all duration-200 text-left"
            >
              {Logo && <Logo className="w-8 h-8 shrink-0" />}
              <div className="flex flex-col">
                <span className="font-mono text-[11px] uppercase tracking-wider text-foreground font-medium">
                  {opt.label}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">
                  {opt.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
