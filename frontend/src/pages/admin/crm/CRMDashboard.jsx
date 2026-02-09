import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { crmAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { 
    Users, 
    FileText, 
    Briefcase, 
    TrendingUp,
    ArrowRight,
    Target,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';

export default function CRMDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await crmAPI.getDashboard();
            setStats(res.data);
        } catch (error) {
            console.error('Failed to load CRM stats:', error);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="space-y-6" data-testid="crm-dashboard">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold">Sales CRM</h1>
                        <p className="text-muted-foreground">Manage your sales pipeline</p>
                    </div>
                    <Link to="/admin/crm/leads">
                        <Button data-testid="new-lead-btn">
                            <Users className="h-4 w-4 mr-2" />
                            New Lead
                        </Button>
                    </Link>
                </div>

                {/* Pipeline Value */}
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                                <p className="text-3xl font-heading font-bold text-primary">
                                    ₹{stats?.pipeline_value?.toLocaleString() || 0}
                                </p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-primary/30" />
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.leads?.total || 0}</p>
                                    <p className="text-xs text-muted-foreground">Total Leads</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.quotations?.total || 0}</p>
                                    <p className="text-xs text-muted-foreground">Quotations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <Briefcase className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.work_orders?.total || 0}</p>
                                    <p className="text-xs text-muted-foreground">Work Orders</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.work_orders?.converted_to_amc || 0}</p>
                                    <p className="text-xs text-muted-foreground">AMC Converted</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lead Funnel & Work Order Status */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Lead Funnel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span>Lead Funnel</span>
                                <Link to="/admin/crm/leads">
                                    <Button variant="ghost" size="sm">
                                        View All <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span>New Leads</span>
                                </div>
                                <Badge variant="outline">{stats?.leads?.new || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    <span>Qualified</span>
                                </div>
                                <Badge variant="outline">{stats?.leads?.qualified || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    <span>Won</span>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700">{stats?.leads?.won || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span>Lost</span>
                                </div>
                                <Badge className="bg-red-100 text-red-700">{stats?.leads?.lost || 0}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Work Order Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span>Work Orders</span>
                                <Link to="/admin/crm/work-orders">
                                    <Button variant="ghost" size="sm">
                                        View All <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-500" />
                                    <span>Pending</span>
                                </div>
                                <Badge variant="outline">{stats?.work_orders?.pending || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                                    <span>In Progress</span>
                                </div>
                                <Badge className="bg-amber-100 text-amber-700">{stats?.work_orders?.in_progress || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    <span>Completed</span>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700">{stats?.work_orders?.completed || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    <span>Converted to AMC</span>
                                </div>
                                <Badge className="bg-primary/20 text-primary">{stats?.work_orders?.converted_to_amc || 0}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/admin/crm/leads">
                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                            <Users className="h-5 w-5" />
                            <span>Manage Leads</span>
                        </Button>
                    </Link>
                    <Link to="/admin/crm/quotations">
                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                            <FileText className="h-5 w-5" />
                            <span>Quotations</span>
                        </Button>
                    </Link>
                    <Link to="/admin/crm/work-orders">
                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                            <Briefcase className="h-5 w-5" />
                            <span>Work Orders</span>
                        </Button>
                    </Link>
                    <Link to="/admin/crm/installations">
                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                            <Target className="h-5 w-5" />
                            <span>Installations</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}
