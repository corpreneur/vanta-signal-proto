import type { SVGProps } from "react";

type LogoProps = SVGProps<SVGSVGElement>;

const GoogleLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
    <path d="M5.84 14.09A6.67 6.67 0 0 1 5.5 12c0-.72.12-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
  </svg>
);

const ZoomLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#2D8CFF" />
    <path d="M4 8.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z" fill="#fff" />
    <path d="M15 9.5l4-2.5v8l-4-2.5v-3Z" fill="#fff" />
  </svg>
);

const LinqLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#1BD760" />
    <path d="M7 7h2v10H7V7Zm4 4h2v6h-2v-6Zm4-2h2v8h-2V9Z" fill="#fff" />
  </svg>
);

const SlackLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5.04 15.2a2.12 2.12 0 1 1-2.12-2.12h2.12v2.12Zm1.07 0a2.12 2.12 0 1 1 4.24 0v5.31a2.12 2.12 0 1 1-4.24 0V15.2Z" fill="#E01E5A" />
    <path d="M8.23 5.04a2.12 2.12 0 1 1 2.12-2.12v2.12H8.23Zm0 1.07a2.12 2.12 0 1 1 0 4.24H2.92a2.12 2.12 0 1 1 0-4.24h5.31Z" fill="#36C5F0" />
    <path d="M18.96 8.23a2.12 2.12 0 1 1 2.12 2.12h-2.12V8.23Zm-1.07 0a2.12 2.12 0 1 1-4.24 0V2.92a2.12 2.12 0 1 1 4.24 0v5.31Z" fill="#2EB67D" />
    <path d="M15.77 18.96a2.12 2.12 0 1 1-2.12 2.12v-2.12h2.12Zm0-1.07a2.12 2.12 0 1 1 0-4.24h5.31a2.12 2.12 0 1 1 0 4.24h-5.31Z" fill="#ECB22E" />
  </svg>
);

const LinkedInLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M8.5 10v6.5H6V10h2.5ZM7.25 8.9a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9ZM18 16.5h-2.5v-3.17c0-.85-.3-1.43-1.06-1.43-.58 0-.92.39-1.07.76-.06.13-.07.32-.07.51V16.5H10.8s.03-6.5 0-6.5h2.5v.95a2.48 2.48 0 0 1 2.27-1.25c1.66 0 2.43 1.08 2.43 3.4v3.4Z" fill="#fff" />
  </svg>
);

const NotionLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="currentColor" className="text-foreground" />
    <path d="M5.5 5.2l6.3-.47c.78-.06 .98-.02 1.47.33l2.03 1.42c.33.23.44.3.44.56v10.62c0 .56-.2.88-.9.93l-7.38.43c-.52.03-.77-.05-1.05-.42L4.63 16.3c-.33-.45-.47-.78-.47-1.2V6.12c0-.55.2-.87.87-.93Z" fill="hsl(var(--background))" />
    <path d="M11.07 8.2v7.5l-3.89.23V9.3l-.97.07v-.95l4.86-.33v.11Z" fill="currentColor" className="text-foreground" />
    <path d="M12.38 7.9l4.34-.3v8.57l-2.35.14v-6.5L12.38 10V7.9Z" fill="currentColor" className="text-foreground" />
  </svg>
);

const FirefliesLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#6C3CFF" />
    <circle cx="12" cy="8" r="2.5" fill="#fff" />
    <circle cx="8" cy="14" r="1.5" fill="#fff" opacity="0.7" />
    <circle cx="16" cy="14" r="1.5" fill="#fff" opacity="0.7" />
    <circle cx="12" cy="18" r="1" fill="#fff" opacity="0.5" />
  </svg>
);

const OtterLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#1A1A2E" />
    <path d="M12 5c-3 0-5.5 2.2-5.5 5s2 4 3.5 5.5c.5.5 1 1.5 1 2.5h2c0-1 .5-2 1-2.5C15.5 14 17.5 12.2 17.5 10S15 5 12 5Z" fill="#3B82F6" />
    <circle cx="10" cy="9.5" r="1" fill="#fff" />
    <circle cx="14" cy="9.5" r="1" fill="#fff" />
  </svg>
);

const GoogleMeetLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#00897B" />
    <path d="M5 8.5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 14 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 5 15.5v-7Z" fill="#fff" />
    <path d="M14 10l4.5-2.5v9L14 14v-4Z" fill="#fff" />
  </svg>
);

const TeamsLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#6264A7" />
    <circle cx="14" cy="7.5" r="2.5" fill="#fff" />
    <rect x="4" y="9" width="11" height="8" rx="1.5" fill="#fff" />
    <path d="M17 10h2.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H17V10Z" fill="#fff" opacity="0.7" />
    <circle cx="18.5" cy="7" r="1.5" fill="#fff" opacity="0.7" />
  </svg>
);


const PhoneCallLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="hsl(142 71% 45%)" />
    <path d="M8.5 6.5c.3-.5 1-.8 1.5-.5l1.5 1a1 1 0 0 1 .3 1.3l-.8 1.2a8.5 8.5 0 0 0 3.5 3.5l1.2-.8a1 1 0 0 1 1.3.3l1 1.5c.3.5 0 1.2-.5 1.5l-1.5 1c-2 1.2-5.5-.5-8-3s-4.2-6-3-8l1-1.5Z" fill="#fff" />
  </svg>
);

const IdeaCaptureLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="currentColor" className="text-primary" />
    <path d="M12 4l1.76 5.42h5.7l-4.61 3.35 1.76 5.42L12 14.84l-4.61 3.35 1.76-5.42-4.61-3.35h5.7z" fill="hsl(var(--primary-foreground))" />
  </svg>
);

const GranolaLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="hsl(30 60% 50%)" />
    <path d="M12 5c-1.5 0-2.8.6-3.8 1.5C7.2 7.5 6.5 9 6.5 10.5c0 2.5 1.8 4.5 4 5.2v2.3c0 .6.7 1 1.2.6l.3-.2.3.2c.5.4 1.2 0 1.2-.6v-2.3c2.2-.7 4-2.7 4-5.2 0-1.5-.7-3-1.7-4C14.8 5.6 13.5 5 12 5Z" fill="#fff" />
    <circle cx="10.5" cy="10" r="1" fill="hsl(30 60% 50%)" />
    <circle cx="13.5" cy="10" r="1" fill="hsl(30 60% 50%)" />
    <circle cx="12" cy="12.5" r="0.8" fill="hsl(30 60% 50%)" />
  </svg>
);

/* ── App / Service Logos ── */

const AppleCalendarLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="5" fill="#FF3B30" />
    <rect x="3" y="7" width="18" height="14" rx="2" fill="#fff" />
    <rect x="3" y="3" width="18" height="6" rx="2" fill="#FF3B30" />
    <text x="12" y="18" textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold" fontFamily="system-ui">17</text>
  </svg>
);

const GoogleCalendarLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#fff" />
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#4285F4" />
    <rect x="4" y="7" width="16" height="13" rx="1.5" fill="#fff" />
    <rect x="4" y="4" width="16" height="5" rx="1.5" fill="#4285F4" />
    <line x1="8" y1="10" x2="8" y2="18" stroke="#E8EAED" strokeWidth="0.5" />
    <line x1="12" y1="10" x2="12" y2="18" stroke="#E8EAED" strokeWidth="0.5" />
    <line x1="16" y1="10" x2="16" y2="18" stroke="#E8EAED" strokeWidth="0.5" />
    <line x1="4" y1="12" x2="20" y2="12" stroke="#E8EAED" strokeWidth="0.5" />
    <line x1="4" y1="15" x2="20" y2="15" stroke="#E8EAED" strokeWidth="0.5" />
    <rect x="9" y="10.5" width="2.5" height="2" rx="0.3" fill="#4285F4" />
    <rect x="13" y="13" width="2.5" height="2" rx="0.3" fill="#0B8043" />
    <rect x="5.5" y="13" width="2.5" height="2" rx="0.3" fill="#F4B400" />
  </svg>
);

const OutlookCalendarLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#0078D4" />
    <rect x="4" y="7" width="16" height="13" rx="1.5" fill="#fff" />
    <rect x="4" y="4" width="16" height="5" rx="1.5" fill="#0078D4" />
    <text x="12" y="17.5" textAnchor="middle" fill="#0078D4" fontSize="7" fontWeight="bold" fontFamily="system-ui">20</text>
  </svg>
);

const AppleMailLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="5" fill="#007AFF" />
    <rect x="3" y="6" width="18" height="12" rx="2" fill="#fff" />
    <path d="M3 8l9 5.5L21 8" stroke="#007AFF" strokeWidth="1.5" fill="none" />
  </svg>
);

const GmailLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#fff" />
    <rect x="2" y="5" width="20" height="14" rx="2" fill="#F6F6F6" />
    <path d="M4 7l8 5.5L20 7" stroke="#EA4335" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <rect x="2" y="5" width="3" height="14" fill="#4285F4" rx="1" />
    <rect x="19" y="5" width="3" height="14" fill="#4285F4" rx="1" />
    <rect x="2" y="5" width="20" height="2" rx="1" fill="#EA4335" />
  </svg>
);

const OutlookMailLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect width="24" height="24" rx="4" fill="#0078D4" />
    <rect x="3" y="6" width="18" height="12" rx="2" fill="#fff" />
    <path d="M3 8l9 5.5L21 8" stroke="#0078D4" strokeWidth="1.5" fill="none" />
    <ellipse cx="9" cy="13" rx="4" ry="3.5" fill="#0078D4" />
    <text x="9" y="15" textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold" fontFamily="system-ui">O</text>
  </svg>
);

export const PARTNER_LOGOS: Record<string, React.FC<LogoProps>> = {
  google: GoogleLogo,
  zoom: ZoomLogo,
  linq: LinqLogo,
  slack: SlackLogo,
  linkedin: LinkedInLogo,
  notion: NotionLogo,
  fireflies: FirefliesLogo,
  otter: OtterLogo,
  google_meet: GoogleMeetLogo,
  teams: TeamsLogo,
  webex: WebexLogo,
  phone_call: PhoneCallLogo,
  "idea-capture": IdeaCaptureLogo,
  granola: GranolaLogo,
  apple_calendar: AppleCalendarLogo,
  google_calendar: GoogleCalendarLogo,
  outlook_calendar: OutlookCalendarLogo,
  apple_mail: AppleMailLogo,
  gmail: GmailLogo,
  outlook_mail: OutlookMailLogo,
};

export default PARTNER_LOGOS;
