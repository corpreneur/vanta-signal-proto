import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactProfile {
  id: string;
  name: string;
  display_name: string | null;
  photo_url: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  relationship_type: string;
  how_we_met: string | null;
  source_tag: string;
  private_notes: string | null;
  pinned: boolean;
  pinned_order: number | null;
  created_at: string;
  updated_at: string;
}

export const RELATIONSHIP_TYPES = [
  "personal",
  "client",
  "prospect",
  "partner",
  "investor",
  "vendor",
  "advisor",
  "colleague",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_LABELS: Record<string, string> = {
  personal: "Personal",
  client: "Client",
  prospect: "Prospect",
  partner: "Partner",
  investor: "Investor",
  vendor: "Vendor",
  advisor: "Advisor",
  colleague: "Colleague",
};

async function fetchProfiles(): Promise<ContactProfile[]> {
  const { data, error } = await supabase
    .from("contact_profiles")
    .select("*")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ContactProfile[];
}

export function useContactProfiles() {
  return useQuery({
    queryKey: ["contact-profiles"],
    queryFn: fetchProfiles,
    staleTime: 30_000,
  });
}

export function useContactProfile(name: string) {
  const { data: profiles } = useContactProfiles();
  return profiles?.find((p) => p.name === name) ?? null;
}

export function useProfileMap() {
  const { data: profiles } = useContactProfiles();
  const map = new Map<string, ContactProfile>();
  profiles?.forEach((p) => map.set(p.name, p));
  return map;
}
