import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { dashboardAPI, serviceAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
    Users, 
    Droplets, 
    FileText, 
    Wrench,
    Calendar,
    CheckCircle,
    Clock,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [todayServices, setTodayServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, servicesRes] = await Promise.all([
                dashboardAPI.getStats(),
                serviceAPI.getAll({ date: new Date().toISOString().split('T')[0] })
            ]);
            setStats(statsRes.data);
            setTodayServices(servicesRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { icon: Users, label: 'Customers', value: stats?.total_customers || 0, color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: Droplets, label: 'Pools', value: stats?.total_pools || 0, color: 'text-cyan-500', bg: 'bg-cyan-50' },
        { icon: FileText, label: 'Active AMCs', value: stats?.active_amcs || 0, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { icon: Wrench, label: 'Engineers', value: stats?.total_engineers || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    const todayStats = [
        { icon: Calendar, label: 'Scheduled', value: stats?.today_services || 0, color: 'text-blue-500' },
        { icon: Clock, label: 'In Progress', value: stats?.today_in_progress || 0, color: 'text-amber-500' },
        { icon: CheckCircle, label: 'Completed', value: stats?.today_completed || 0, color: 'text-emerald-500' },
        { icon: AlertTriangle, label: 'Pending', value: stats?.pending_services || 0, color: 'text-red-500' },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6" data-testid="admin-dashboard">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => (
                        <Card key={stat.label} className="card-hover" data-testid={`stat-${stat.label.toLowerCase()}`}>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                        <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-2xl md:text-3xl font-heading font-bold">{stat.value}</p>
                                        <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Today's Overview */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-heading">Today's Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {todayStats.map((stat) => (
                                <div key={stat.label} className="text-center p-3 bg-muted/50 rounded-lg">
                                    <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                                    <p className="text-xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Services List */}
                        {todayServices.length > 0 ? (
                            <div className="space-y-3">
                                {todayServices.slice(0, 5).map((service) => (
                                    <div 
                                        key={service.id}
                                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{service.customer_name}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {service.pool_name} • {service.engineer_name || 'Unassigned'}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(service.status)}>
                                            {getStatusLabel(service.status)}
                                        </Badge>
                                    </div>
                                ))}
                                {todayServices.length > 5 && (
                                    <Link to="/admin/services">
                                        <Button variant="ghost" className="w-full" data-testid="view-all-services-btn">
                                            View all {todayServices.length} services
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No services scheduled for today</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/admin/customers">
                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="quick-add-customer">
                            <Users className="h-5 w-5" />
                            <span>Add Customer</span>
                        </Button>
                    </Link>
                    <Link to="/admin/engineers">
                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="quick-add-engineer">
                            <Wrench className="h-5 w-5" />
                            <span>Add Engineer</span>
                        </Button>
                    </Link>
                    <Link to="/admin/amc-plans">
                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="quick-add-plan">
                            <FileText className="h-5 w-5" />
                            <span>Create Plan</span>
                        </Button>
                    </Link>
                    <Link to="/admin/services">
                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="quick-view-services">
                            <Calendar className="h-5 w-5" />
                            <span>All Services</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}
