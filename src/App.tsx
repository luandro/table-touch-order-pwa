
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Customer Pages
import Landing from "./pages/customer/Landing";
import Menu from "./pages/customer/Menu";
import Bill from "./pages/customer/Bill";
import ExistingOrder from "./pages/customer/ExistingOrder";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import TableDetail from "./pages/admin/TableDetail";
import TableHistory from "./pages/admin/TableHistory";
import MenuManagement from "./pages/admin/MenuManagement";
import MenuItemForm from "./pages/admin/MenuItemForm";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import CategoryForm from "./pages/admin/CategoryForm";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Admin route protection with real authentication
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const AppContent = () => (
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
      path="/admin/table/:tableId/history"
      element={
        <ProtectedAdminRoute>
          <TableHistory />
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
    <Route
      path="/admin/menu/new"
      element={
        <ProtectedAdminRoute>
          <MenuItemForm mode="new" />
        </ProtectedAdminRoute>
      }
    />
    <Route
      path="/admin/menu/edit/:itemId"
      element={
        <ProtectedAdminRoute>
          <MenuItemForm mode="edit" />
        </ProtectedAdminRoute>
      }
    />
    <Route
      path="/admin/menu/categories"
      element={
        <ProtectedAdminRoute>
          <CategoriesManagement />
        </ProtectedAdminRoute>
      }
    />
    <Route
      path="/admin/menu/categories/new"
      element={
        <ProtectedAdminRoute>
          <CategoryForm mode="new" />
        </ProtectedAdminRoute>
      }
    />
    <Route
      path="/admin/menu/categories/edit/:categoryId"
      element={
        <ProtectedAdminRoute>
          <CategoryForm mode="edit" />
        </ProtectedAdminRoute>
      }
    />

    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
