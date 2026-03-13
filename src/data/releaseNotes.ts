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
    version: "0.9.6",
    date: "2026-03-13",
    title: "Q2 Strategic Features & Tech Debt Sprint",
    changes: [
      { type: "feature", text: "Smart Contact List — unified contact intelligence with signal aggregation, sorting, and search" },
      { type: "feature", text: "Noise Review Queue — promote or dismiss AI-classified noise signals" },
      { type: "feature", text: "User Modes — Creative, Executive, and DND modes with persistent settings" },
      { type: "improvement", text: "Structured error logging to database across all edge functions" },
      { type: "fix", text: "Signal detail drawer now resets scroll position on signal switch" },
      { type: "improvement", text: "Removed legacy flat-payload support from Linq webhook (v3 strict)" },
    ],
  },
  {
    version: "0.9.5",
    date: "2026-03-13",
    title: "Light Mode & Theme Stabilization",
    changes: [
      { type: "fix", text: "Purged residual lime-green accent from light mode — replaced with warm charcoal palette" },
      { type: "improvement", text: "Improved light-mode contrast for dashboard stats, FAB, and pipeline indicators" },
      { type: "fix", text: "Theme toggle now defaults to light mode and syncs correctly with localStorage" },
    ],
  },
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
