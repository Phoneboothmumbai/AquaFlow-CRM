import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import CustomersPage from './pages/admin/Customers';
import AMCPlansPage from './pages/admin/AMCPlans';
import EngineersPage from './pages/admin/Engineers';
import ServicesPage from './pages/admin/Services';
import PoolsPage from './pages/admin/Pools';
import SettingsPage from './pages/admin/Settings';

// CRM Pages
import CRMDashboard from './pages/admin/crm/CRMDashboard';
import LeadsPage from './pages/admin/crm/LeadsPage';
import QuotationsPage from './pages/admin/crm/QuotationsPage';
import WorkOrdersPage from './pages/admin/crm/WorkOrdersPage';
import WorkOrderDetail from './pages/admin/crm/WorkOrderDetail';

// Engineer Pages
import EngineerDashboard from './pages/engineer/Dashboard';
import EngineerHistory from './pages/engineer/History';
import EngineerProfile from './pages/engineer/Profile';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerPools from './pages/customer/Pools';
import CustomerServices from './pages/customer/Services';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'company_admin') return <Navigate to="/admin" replace />;
        if (user.role === 'engineer') return <Navigate to="/engineer" replace />;
        if (user.role === 'customer') return <Navigate to="/customer" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Auth Route - Redirect if already logged in
function AuthRoute({ children }) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        if (user.role === 'company_admin') return <Navigate to="/admin" replace />;
        if (user.role === 'engineer') return <Navigate to="/engineer" replace />;
        if (user.role === 'customer') return <Navigate to="/customer" replace />;
    }

    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <CustomersPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/pools" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <PoolsPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/amc-plans" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <AMCPlansPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <ServicesPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/engineers" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <EngineersPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <SettingsPage />
                </ProtectedRoute>
            } />

            {/* CRM Routes */}
            <Route path="/admin/crm" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <CRMDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/crm/leads" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <LeadsPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/crm/quotations" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <QuotationsPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/crm/quotations/new" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <QuotationsPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/crm/work-orders" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <WorkOrdersPage />
                </ProtectedRoute>
            } />
            <Route path="/admin/crm/work-orders/:id" element={
                <ProtectedRoute allowedRoles={['company_admin']}>
                    <WorkOrderDetail />
                </ProtectedRoute>
            } />

            {/* Engineer Routes */}
            <Route path="/engineer" element={
                <ProtectedRoute allowedRoles={['engineer']}>
                    <EngineerDashboard />
                </ProtectedRoute>
            } />
            <Route path="/engineer/history" element={
                <ProtectedRoute allowedRoles={['engineer']}>
                    <EngineerHistory />
                </ProtectedRoute>
            } />
            <Route path="/engineer/profile" element={
                <ProtectedRoute allowedRoles={['engineer']}>
                    <EngineerProfile />
                </ProtectedRoute>
            } />

            {/* Customer Routes */}
            <Route path="/customer" element={
                <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                </ProtectedRoute>
            } />
            <Route path="/customer/pools" element={
                <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerPools />
                </ProtectedRoute>
            } />
            <Route path="/customer/services" element={
                <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerServices />
                </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster 
                    position="top-right" 
                    richColors 
                    closeButton
                    toastOptions={{
                        style: {
                            fontFamily: 'Public Sans, sans-serif'
                        }
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
