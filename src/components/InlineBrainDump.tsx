import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import UnifiedCaptureInput, { type CapturePayload } from "@/components/UnifiedCaptureInput";
import CaptureProcessingReveal from "@/components/CaptureProcessingReveal";

const SIGNAL_LABELS: Record<string, string> = {
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
  MEETING: "Meeting", PHONE_CALL: "Phone Call",
};

interface ClassificationResult {
  signalType: string;
  priority: string;
  summary: string;
  suggestedTitle?: string;
  suggestedTags?: string[];
  suggestedContacts?: string[];
  accelerators?: string[];
}

const InlineBrainDump = () => {
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (payload: CapturePayload) => {
    if (loading) return;

    setLoading(true);
    setRawText(payload.text || "(image capture)");
    setResult(null);

    try {
      let data: { classification?: ClassificationResult } | null = null;
      let error: Error | null = null;

      if (payload.type === "image" && payload.imageFile) {
        // Send image as base64 data URL in JSON body
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(payload.imageFile!);
        });

        const resp = await supabase.functions.invoke("brain-dump-image", {
          body: { imageData: base64, context: payload.text || "" },
        });
        data = resp.data;
        error = resp.error;
      } else {
        const resp = await supabase.functions.invoke("brain-dump", {
          body: payload.type === "url" ? { url: payload.text } : { text: payload.text },
        });
        data = resp.data;
        error = resp.error;
      }

      if (error) throw error;

      const classification = data?.classification;
      if (classification) {
        // Buffer the reveal — minimum 800ms processing feel
        await new Promise((r) => setTimeout(r, 300));
        setResult(classification);
        queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
        toast.success(
          `Signal detected · ${SIGNAL_LABELS[classification.signalType] || classification.signalType}`
        );
      }
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Failed to process — try again");
      setResult(null);
      setRawText("");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setResult(null);
    setRawText("");
  };

  // Show result card if we have one, otherwise show input
  if (result || loading) {
    return (
      <div className="mb-6">
        <CaptureProcessingReveal
          rawText={rawText}
          result={result}
          processing={loading}
          onDismiss={handleDismiss}
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <UnifiedCaptureInput
        onSubmit={handleSubmit}
        loading={loading}
        compact
      />
    </div>
  );
};

export default InlineBrainDump;
