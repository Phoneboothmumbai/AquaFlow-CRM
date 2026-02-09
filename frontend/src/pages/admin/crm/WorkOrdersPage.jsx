import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { crmAPI, engineerAPI, amcPlanAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { 
    Briefcase, 
    Play, 
    CheckCircle, 
    Target,
    Eye,
    Clock,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../../lib/utils';

const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'converted_to_amc', label: 'Converted to AMC', color: 'bg-primary/20 text-primary' },
];

export default function WorkOrdersPage() {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [engineers, setEngineers] = useState([]);
    const [amcPlans, setAmcPlans] = useState([]);
    const [converting, setConverting] = useState(false);

    const [conversionData, setConversionData] = useState({
        amc_plan_id: '',
        start_date: '',
        end_date: '',
        assigned_engineer_id: ''
    });

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        try {
            const [ordersRes, engineersRes, plansRes] = await Promise.all([
                crmAPI.getWorkOrders(statusFilter !== 'all' ? statusFilter : undefined),
                engineerAPI.getAll(),
                amcPlanAPI.getAll()
            ]);
            setWorkOrders(ordersRes.data);
            setEngineers(engineersRes.data);
            setAmcPlans(plansRes.data);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error('CRM module not enabled');
            } else {
                toast.error('Failed to load work orders');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await crmAPI.updateWorkOrderStatus(orderId, newStatus);
            toast.success('Status updated');
            loadData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleConvertToAMC = async () => {
        if (!conversionData.amc_plan_id || !conversionData.start_date || !conversionData.end_date) {
            toast.error('Please fill all required fields');
            return;
        }

        setConverting(true);
        try {
            const result = await crmAPI.convertToAMC({
                work_order_id: selectedOrder.id,
                ...conversionData
            });
            toast.success(`Successfully converted! ${result.data.services_created} services created.`);
            setShowConvertModal(false);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to convert to AMC');
        } finally {
            setConverting(false);
        }
    };

    const getStatusColor = (status) => {
        const option = statusOptions.find(o => o.value === status);
        return option?.color || 'bg-slate-100 text-slate-700';
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
            <div className="space-y-6" data-testid="work-orders-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold">Work Orders</h1>
                        <p className="text-muted-foreground">Manage project execution</p>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]" data-testid="status-filter">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {statusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Clock className="h-6 w-6 mx-auto mb-1 text-slate-500" />
                            <p className="text-xl font-bold">{workOrders.filter(w => w.status === 'pending').length}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Play className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                            <p className="text-xl font-bold">{workOrders.filter(w => w.status === 'in_progress').length}</p>
                            <p className="text-xs text-muted-foreground">In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
                            <p className="text-xl font-bold">{workOrders.filter(w => w.status === 'completed').length}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Target className="h-6 w-6 mx-auto mb-1 text-primary" />
                            <p className="text-xl font-bold">{workOrders.filter(w => w.status === 'converted_to_amc').length}</p>
                            <p className="text-xs text-muted-foreground">AMC Converted</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Work Orders List */}
                {workOrders.length > 0 ? (
                    <div className="grid gap-4">
                        {workOrders.map((order) => (
                            <Card key={order.id} className="card-hover" data-testid={`work-order-${order.id}`}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Briefcase className="h-4 w-4 text-primary" />
                                                <span className="font-mono text-sm font-medium">{order.work_order_number}</span>
                                                <Badge className={getStatusColor(order.status)}>
                                                    {statusOptions.find(o => o.value === order.status)?.label}
                                                </Badge>
                                            </div>
                                            <h3 className="font-semibold">{order.lead_name}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{order.scope_of_work}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                {order.expected_start_date && (
                                                    <span>Start: {formatDate(order.expected_start_date)}</span>
                                                )}
                                                {order.quotation_total && (
                                                    <span className="font-medium">₹{order.quotation_total.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {order.status === 'pending' && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleStatusChange(order.id, 'in_progress')}
                                                >
                                                    <Play className="h-4 w-4 mr-1" />
                                                    Start
                                                </Button>
                                            )}
                                            {order.status === 'in_progress' && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleStatusChange(order.id, 'completed')}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Complete
                                                </Button>
                                            )}
                                            {order.status === 'completed' && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setConversionData({
                                                            amc_plan_id: '',
                                                            start_date: '',
                                                            end_date: '',
                                                            assigned_engineer_id: ''
                                                        });
                                                        setShowConvertModal(true);
                                                    }}
                                                >
                                                    <Target className="h-4 w-4 mr-1" />
                                                    Convert to AMC
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/admin/crm/work-orders/${order.id}`)}
                                                data-testid={`view-wo-${order.id}`}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No work orders found. Create from approved quotations.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Detail Modal */}
                <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Work Order Details</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono">{selectedOrder.work_order_number}</span>
                                    <Badge className={getStatusColor(selectedOrder.status)}>
                                        {statusOptions.find(o => o.value === selectedOrder.status)?.label}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Customer</p>
                                    <p className="font-medium">{selectedOrder.lead_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Scope of Work</p>
                                    <p className="text-sm">{selectedOrder.scope_of_work}</p>
                                </div>
                                {selectedOrder.quotation_total && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Value</p>
                                        <p className="font-semibold text-primary">₹{selectedOrder.quotation_total.toLocaleString()}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Expected Start</p>
                                        <p>{formatDate(selectedOrder.expected_start_date) || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Expected End</p>
                                        <p>{formatDate(selectedOrder.expected_end_date) || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Convert to AMC Modal */}
                <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Convert to AMC</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                            <div className="space-y-4">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Work Order</p>
                                    <p className="font-medium">{selectedOrder.work_order_number}</p>
                                    <p className="text-sm text-muted-foreground">{selectedOrder.lead_name}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>AMC Plan *</Label>
                                    <Select
                                        value={conversionData.amc_plan_id}
                                        onValueChange={(value) => setConversionData({ ...conversionData, amc_plan_id: value })}
                                    >
                                        <SelectTrigger data-testid="amc-plan-select">
                                            <SelectValue placeholder="Select plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {amcPlans.map(plan => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.name} - {plan.frequency} (₹{plan.price})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date *</Label>
                                        <Input
                                            type="date"
                                            value={conversionData.start_date}
                                            onChange={(e) => setConversionData({ ...conversionData, start_date: e.target.value })}
                                            data-testid="amc-start-date"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date *</Label>
                                        <Input
                                            type="date"
                                            value={conversionData.end_date}
                                            onChange={(e) => setConversionData({ ...conversionData, end_date: e.target.value })}
                                            data-testid="amc-end-date"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Assign Engineer (Optional)</Label>
                                    <Select
                                        value={conversionData.assigned_engineer_id || "none"}
                                        onValueChange={(value) => setConversionData({ ...conversionData, assigned_engineer_id: value === "none" ? "" : value })}
                                    >
                                        <SelectTrigger data-testid="amc-engineer-select">
                                            <SelectValue placeholder="Select engineer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (Assign later)</SelectItem>
                                            {engineers.map(eng => (
                                                <SelectItem key={eng.id} value={eng.id}>{eng.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button 
                                    className="w-full" 
                                    onClick={handleConvertToAMC}
                                    disabled={converting}
                                    data-testid="convert-amc-btn"
                                >
                                    {converting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Target className="h-4 w-4 mr-2" />}
                                    Convert to AMC & Generate Services
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
