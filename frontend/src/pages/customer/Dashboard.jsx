import React, { useState, useEffect } from 'react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { customerPortalAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Droplets, FileText, CheckCircle, Clock, Calendar } from 'lucide-react';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function CustomerDashboard() {
    const [profile, setProfile] = useState(null);
    const [amcs, setAmcs] = useState([]);
    const [recentServices, setRecentServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileRes, amcsRes, servicesRes] = await Promise.all([
                customerPortalAPI.getProfile(),
                customerPortalAPI.getAMCs(),
                customerPortalAPI.getServices()
            ]);
            setProfile(profileRes.data);
            setAmcs(amcsRes.data);
            setRecentServices(servicesRes.data.slice(0, 5));
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <CustomerLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </CustomerLayout>
        );
    }

    const completedCount = recentServices.filter(s => s.status === 'completed').length;
    const upcomingCount = recentServices.filter(s => s.status === 'scheduled').length;

    return (
        <CustomerLayout>
            <div className="space-y-6" data-testid="customer-dashboard">
                {/* Welcome */}
                <div>
                    <h1 className="text-xl font-heading font-bold">Welcome, {profile?.name}</h1>
                    <p className="text-sm text-muted-foreground">Track your pool maintenance services</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{completedCount}</p>
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{upcomingCount}</p>
                                    <p className="text-xs text-muted-foreground">Upcoming</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Active AMCs */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Active Contracts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {amcs.length > 0 ? (
                            <div className="space-y-3">
                                {amcs.map((amc) => (
                                    <div key={amc.id} className="p-3 bg-muted/50 rounded-lg" data-testid={`amc-card-${amc.id}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-medium">{amc.plan_name}</p>
                                                <p className="text-sm text-muted-foreground">{amc.pool_name}</p>
                                            </div>
                                            <Badge className={amc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : ''}>
                                                {amc.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {formatDate(amc.start_date)} - {formatDate(amc.end_date)}
                                            </span>
                                            <span className="font-medium">
                                                {amc.completed_services}/{amc.total_services} visits
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${(amc.completed_services / amc.total_services) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No active contracts</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Services */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Recent Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentServices.length > 0 ? (
                            <div className="space-y-3">
                                {recentServices.map((service) => (
                                    <div key={service.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid={`service-item-${service.id}`}>
                                        <div>
                                            <p className="font-medium text-sm">{formatDate(service.scheduled_date)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {service.pool_name} • {service.engineer_name || 'Pending'}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(service.status)}>
                                            {getStatusLabel(service.status)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No services yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
