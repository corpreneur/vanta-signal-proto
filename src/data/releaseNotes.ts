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
    version: "1.5.0",
    date: "2026-03-19",
    title: "Fab Five Consistency & File Vault Content",
    changes: [
      { type: "improvement", text: "Pulsing status dot added to all Fab Five page headers — Focus, Easy Actions, Connectivity now match Signal Feed and Idea Capture" },
      { type: "improvement", text: "Idea Capture restyled to mirror Signal Feed layout — unified container width, underline tabs, metrics strip, and editorial typography" },
      { type: "feature", text: "File Vault populated with 14 test assets — hero images, mockups, floor plans, meeting notes, investor briefs, and CSV exports" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-03-19",
    title: "MetaLab V3 — Full Design System Overhaul",
    changes: [
      { type: "feature", text: "Focus View dashboard — large greeting hero, 'clear until' meeting status, top 3 prioritized signal preview" },
      { type: "feature", text: "Signal Detail Drawer redesign — Helpful Memory section, AI-proposed replies with inline editing & send" },
      { type: "feature", text: "Profile Menu Drawer — full account menu with My Plan, Billing History, Connected Accounts, Privacy & Data, Notifications Preferences, Help & Support, Send Feedback" },
      { type: "feature", text: "Idea Capture redesign — MetaLab-style tabbed capture (Note, Image, Link, Email, Voice) with session streak and recent captures" },
      { type: "improvement", text: "Signal cards streamlined — single-line header, compact metadata row, tighter action bar to reduce visual clutter" },
      { type: "improvement", text: "Profile menu organized into Account, Vanta Settings, Appearance, and Support sections" },
      { type: "improvement", text: "Capture Everywhere tools — Bookmarklet, ⌘K palette, and PWA install instructions in collapsible section" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-16",
    title: "PI-2 — Proactive Relationships, Quick Capture & File Storage",
    changes: [
      { type: "feature", text: "Contact Tagging & Grouping — tag contacts, filter the contact list by tag" },
      { type: "feature", text: "Automated Engagement Sequences — time-based outreach reminders per contact" },
      { type: "feature", text: "Global Quick Capture (⌘K) — universal keyboard shortcut for navigation and instant thought capture" },
      { type: "feature", text: "File Storage & Surfacing — upload and manage attachments on any signal via cloud storage" },
      { type: "improvement", text: "Contact cards show inline tags with add/remove controls" },
      { type: "improvement", text: "Contact timeline includes engagement sequence management" },
      { type: "improvement", text: "Signal Detail Drawer shows file attachments section with upload/view/delete" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-16",
    title: "Phase 3 — Ontology & Integration Layer",
    changes: [
      { type: "feature", text: "My Rules unified settings — Automation Rules, Custom Signal Types, and Source Weights in one personal ontology UI" },
      { type: "feature", text: "Calendar Sync settings — Google Calendar OAuth flow UI stub with sync direction and permissions preview" },
      { type: "feature", text: "Exportable Pre-Meeting Brief — Export to PDF and Email to Attendees actions on dossier pages" },
      { type: "improvement", text: "Settings tabs expanded with My Rules and Calendar tabs" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-16",
    title: "The Action Layer: Phase 2 — Temporal & Identity",
    changes: [
      { type: "feature", text: "Mode-driven dashboard layouts — Executive, Creative, and DND reshape the dashboard dynamically" },
      { type: "feature", text: "Daily Timeline replaces flat Recent Signals — Prep / Active / Review time blocks" },
      { type: "feature", text: "Confidence indicators on signal cards — color-coded AI classification scores" },
      { type: "improvement", text: "Executive mode filters timeline to high-priority signals only" },
      { type: "improvement", text: "DND mode shows minimal greeting + Action Items only" },
    ],
  },
  {
    version: "0.9.10",
    date: "2026-03-16",
    title: "The Action Layer: Phase 1 — Dashboard Intelligence",
    changes: [
      { type: "feature", text: "Inline Brain Dump on dashboard — 'What's on your mind?' input with edge function processing" },
      { type: "feature", text: "Action Items checklist — AI-derived tasks from high-priority and due-date signals" },
      { type: "feature", text: "What's Ahead block — upcoming meetings cross-referenced with cooling alerts" },
      { type: "feature", text: "Quick Actions in Signal Detail Drawer — functional Pin, Mark Done, and Set Reminder" },
      { type: "improvement", text: "Strategic docs stored in project (CMO Brief, Roadmap v2, PI-2 Plan, CPO Assessment)" },
    ],
  },
  {
    version: "0.9.9",
    date: "2026-03-16",
    title: "Interactive Network Graph & Release Notes",
    changes: [
      { type: "feature", text: "Interactive d3-force directed graph — canvas-based with zoom, pan, and click-to-focus" },
      { type: "feature", text: "Co-mention edge detection — contacts linked by shared signals and meeting co-attendance" },
      { type: "feature", text: "Mini contact cards on node click with signal breakdown and timeline link" },
      { type: "improvement", text: "Cluster-based layout grouping contacts by dominant signal type" },
      { type: "improvement", text: "Recency rings on graph nodes — accent, teal, amber, muted by last interaction age" },
    ],
  },
  {
    version: "0.9.8",
    date: "2026-03-14",
    title: "Tech Debt Cleanup & Logging Standardization",
    changes: [
      { type: "fix", text: "Removed all unsafe `as any` casts for pinned property across Signal Feed, Morning Context, and Signals page" },
      { type: "fix", text: "Contact Hub now correctly maps `pinned` field from database rows" },
      { type: "improvement", text: "Standardized error logging with `logError` across all 6 remaining edge functions" },
      { type: "fix", text: "Cleaned inappropriate language from mock data and case study content" },
    ],
  },
  {
    version: "0.9.7",
    date: "2026-03-14",
    title: "Signal Feed Curation & Contact Hub",
    changes: [
      { type: "feature", text: "Signal Feed temporal grouping — Today / Yesterday / This Week section headers" },
      { type: "feature", text: "Morning Context strip — date, meeting count, high-priority signals at a glance" },
      { type: "feature", text: "Inline quick-actions on signal cards — Done, Snooze, and Pin without opening drawer" },
      { type: "feature", text: "Contact Hub — redesigned contact timeline with relationship strength, suggested actions, and By-Type view" },
      { type: "feature", text: "Cross-link from Signal Detail Drawer to sender's Contact Hub page" },
      { type: "improvement", text: "Source priority weights in Settings — control which channels surface first" },
      { type: "improvement", text: "Pinned signals section at top of feed with dedicated visual treatment" },
    ],
  },
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
