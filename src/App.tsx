import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import ProductLayout from "@/components/ProductLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Signals from "./pages/Signals";
import CasePage from "./pages/CasePage";
import Graph from "./pages/Graph";
import PhoneFMC from "./pages/PhoneFMC";
import Connectivity from "./pages/Connectivity";
import Ontology from "./pages/Ontology";
import ProductSignalPage from "./pages/ProductSignalPage";
import InsightEngine from "./pages/InsightEngine";
import InvestmentIntel from "./pages/InvestmentIntel";
import DecisionCapture from "./pages/DecisionCapture";
import Architecture from "./pages/Architecture";
import BrainDump from "./pages/BrainDump";
import OrbDemo from "./pages/OrbDemo";
import ReleaseNotes from "./pages/ReleaseNotes";
import Command from "./pages/Command";

import Settings from "./pages/Settings";
import ContactTimeline from "./pages/ContactTimeline";
import Briefing from "./pages/Briefing";
import Contacts from "./pages/Contacts";
import NoiseQueue from "./pages/NoiseQueue";
import UserModes from "./pages/UserModes";
import Focus from "./pages/Focus";
import FileVault from "./pages/FileVault";
import MyRulesHub from "./pages/MyRulesHub";
import QuickCaptureExtension from "./pages/QuickCaptureExtension";
import Admin from "./pages/Admin";
import NativeContactSync from "./pages/NativeContactSync";
import QuickCapture from "./components/QuickCapture";
import type { Session } from "@supabase/supabase-js";

const ProtectedRoute = ({ children, session }: { children: React.ReactNode; session: Session | null }) => {
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-2 h-2 bg-primary animate-pulse" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<ProtectedRoute session={session}><ProductLayout><Index /></ProductLayout></ProtectedRoute>} />
      <Route path="/signals" element={<ProtectedRoute session={session}><ProductLayout><Signals /></ProductLayout></ProtectedRoute>} />
      <Route path="/case/:id" element={<ProtectedRoute session={session}><ProductLayout><CasePage /></ProductLayout></ProtectedRoute>} />
      <Route path="/graph" element={<ProtectedRoute session={session}><ProductLayout><Graph /></ProductLayout></ProtectedRoute>} />
      <Route path="/connectivity" element={<ProtectedRoute session={session}><ProductLayout><Connectivity /></ProductLayout></ProtectedRoute>} />
      <Route path="/phone-fmc" element={<ProtectedRoute session={session}><ProductLayout><PhoneFMC /></ProductLayout></ProtectedRoute>} />
      <Route path="/ontology" element={<ProtectedRoute session={session}><ProductLayout><Ontology /></ProductLayout></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute session={session}><ProductLayout><InsightEngine /></ProductLayout></ProtectedRoute>} />
      <Route path="/investments" element={<ProtectedRoute session={session}><ProductLayout><InvestmentIntel /></ProductLayout></ProtectedRoute>} />
      <Route path="/decisions" element={<ProtectedRoute session={session}><ProductLayout><DecisionCapture /></ProductLayout></ProtectedRoute>} />
      <Route path="/product/:signalType" element={<ProtectedRoute session={session}><ProductLayout><ProductSignalPage /></ProductLayout></ProtectedRoute>} />
      <Route path="/architecture" element={<ProtectedRoute session={session}><ProductLayout><Architecture /></ProductLayout></ProtectedRoute>} />
      <Route path="/brain-dump" element={<ProtectedRoute session={session}><ProductLayout><BrainDump /></ProductLayout></ProtectedRoute>} />
      <Route path="/releases" element={<ProtectedRoute session={session}><ProductLayout><ReleaseNotes /></ProductLayout></ProtectedRoute>} />
      <Route path="/audit" element={<Navigate to="/settings?tab=audit" replace />} />
      <Route path="/settings" element={<ProtectedRoute session={session}><ProductLayout><Settings /></ProductLayout></ProtectedRoute>} />
      <Route path="/contact/:name" element={<ProtectedRoute session={session}><ProductLayout><ContactTimeline /></ProductLayout></ProtectedRoute>} />
      <Route path="/briefing/:id" element={<ProtectedRoute session={session}><ProductLayout><Briefing /></ProductLayout></ProtectedRoute>} />
      <Route path="/command" element={<ProtectedRoute session={session}><ProductLayout><Command /></ProductLayout></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute session={session}><ProductLayout><Contacts /></ProductLayout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute session={session}><ProductLayout><Admin /></ProductLayout></ProtectedRoute>} />
      <Route path="/noise-queue" element={<Navigate to="/focus?tab=noise" replace />} />
      <Route path="/focus" element={<ProtectedRoute session={session}><ProductLayout><Focus /></ProductLayout></ProtectedRoute>} />
      <Route path="/files" element={<ProtectedRoute session={session}><ProductLayout><FileVault /></ProductLayout></ProtectedRoute>} />
      <Route path="/my-rules" element={<ProtectedRoute session={session}><ProductLayout><MyRulesHub /></ProductLayout></ProtectedRoute>} />
      <Route path="/quick-capture" element={<ProtectedRoute session={session}><ProductLayout><QuickCaptureExtension /></ProductLayout></ProtectedRoute>} />
      <Route path="/user-modes" element={<Navigate to="/focus" replace />} />
      <Route path="/case-01" element={<Navigate to="/case/01" replace />} />
      <Route path="/case-02" element={<Navigate to="/case/02" replace />} />
      <Route path="/case-03" element={<Navigate to="/case/03" replace />} />
      <Route path="/orb-demo" element={<OrbDemo />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
        <QuickCapture />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;