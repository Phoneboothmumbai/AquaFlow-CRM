import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { serviceAPI, engineerAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Calendar, MapPin, Clock, User, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [engineerFilter, setEngineerFilter] = useState('all');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    useEffect(() => {
        loadData();
    }, [selectedDate, statusFilter, engineerFilter]);

    useEffect(() => {
        loadEngineers();
    }, []);

    const loadEngineers = async () => {
        try {
            const res = await engineerAPI.getAll();
            setEngineers(res.data);
        } catch (error) {
            console.error('Failed to load engineers');
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = { date: selectedDate };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (engineerFilter !== 'all') params.engineer_id = engineerFilter;
            
            const res = await serviceAPI.getAll(params);
            setServices(res.data);
        } catch (error) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (engineerId) => {
        try {
            await serviceAPI.assign(selectedService.id, engineerId);
            toast.success('Engineer assigned successfully');
            setShowAssignModal(false);
            loadData();
        } catch (error) {
            toast.error('Failed to assign engineer');
        }
    };

    const changeDate = (days) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const todayStats = {
        total: services.length,
        scheduled: services.filter(s => s.status === 'scheduled').length,
        inProgress: services.filter(s => s.status === 'in_progress').length,
        completed: services.filter(s => s.status === 'completed').length
    };

    return (
        <AdminLayout>
            <div className="space-y-6" data-testid="services-page">
                {/* Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold">Service Schedule</h1>
                    <p className="text-muted-foreground">Monitor and manage all scheduled services</p>
                </div>

                {/* Date Navigation & Filters */}
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => changeDate(-1)} data-testid="prev-date-btn">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-auto"
                            data-testid="date-input"
                        />
                        <Button variant="outline" size="icon" onClick={() => changeDate(1)} data-testid="next-date-btn">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            data-testid="today-btn"
                        >
                            Today
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]" data-testid="status-filter">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={engineerFilter} onValueChange={setEngineerFilter}>
                            <SelectTrigger className="w-[160px]" data-testid="engineer-filter">
                                <User className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="All Engineers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Engineers</SelectItem>
                                {engineers.map(eng => (
                                    <SelectItem key={eng.id} value={eng.id}>{eng.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">{todayStats.total}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-500">{todayStats.scheduled}</p>
                            <p className="text-xs text-muted-foreground">Scheduled</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-amber-500">{todayStats.inProgress}</p>
                            <p className="text-xs text-muted-foreground">In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-500">{todayStats.completed}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Services List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Services for {formatDate(selectedDate)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : services.length > 0 ? (
                            <>
                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-3 p-4">
                                    {services.map((service) => (
                                        <div key={service.id} className="p-4 bg-muted/30 rounded-lg" data-testid={`service-card-${service.id}`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-medium">{service.customer_name}</p>
                                                    <p className="text-sm text-muted-foreground">{service.pool_name}</p>
                                                </div>
                                                <Badge className={getStatusColor(service.status)}>
                                                    {getStatusLabel(service.status)}
                                                </Badge>
                                            </div>
                                            <div className="text-sm space-y-1 text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    {service.engineer_name || 'Unassigned'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="truncate">{service.address}</span>
                                                </div>
                                            </div>
                                            {!service.engineer_id && service.status === 'scheduled' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="mt-3 w-full"
                                                    onClick={() => {
                                                        setSelectedService(service);
                                                        setShowAssignModal(true);
                                                    }}
                                                    data-testid={`assign-btn-${service.id}`}
                                                >
                                                    Assign Engineer
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table */}
                                <Table className="hidden md:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Pool</TableHead>
                                            <TableHead>Engineer</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services.map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{service.customer_name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {service.address}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{service.pool_name}</TableCell>
                                                <TableCell>
                                                    {service.engineer_name || (
                                                        <span className="text-amber-500">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{service.amc_plan_name}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(service.status)}>
                                                        {getStatusLabel(service.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!service.engineer_id && service.status === 'scheduled' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedService(service);
                                                                setShowAssignModal(true);
                                                            }}
                                                            data-testid={`assign-btn-${service.id}`}
                                                        >
                                                            Assign
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p className="text-muted-foreground">No services scheduled for this date</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Assign Engineer Modal */}
                <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign Engineer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            {selectedService && (
                                <div className="p-3 bg-muted/50 rounded-lg mb-4">
                                    <p className="font-medium">{selectedService.customer_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedService.pool_name}</p>
                                </div>
                            )}
                            {engineers.length > 0 ? (
                                engineers.map((engineer) => (
                                    <Button
                                        key={engineer.id}
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAssign(engineer.id)}
                                        data-testid={`assign-engineer-${engineer.id}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">{engineer.name}</p>
                                            <p className="text-xs text-muted-foreground">{engineer.phone}</p>
                                        </div>
                                    </Button>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    No engineers available. Please add engineers first.
                                </p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
