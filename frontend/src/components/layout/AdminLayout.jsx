import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { companyAPI } from '../../lib/api';
import {
    LayoutDashboard,
    Users,
    Droplets,
    FileText,
    Wrench,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    TrendingUp,
    Briefcase,
    Target
} from 'lucide-react';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Customers', path: '/admin/customers' },
    { icon: Droplets, label: 'Pools', path: '/admin/pools' },
    { icon: FileText, label: 'AMC Plans', path: '/admin/amc-plans' },
    { icon: Calendar, label: 'Services', path: '/admin/services' },
    { icon: Wrench, label: 'Engineers', path: '/admin/engineers' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const crmNavItems = [
    { icon: TrendingUp, label: 'CRM Dashboard', path: '/admin/crm' },
    { icon: Users, label: 'Leads', path: '/admin/crm/leads' },
    { icon: FileText, label: 'Quotations', path: '/admin/crm/quotations' },
    { icon: Briefcase, label: 'Work Orders', path: '/admin/crm/work-orders' },
];

export function AdminLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-border z-50 flex items-center justify-between px-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    data-testid="mobile-menu-btn"
                >
                    <Menu className="h-6 w-6" />
                </Button>
                <h1 className="font-heading font-semibold text-lg">Graand Prix</h1>
                <div className="w-10" />
            </header>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-border z-50 transition-all duration-300",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    collapsed ? "lg:w-20" : "lg:w-64",
                    "w-64"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                        {!collapsed && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                    <Droplets className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-heading font-bold text-lg">Graand Prix</span>
                            </div>
                        )}
                        {collapsed && (
                            <div className="w-8 h-8 mx-auto rounded-lg bg-primary flex items-center justify-center">
                                <Droplets className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    data-testid={`nav-${item.label.toLowerCase()}`}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-primary text-white"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && <span className="font-medium">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Collapse Button (Desktop) */}
                    <div className="hidden lg:block p-4 border-t border-border">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCollapsed(!collapsed)}
                            className="w-full justify-center"
                            data-testid="collapse-sidebar-btn"
                        >
                            <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
                        </Button>
                    </div>

                    {/* User Section */}
                    <div className="p-4 border-t border-border">
                        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-semibold">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{user?.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.company_name}</p>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className={cn("mt-3 text-destructive hover:text-destructive", collapsed ? "w-full justify-center" : "w-full")}
                            data-testid="logout-btn"
                        >
                            <LogOut className="h-4 w-4" />
                            {!collapsed && <span className="ml-2">Logout</span>}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={cn(
                    "min-h-screen pt-16 lg:pt-0 transition-all duration-300",
                    collapsed ? "lg:pl-20" : "lg:pl-64"
                )}
            >
                <div className="p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
