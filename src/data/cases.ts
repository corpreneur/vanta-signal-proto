export interface Message {
  sender: string;
  direction: 'in' | 'out';
  text: string;
  link?: { source: string; title: string };
  timestamp?: string;
  separator?: boolean;
}

export interface Thread {
  header: string;
  messages: Message[];
}

export interface Step {
  n: string;
  title: string;
  desc: string;
}

export interface Quote {
  label: string;
  text: string;
  attr: string;
}

export interface BioItem {
  key: string;
  value: string;
}

export interface PrepItem {
  n: string;
  title: string;
  desc: string;
}

export interface CaseSection {
  type: 'steps' | 'quote' | 'hr' | 'signal-architecture' | 'five-layers' | 'bio' | 'meeting-prep';
  label?: string;
  steps?: Step[];
  quote?: Quote;
  bioItems?: BioItem[];
  prepItems?: PrepItem[];
}

export interface CaseData {
  num: string;
  id: string;
  name: string;
  cat: string;
  sub: string;
  cardCat: string;
  cardDesc: string;
  cardSignal: { label: string; text: string };
  cardMeta: { layer: string; output: string };
  standaloneHref: string;
  heroQuote: Quote;
  situation: string[];
  thread: Thread;
  sections: CaseSection[];
  callout: { main: string; sub: string };
  tags: string[];
}

export const cases: CaseData[] = [
  {
    num: "Use Case — 01",
    id: "01",
    name: "Signal to Noise",
    cat: "Signal Intelligence · Agentic Orchestration",
    sub: "iMessage · Email · Calendar · Automatic Orchestration",
    cardCat: "Signal Intelligence",
    cardDesc: "A single iMessage from Steve Stoute — one name, three words of context — and Vanta orchestrates a full intelligence sequence: bio research, meeting prep, outreach email, persistent agent.",
    cardSignal: { label: "Signal", text: "Noise" },
    cardMeta: { layer: "Intelligence", output: "Brief + Bio" },
    standaloneHref: "/case-01",
    heroQuote: {
      label: "The Intro",
      text: "William pls meet Kristina Windham.. Kristina as discussed William is our Chief Business Intelligence Officer",
      attr: "— Steve Stoute · United Masters · iMessage · 7:16 AM",
    },
    situation: [
      "Steve makes the intro at 7:16am. William and Kristina exchange directly. She gives her availability. William triggers Vanta with a single forwarded thread.",
      "What follows is a full orchestration sequence — parsed thread, outreach email, bio research, meeting prep brief, and a persistent agent built from everything.",
    ],
    thread: {
      header: "Steve Stoute · iMessage · 7:16 AM",
      messages: [
        {
          sender: "Steve Stoute · United Masters",
          direction: "in",
          text: "William pls meet Kristina Windham.. Kristina as discussed William is our Chief Business Intelligence Officer",
          timestamp: "7:16 AM",
        },
        {
          sender: "Kristina Windham",
          direction: "in",
          text: "Hi William — great to connect. I'm available Thursday or Friday this week. Best,",
        },
        {
          sender: "William",
          direction: "out",
          text: "Great to meet you Kristina — let's lock in Thursday. I'll get something over.",
        },
        {
          sender: "William → Vanta",
          direction: "out",
          text: "Context per note from Steve and my exchange with her. Let's get note out from here.",
          timestamp: "7:28 AM",
          separator: true,
        },
      ],
    },
    sections: [
      {
        type: "steps",
        label: "The Orchestration Sequence",
        steps: [
          {
            n: "01",
            title: "Thread Parsed. Outreach Email Sent.",
            desc: "Context extracted. Email drafted from william@vantawireless.com with calendar availability and Steve's context woven in.",
          },
          {
            n: "02",
            title: "Bio Research Activated.",
            desc: "Name detected. Research layer triggered. LinkedIn, press, career arc assembled into a living brief.",
          },
          {
            n: "03",
            title: "Meeting Prep Brief Generated.",
            desc: "Call-specific intelligence: three things to probe, how to show up, what to look for.",
          },
          {
            n: "04",
            title: "Persistent Agent Built.",
            desc: "Bio and prep don't disappear. Vanta builds a persistent agent — a living context layer that updates as the relationship evolves.",
          },
        ],
      },
      {
        type: "bio",
        label: "Quick Bio — Kristina Windham",
        bioItems: [
          { key: "Role", value: "Senior Vice President, Business Development & Partnerships" },
          { key: "Company", value: "United Masters" },
          { key: "Focus", value: "Strategic partnerships, brand integrations, and revenue growth across music and entertainment verticals" },
          { key: "Background", value: "15+ years across media, entertainment, and digital platforms. Previously held senior roles in partnership strategy at major music and media companies." },
          { key: "Signal", value: "Steve's direct intro suggests she's a decision-maker in a live deal or strategic initiative — not a casual connection." },
        ],
      },
      {
        type: "meeting-prep",
        label: "Meeting Prep — Thursday",
        prepItems: [
          { n: "01", title: "Open with Steve's context.", desc: "Reference the intro naturally. She already knows the framing — don't re-pitch, build from it." },
          { n: "02", title: "Probe: What does United Masters need from intelligence infrastructure?", desc: "She's in BD — find out where their data gaps are. Artist analytics? Brand partner matching? Revenue forecasting?" },
          { n: "03", title: "Watch for: Decision velocity.", desc: "How fast does she move? Is she evaluating or already building? This tells you if it's a Q2 or Q4 conversation." },
        ],
      },
      {
        type: "quote",
        quote: {
          label: "What's Being Built",
          text: "Today this was manually triggered. That's the last time it will be.",
          attr: "— Vanta OS · Signal Architecture",
        },
      },
      { type: "hr" },
      { type: "signal-architecture" },
    ],
    callout: {
      main: "Today this was manually triggered. That's the last time it will be.",
      sub: "Vanta is engineering automatic signal detection across every connected source — iMessage, email, calendar — so every introduction becomes an orchestrated sequence before you open the thread.",
    },
    tags: [
      "Auto Signal Detection",
      "iMessage",
      "Email",
      "Calendar",
      "Bio Research",
      "Meeting Prep",
      "Persistent Agent",
      "Agentic Orchestration",
    ],
  },
  {
    num: "Use Case — 02",
    id: "02",
    name: "Anticipatory Intelligence",
    cat: "Product Philosophy · Methodology",
    sub: "Methodology · Morita to Vanta · 5 Layers",
    cardCat: "Product Philosophy",
    cardDesc: "A morning text thread about Akio Morita becomes a full product methodology. Vanta mapped the five abstraction layers from a late-night riff between William and John Greene.",
    cardSignal: { label: "The Anchor", text: '"You\'re not outsourcing tasks. You\'re leveraging decisions."' },
    cardMeta: { layer: "Methodology", output: "Framework" },
    standaloneHref: "/case-02",
    heroQuote: {
      label: "The Origin",
      text: "We don't ask consumers what they want. They don't know. Instead we apply our brain power to what they need and will want",
      attr: "— Akio Morita · Sony Founder · surfaced in late-night text thread",
    },
    situation: [
      "A late-night text thread. William and John Greene riffing on Akio Morita and product philosophy.",
      "That late-night exchange becomes a full product methodology. Vanta mapped the five abstractions.",
    ],
    thread: {
      header: "William · John Greene · iMessage · Late Evening",
      messages: [
        {
          sender: "William",
          direction: "out",
          text: "Sony never asked consumers what they wanted. Morita just knew. That's the operating principle.",
        },
        {
          sender: "John Greene",
          direction: "in",
          text: "We don't ask consumers what they want. They don't know. Instead we apply our brain power to what they need.",
        },
        {
          sender: "William",
          direction: "out",
          text: "That's the whole thing. Anticipation as the product. Not feedback loops.",
        },
        {
          sender: "John Greene",
          direction: "in",
          text: "You're not outsourcing tasks. You're leveraging decisions.",
        },
        {
          sender: "William",
          direction: "out",
          text: "That's the line. That's the whole framework.",
        },
      ],
    },
    sections: [
      {
        type: "five-layers",
        label: "The Five Layers",
        steps: [
          { n: "00", title: "Raw Input", desc: "The text thread itself. Morita quote, John's line, William's close. Origin artifact." },
          { n: "01", title: "Latent Insight", desc: "The pattern beneath the exchange: anticipation as product strategy, not customer feedback." },
          { n: "02", title: "Morita Bridge", desc: "Sony's model mapped onto Vanta's context. What Morita did with hardware, Vanta does with intelligence." },
          { n: "03", title: "Vanta Frame", desc: "The three operating principles derived: Signal Not Volume. Decisions Not Tasks. Anticipation Not Reaction." },
          { n: "04", title: "Category Position", desc: "Vanta is not a productivity tool. It is a judgment platform. The moat is not automation — it's anticipation." },
        ],
      },
      {
        type: "quote",
        quote: {
          label: "The Lever",
          text: "You're not outsourcing tasks. You're leveraging decisions.",
          attr: "— John Greene",
        },
      },
    ],
    callout: {
      main: "Today this was manually triggered. That's the last time it will be.",
      sub: "Vanta is engineering automatic signal detection across every connected source — iMessage, email, calendar.",
    },
    tags: ["Product Philosophy", "Akio Morita", "Text Thread Signal", "Category Design", "Framework", "Anticipation Layer"],
  },
  {
    num: "Use Case — 03",
    id: "03",
    name: "First Principles",
    cat: "Investment Intelligence · First Principles",
    sub: "iMessage · a16z Framework · Thesis Stress Test · VC-Grade Analysis",
    cardCat: "Investment Intelligence",
    cardDesc: "John Greene sends a link — 13 questions Marc Andreessen asks before every investment. Vanta runs the full framework against its own thesis.",
    cardSignal: {
      label: "The Thesis",
      text: "Humans are not the most reliable dependent variables. Before AI, all there was, was...",
    },
    cardMeta: { layer: "Analysis", output: "Investment Deck" },
    standaloneHref: "/case-03",
    heroQuote: {
      label: "The Thesis",
      text: "Humans are not the most reliable dependent variables. Before AI, all there was, was...",
      attr: "— William Traylor · iMessage · same thread",
    },
    situation: [
      "Late evening. John Greene is stepping out but sends one more thing — a framework built by a16z for evaluating bets.",
      "The prompt: run Vanta through the same lens a16z uses before writing a check. Not a pitch — a stress test.",
    ],
    thread: {
      header: "Julian · Vanta Group Thread → John Greene · iMessage · 9:03 PM",
      messages: [
        {
          sender: "Julian · Vanta",
          direction: "in",
          text: "What we told them was clear IMO. And not representative of what they shared.",
        },
        {
          sender: "William",
          direction: "out",
          text: "What I've learned over the years as an executive — humans are not the most reliable dependent variables.",
        },
        {
          sender: "John Greene",
          direction: "in",
          text: "As I dip out for my nightly deluge of dance/dinner drama, look at it this way.",
          timestamp: "9:03 PM",
        },
      ],
    },
    sections: [
      {
        type: "steps",
        label: "What Vanta Did",
        steps: [
          { n: "01", title: "Signal Received. Framework Loaded.", desc: "John's message surfaces the a16z 13-question framework. Vanta loads it." },
          { n: "02", title: "All 13 Questions Run Against Vanta's Thesis.", desc: "Market disruption, network effects, contrarian truths — all stress-tested." },
          { n: "03", title: "Investment Deck Language Generated.", desc: "The output is structured for investor-grade communication." },
          { n: "04", title: "Persistent Intelligence Layer Built.", desc: "The 13-question analysis becomes a living reference layer." },
        ],
      },
    ],
    callout: {
      main: "Today this was manually triggered. That's the last time it will be.",
      sub: "Vanta is engineering automatic signal detection across every connected source.",
    },
    tags: ["a16z Framework", "Investment Intelligence", "First Principles", "Thesis Stress Test", "VC-Grade Analysis"],
  },
];
