import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Compliance from "./pages/Compliance";
import SecurityPortal from "./pages/SecurityPortal";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Pages
import { Landing } from "@/pages/Landing";
import { SimpleLanding } from "@/pages/SimpleLanding";
import BlogPost from "@/pages/BlogPost";
import { Login } from "@/pages/Login";
import { ICEMLogin } from "@/pages/ICEMLogin";
import { IGSBLogin } from "@/pages/IGSBLogin";
import { SuperAdminDashboard } from "@/pages/superadmin/SuperAdminDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProfileSettings from "@/pages/admin/AdminProfileSettings";
import FacultyDetails from "@/pages/admin/FacultyDetails";
import FacultyAllocation from "@/pages/admin/FacultyAllocation";
import SessionResponses from "@/pages/admin/SessionResponses";
import AdminHelpSection from "@/pages/admin/HelpSection";
import { HodDashboard } from "@/pages/hod/HodDashboard";
import HodProfileSettings from "@/pages/hod/HodProfileSettings";
import HodHelpSection from "@/pages/hod/HelpSection";
import { FacultyDashboard } from "@/pages/faculty/FacultyDashboard";
import FacultyProfileSettings from "@/pages/faculty/FacultyProfileSettings";
import FacultyHelpSection from "@/pages/faculty/HelpSection";
import { AnonymousFeedback } from "@/pages/feedback/AnonymousFeedback";
import NotFound from "@/pages/NotFound";
import SeedData from "@/pages/SeedData";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/">
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SimpleLanding />} />
            <Route path="/home" element={<Landing />} />
            <Route path="/blog/chaos-to-clarity" element={<BlogPost />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/icem" element={<ICEMLogin />} />
            <Route path="/login/igsb" element={<IGSBLogin />} />
            <Route path="/feedback/anonymous/:sessionId" element={<AnonymousFeedback />} />
            <Route path="/seed-data" element={<SeedData />} />

            {/* Super Admin Routes */}
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/colleges" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/admins" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/sessions" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/sessions/:sessionId/responses" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/question-bank" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/help-portal" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/profile" element={<SuperAdminDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route element={<DashboardLayout allowedRoles={['admin', 'superAdmin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/sessions" element={<AdminDashboard />} />
              <Route path="/admin/sessions/:sessionId/responses" element={<SessionResponses />} />
              <Route path="/admin/departments" element={<AdminDashboard />} />
              <Route path="/admin/faculty" element={<AdminDashboard />} />
              <Route path="/admin/bulk-email" element={<AdminDashboard />} />
              <Route path="/admin/faculty-allocation" element={<FacultyAllocation />} />
              <Route path="/admin/faculty-details" element={<FacultyDetails />} />
              <Route path="/admin/questions" element={<AdminDashboard />} />
              <Route path="/admin/profile" element={<AdminProfileSettings />} />
              <Route path="/admin/help" element={<AdminHelpSection />} />
            </Route>

            {/* HOD Routes */}
            <Route element={<DashboardLayout allowedRoles={['hod']} />}>
              <Route path="/hod/dashboard" element={<HodDashboard />} />
              <Route path="/hod/sessions" element={<HodDashboard />} />
              <Route path="/hod/performance" element={<HodDashboard />} />
              <Route path="/hod/profile" element={<HodProfileSettings />} />
              <Route path="/hod/help" element={<HodHelpSection />} />
            </Route>

            {/* Faculty Routes */}
            <Route element={<DashboardLayout allowedRoles={['faculty']} />}>
              <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
              <Route path="/faculty/sessions" element={<FacultyDashboard />} />
              <Route path="/faculty/profile" element={<FacultyProfileSettings />} />
              <Route path="/faculty/help" element={<FacultyHelpSection />} />
            </Route>

            {/* Compliance, Security Portal, Privacy Policy, and Terms of Service */}
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/security-portal" element={<SecurityPortal />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
