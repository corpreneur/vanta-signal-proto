export interface ReleaseEntry {
  version: string;
  date: string; // ISO date
  title: string;
  changes: {
    type: "feature" | "fix" | "improvement" | "breaking";
    text: string;
  }[];
}

export const releaseNotes: ReleaseEntry[] = [
  {
    version: "0.9.4",
    date: "2026-03-12",
    title: "Brand-Forward Login & Dashboard",
    changes: [
      { type: "feature", text: "Cinematic login page with geometric circle animation and VANTA wordmark" },
      { type: "improvement", text: "Dashboard hero copy updated — 'So you can focus, decide, and move.'" },
      { type: "improvement", text: "Bold geometric background motif added to dashboard hero section" },
      { type: "feature", text: "Release notes page with version threading" },
    ],
  },
  {
    version: "0.9.3",
    date: "2026-03-11",
    title: "Unified Sidebar Shell",
    changes: [
      { type: "feature", text: "Persistent sidebar-driven shell with collapsible nav groups" },
      { type: "improvement", text: "Hamburger pill trigger consolidating menu icon and page title" },
      { type: "feature", text: "Context-aware breadcrumbs across all views" },
      { type: "fix", text: "Scroll-reset on cassette drawer case switching" },
    ],
  },
  {
    version: "0.9.2",
    date: "2026-03-10",
    title: "Brain Dump & Signal Architecture",
    changes: [
      { type: "feature", text: "Brain Dump capture page with AI-powered signal extraction" },
      { type: "feature", text: "Signal architecture visualization page" },
      { type: "improvement", text: "Tag browser with signal type counts" },
    ],
  },
  {
    version: "0.9.1",
    date: "2026-03-05",
    title: "Real-Time Signal Feed",
    changes: [
      { type: "feature", text: "Live signal feed with Supabase realtime subscriptions" },
      { type: "feature", text: "Pre-meeting brief cards with attendee context" },
      { type: "improvement", text: "Signal filters — type, sender, priority, overdue toggle" },
      { type: "fix", text: "Signal priority badge contrast in dark mode" },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-02-26",
    title: "Platform Foundation",
    changes: [
      { type: "feature", text: "Initial platform scaffold — routing, auth gate, theme system" },
      { type: "feature", text: "Case study pages with thread rendering" },
      { type: "feature", text: "Relationship graph visualization" },
      { type: "feature", text: "Product signal type pages (Intro, Phone, Meeting, Email, Calendar)" },
      { type: "breaking", text: "Session-based auth gate — skip-auth=1 param for dev access" },
    ],
  },
];
