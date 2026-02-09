import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
    LayoutDashboard,
    History,
    User,
    LogOut
} from 'lucide-react';

const navItems = [
    { icon: LayoutDashboard, label: 'Today', path: '/engineer' },
    { icon: History, label: 'History', path: '/engineer/history' },
    { icon: User, label: 'Profile', path: '/engineer/profile' },
];

export function EngineerLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-border z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AF</span>
                    </div>
                    <div>
                        <h1 className="font-heading font-semibold text-base">AquaFlow CRM</h1>
                        <p className="text-xs text-muted-foreground">{user?.name}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    data-testid="logout-btn"
                >
                    <LogOut className="h-5 w-5 text-muted-foreground" />
                </Button>
            </header>

            {/* Main Content */}
            <main className="pt-16 px-4 py-4">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="mobile-nav flex items-center justify-around py-2 px-4">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            data-testid={`nav-${item.label.toLowerCase()}`}
                            className={cn(
                                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[72px]",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
