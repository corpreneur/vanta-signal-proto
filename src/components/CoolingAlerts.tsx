import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AlertTriangle, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CoolingAlert {
  id: string;
  contact_name: string;
  alert_type: string;
  previous_strength: number;
  current_strength: number;
  created_at: string;
  dismissed: boolean;
}

export default function CoolingAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["cooling-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relationship_alerts")
        .select("*")
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data || []) as CoolingAlert[];
    },
    refetchInterval: 60_000,
  });

  const dismissAlert = async (id: string) => {
    const { error } = await supabase.from("relationship_alerts").update({ dismissed: true }).eq("id", id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["cooling-alerts"] });
      toast.success("Alert dismissed");
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6" data-testid="cooling-alerts">
      <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-signal-yellow flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        Cooling Relationships
      </h3>
      {alerts.map((alert) => (
        <div key={alert.id} className="flex items-center justify-between p-3 border border-vanta-signal-yellow-border bg-vanta-signal-yellow-faint">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center bg-vanta-signal-yellow/20 border border-vanta-signal-yellow-border">
              <AlertTriangle className="w-3 h-3 text-vanta-signal-yellow" />
            </div>
            <div>
              <Link
                to={`/contact/${encodeURIComponent(alert.contact_name)}`}
                className="font-mono text-[11px] font-medium text-foreground hover:text-vanta-accent transition-colors"
              >
                {alert.contact_name}
              </Link>
              <p className="font-mono text-[9px] text-vanta-text-muted">
                Strength dropped to {alert.current_strength} · Reach out soon
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              to={`/contact/${encodeURIComponent(alert.contact_name)}`}
              className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-widest border border-vanta-accent text-vanta-accent hover:bg-vanta-accent-faint transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              View
            </Link>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 text-vanta-text-muted hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
