/**
 * Mock data emulating a native iPhone Contacts sync.
 * Simulates what Capacitor @capacitor-community/contacts would return,
 * enriched with Vanta Signal metadata.
 */
export interface NativeContact {
  id: string;
  givenName: string;
  familyName: string;
  displayName: string;
  phoneNumbers: { label: string; number: string }[];
  emailAddresses: { label: string; address: string }[];
  organizationName?: string;
  jobTitle?: string;
  /** Vanta enrichment */
  vantaStrength?: number;
  vantaStrengthLabel?: string;
  vantaSignalCount?: number;
  vantaLastInteraction?: string;
  vantaTags?: string[];
  vantaSynced: boolean;
}

export const MOCK_NATIVE_CONTACTS: NativeContact[] = [
  {
    id: "nc-1",
    givenName: "Marcus",
    familyName: "Chen",
    displayName: "Marcus Chen",
    phoneNumbers: [{ label: "mobile", number: "+1 415 555 0142" }],
    emailAddresses: [{ label: "work", address: "marcus@acmecapital.com" }],
    organizationName: "Acme Capital",
    jobTitle: "Managing Partner",
    vantaStrength: 87,
    vantaStrengthLabel: "Strong",
    vantaSignalCount: 34,
    vantaLastInteraction: new Date(Date.now() - 86400000).toISOString(),
    vantaTags: ["investor", "board"],
    vantaSynced: true,
  },
  {
    id: "nc-2",
    givenName: "Priya",
    familyName: "Sharma",
    displayName: "Priya Sharma",
    phoneNumbers: [{ label: "mobile", number: "+1 310 555 0198" }],
    emailAddresses: [{ label: "work", address: "priya@luminadesign.co" }],
    organizationName: "Lumina Design",
    jobTitle: "Creative Director",
    vantaStrength: 62,
    vantaStrengthLabel: "Warm",
    vantaSignalCount: 18,
    vantaLastInteraction: new Date(Date.now() - 3 * 86400000).toISOString(),
    vantaTags: ["creative", "collaborator"],
    vantaSynced: true,
  },
  {
    id: "nc-3",
    givenName: "David",
    familyName: "Okonkwo",
    displayName: "David Okonkwo",
    phoneNumbers: [{ label: "mobile", number: "+44 7700 900123" }],
    emailAddresses: [{ label: "work", address: "david@nextera.io" }],
    organizationName: "NextEra Ventures",
    jobTitle: "GP",
    vantaStrength: 45,
    vantaStrengthLabel: "Cooling",
    vantaSignalCount: 9,
    vantaLastInteraction: new Date(Date.now() - 18 * 86400000).toISOString(),
    vantaTags: ["investor"],
    vantaSynced: true,
  },
  {
    id: "nc-4",
    givenName: "Sofia",
    familyName: "Reyes",
    displayName: "Sofia Reyes",
    phoneNumbers: [{ label: "mobile", number: "+1 212 555 0077" }],
    emailAddresses: [{ label: "personal", address: "sofia.reyes@gmail.com" }],
    organizationName: "",
    jobTitle: "",
    vantaStrength: undefined,
    vantaStrengthLabel: undefined,
    vantaSignalCount: 0,
    vantaLastInteraction: undefined,
    vantaTags: [],
    vantaSynced: false,
  },
  {
    id: "nc-5",
    givenName: "James",
    familyName: "Park",
    displayName: "James Park",
    phoneNumbers: [{ label: "work", number: "+1 650 555 0234" }],
    emailAddresses: [{ label: "work", address: "jpark@horizonlabs.dev" }],
    organizationName: "Horizon Labs",
    jobTitle: "CTO",
    vantaStrength: 31,
    vantaStrengthLabel: "Cooling",
    vantaSignalCount: 5,
    vantaLastInteraction: new Date(Date.now() - 25 * 86400000).toISOString(),
    vantaTags: ["tech"],
    vantaSynced: true,
  },
  {
    id: "nc-6",
    givenName: "Elena",
    familyName: "Volkov",
    displayName: "Elena Volkov",
    phoneNumbers: [{ label: "mobile", number: "+1 305 555 0189" }],
    emailAddresses: [],
    organizationName: "Art Basel",
    jobTitle: "Director of Programs",
    vantaStrength: undefined,
    vantaStrengthLabel: undefined,
    vantaSignalCount: 0,
    vantaLastInteraction: undefined,
    vantaTags: [],
    vantaSynced: false,
  },
];
