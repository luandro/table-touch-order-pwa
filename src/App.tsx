
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Customer Pages
import Landing from "./pages/customer/Landing";
import Menu from "./pages/customer/Menu";
import Bill from "./pages/customer/Bill";
import ExistingOrder from "./pages/customer/ExistingOrder";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import TableDetail from "./pages/admin/TableDetail";
import MenuManagement from "./pages/admin/MenuManagement";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Admin route protection
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/table/:tableId" element={<Menu />} />
          <Route path="/table/:tableId/bill" element={<Bill />} />
          <Route path="/order/:orderId" element={<ExistingOrder />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/table/:tableId" 
            element={
              <ProtectedAdminRoute>
                <TableDetail />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/menu" 
            element={
              <ProtectedAdminRoute>
                <MenuManagement />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
