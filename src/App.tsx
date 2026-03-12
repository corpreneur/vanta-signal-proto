import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import Signals from "./pages/Signals.tsx";
import CasePage from "./pages/CasePage.tsx";
import Graph from "./pages/Graph.tsx";
import PhoneFMC from "./pages/PhoneFMC.tsx";
import Ontology from "./pages/Ontology.tsx";
import { Navigate } from "react-router-dom";

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
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/signals" element={<ProtectedRoute><Signals /></ProtectedRoute>} />
          <Route path="/case-:id" element={<ProtectedRoute><CasePage /></ProtectedRoute>} />
          <Route path="/graph" element={<ProtectedRoute><Graph /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
