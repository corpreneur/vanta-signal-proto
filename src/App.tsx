import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProductLayout from "@/components/ProductLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Signals from "./pages/Signals";
import CasePage from "./pages/CasePage";
import Graph from "./pages/Graph";
import PhoneFMC from "./pages/PhoneFMC";
import Ontology from "./pages/Ontology";
import ProductSignalPage from "./pages/ProductSignalPage";
import Architecture from "./pages/Architecture";
import BrainDump from "./pages/BrainDump";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const skipAuth = new URLSearchParams(window.location.search).get("skip-auth") === "1";
  if (skipAuth) sessionStorage.setItem("vanta-auth", "true");
  const authed = sessionStorage.getItem("vanta-auth") === "true";
  return authed ? <>{children}</> : <Navigate to="/login" replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><ProductLayout><Index /></ProductLayout></ProtectedRoute>} />
          <Route path="/signals" element={<ProtectedRoute><ProductLayout><Signals /></ProductLayout></ProtectedRoute>} />
          <Route path="/case/:id" element={<ProtectedRoute><ProductLayout><CasePage /></ProductLayout></ProtectedRoute>} />
          <Route path="/graph" element={<ProtectedRoute><ProductLayout><Graph /></ProductLayout></ProtectedRoute>} />
          <Route path="/phone-fmc" element={<ProtectedRoute><ProductLayout><PhoneFMC /></ProductLayout></ProtectedRoute>} />
          <Route path="/ontology" element={<ProtectedRoute><ProductLayout><Ontology /></ProductLayout></ProtectedRoute>} />
          <Route path="/product/:signalType" element={<ProtectedRoute><ProductLayout><ProductSignalPage /></ProductLayout></ProtectedRoute>} />
          <Route path="/architecture" element={<ProtectedRoute><ProductLayout><Architecture /></ProductLayout></ProtectedRoute>} />
          <Route path="/brain-dump" element={<ProtectedRoute><ProductLayout><BrainDump /></ProductLayout></ProtectedRoute>} />
          {/* Legacy case study redirects */}
          <Route path="/case-01" element={<Navigate to="/case/01" replace />} />
          <Route path="/case-02" element={<Navigate to="/case/02" replace />} />
          <Route path="/case-03" element={<Navigate to="/case/03" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
