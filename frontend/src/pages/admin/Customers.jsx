import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { customerAPI, poolAPI, amcAssignmentAPI, amcPlanAPI, engineerAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
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
import { Plus, Search, Droplets, FileText, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddPoolModal, setShowAddPoolModal] = useState(false);
    const [showAddAMCModal, setShowAddAMCModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerPools, setCustomerPools] = useState([]);
    const [customerAMCs, setCustomerAMCs] = useState([]);
    const [amcPlans, setAmcPlans] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [saving, setSaving] = useState(false);

    const [newCustomer, setNewCustomer] = useState({
        name: '', email: '', phone: '', address: '', city: '', notes: ''
    });

    const [newPool, setNewPool] = useState({
        name: '', pool_type: 'residential', size: '', volume_liters: '', location_notes: ''
    });

    const [newAMC, setNewAMC] = useState({
        pool_id: '', amc_plan_id: '', start_date: '', end_date: '', assigned_engineer_id: ''
    });

    useEffect(() => {
        loadCustomers();
        loadAmcPlans();
        loadEngineers();
    }, []);

    const loadCustomers = async () => {
        try {
            const res = await customerAPI.getAll();
            setCustomers(res.data);
        } catch (error) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const loadAmcPlans = async () => {
        try {
            const res = await amcPlanAPI.getAll();
            setAmcPlans(res.data);
        } catch (error) {
            console.error('Failed to load AMC plans');
        }
    };

    const loadEngineers = async () => {
        try {
            const res = await engineerAPI.getAll();
            setEngineers(res.data);
        } catch (error) {
            console.error('Failed to load engineers');
        }
    };

    const loadCustomerDetails = async (customer) => {
        setSelectedCustomer(customer);
        try {
            const [poolsRes, amcsRes] = await Promise.all([
                poolAPI.getAll(customer.id),
                amcAssignmentAPI.getAll(customer.id)
            ]);
            setCustomerPools(poolsRes.data);
            setCustomerAMCs(amcsRes.data);
            setShowDetailsModal(true);
        } catch (error) {
            toast.error('Failed to load customer details');
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await customerAPI.create(newCustomer);
            toast.success('Customer created successfully');
            setShowAddModal(false);
            setNewCustomer({ name: '', email: '', phone: '', address: '', city: '', notes: '' });
            loadCustomers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create customer');
        } finally {
            setSaving(false);
        }
    };

    const handleAddPool = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await poolAPI.create({
                ...newPool,
                customer_id: selectedCustomer.id,
                volume_liters: newPool.volume_liters ? parseInt(newPool.volume_liters) : null
            });
            toast.success('Pool added successfully');
            setShowAddPoolModal(false);
            setNewPool({ name: '', pool_type: 'residential', size: '', volume_liters: '', location_notes: '' });
            loadCustomerDetails(selectedCustomer);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add pool');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAMC = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await amcAssignmentAPI.create(newAMC);
            toast.success('AMC assigned successfully! Services have been auto-scheduled.');
            setShowAddAMCModal(false);
            setNewAMC({ pool_id: '', amc_plan_id: '', start_date: '', end_date: '', assigned_engineer_id: '' });
            loadCustomerDetails(selectedCustomer);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to assign AMC');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await customerAPI.delete(id);
            toast.success('Customer deleted');
            loadCustomers();
        } catch (error) {
            toast.error('Failed to delete customer');
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div className="space-y-6" data-testid="customers-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold">Customers</h1>
                        <p className="text-muted-foreground">Manage your pool service customers</p>
                    </div>
                    <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                        <DialogTrigger asChild>
                            <Button data-testid="add-customer-btn">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Customer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Customer</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddCustomer} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Customer Name *</Label>
                                    <Input
                                        id="name"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        required
                                        data-testid="customer-name-input"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={newCustomer.email}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                            required
                                            data-testid="customer-email-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone *</Label>
                                        <Input
                                            id="phone"
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                            required
                                            data-testid="customer-phone-input"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address *</Label>
                                    <Textarea
                                        id="address"
                                        value={newCustomer.address}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                        required
                                        data-testid="customer-address-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={newCustomer.city}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                                        data-testid="customer-city-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={newCustomer.notes}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                                        data-testid="customer-notes-input"
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={saving} data-testid="save-customer-btn">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save Customer
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="search-customers-input"
                    />
                </div>

                {/* Customers Table */}
                <Card>
                    <CardContent className="p-0">
                        {filteredCustomers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Email</TableHead>
                                        <TableHead className="hidden sm:table-cell">Phone</TableHead>
                                        <TableHead className="text-center">Pools</TableHead>
                                        <TableHead className="text-center">AMCs</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell className="hidden md:table-cell">{customer.email}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{customer.phone}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{customer.pools_count}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                                                    {customer.active_amcs}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => loadCustomerDetails(customer)}
                                                        data-testid={`view-customer-${customer.id}`}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteCustomer(customer.id)}
                                                        data-testid={`delete-customer-${customer.id}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No customers found. Add your first customer!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Customer Details Modal */}
                <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
                        </DialogHeader>
                        
                        {selectedCustomer && (
                            <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-medium">{selectedCustomer.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedCustomer.phone}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Address</p>
                                        <p className="font-medium">{selectedCustomer.address}</p>
                                    </div>
                                </div>

                                {/* Pools Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Droplets className="h-4 w-4" />
                                            Pools ({customerPools.length})
                                        </h3>
                                        <Button size="sm" onClick={() => setShowAddPoolModal(true)} data-testid="add-pool-btn">
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Pool
                                        </Button>
                                    </div>
                                    {customerPools.length > 0 ? (
                                        <div className="space-y-2">
                                            {customerPools.map((pool) => (
                                                <div key={pool.id} className="p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium">{pool.name}</p>
                                                        <Badge variant="outline">{pool.pool_type}</Badge>
                                                    </div>
                                                    {pool.size && <p className="text-sm text-muted-foreground mt-1">Size: {pool.size}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No pools added yet</p>
                                    )}
                                </div>

                                {/* AMCs Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            AMC Contracts ({customerAMCs.length})
                                        </h3>
                                        <Button 
                                            size="sm" 
                                            onClick={() => setShowAddAMCModal(true)}
                                            disabled={customerPools.length === 0 || amcPlans.length === 0}
                                            data-testid="add-amc-btn"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Assign AMC
                                        </Button>
                                    </div>
                                    {customerAMCs.length > 0 ? (
                                        <div className="space-y-2">
                                            {customerAMCs.map((amc) => (
                                                <div key={amc.id} className="p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium">{amc.plan_name}</p>
                                                        <Badge className={amc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : ''}>
                                                            {amc.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Pool: {amc.pool_name} • Engineer: {amc.engineer_name || 'Unassigned'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(amc.start_date)} - {formatDate(amc.end_date)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No AMC contracts assigned</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Add Pool Modal */}
                <Dialog open={showAddPoolModal} onOpenChange={setShowAddPoolModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Pool</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddPool} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pool_name">Pool Name *</Label>
                                <Input
                                    id="pool_name"
                                    value={newPool.name}
                                    onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                                    placeholder="Main Pool"
                                    required
                                    data-testid="pool-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pool_type">Pool Type *</Label>
                                <Select
                                    value={newPool.pool_type}
                                    onValueChange={(value) => setNewPool({ ...newPool, pool_type: value })}
                                >
                                    <SelectTrigger data-testid="pool-type-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="residential">Residential</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                        <SelectItem value="olympic">Olympic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="size">Size</Label>
                                    <Input
                                        id="size"
                                        value={newPool.size}
                                        onChange={(e) => setNewPool({ ...newPool, size: e.target.value })}
                                        placeholder="10x20 ft"
                                        data-testid="pool-size-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="volume">Volume (Liters)</Label>
                                    <Input
                                        id="volume"
                                        type="number"
                                        value={newPool.volume_liters}
                                        onChange={(e) => setNewPool({ ...newPool, volume_liters: e.target.value })}
                                        data-testid="pool-volume-input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location_notes">Location Notes</Label>
                                <Textarea
                                    id="location_notes"
                                    value={newPool.location_notes}
                                    onChange={(e) => setNewPool({ ...newPool, location_notes: e.target.value })}
                                    placeholder="Backyard, near garden..."
                                    data-testid="pool-location-input"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={saving} data-testid="save-pool-btn">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Add Pool
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Add AMC Modal */}
                <Dialog open={showAddAMCModal} onOpenChange={setShowAddAMCModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign AMC Contract</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddAMC} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Pool *</Label>
                                <Select
                                    value={newAMC.pool_id}
                                    onValueChange={(value) => setNewAMC({ ...newAMC, pool_id: value })}
                                >
                                    <SelectTrigger data-testid="amc-pool-select">
                                        <SelectValue placeholder="Choose pool" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customerPools.map((pool) => (
                                            <SelectItem key={pool.id} value={pool.id}>
                                                {pool.name} ({pool.pool_type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>AMC Plan *</Label>
                                <Select
                                    value={newAMC.amc_plan_id}
                                    onValueChange={(value) => setNewAMC({ ...newAMC, amc_plan_id: value })}
                                >
                                    <SelectTrigger data-testid="amc-plan-select">
                                        <SelectValue placeholder="Choose plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {amcPlans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                {plan.name} - {plan.frequency} (₹{plan.price})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start Date *</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={newAMC.start_date}
                                        onChange={(e) => setNewAMC({ ...newAMC, start_date: e.target.value })}
                                        required
                                        data-testid="amc-start-date-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End Date *</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={newAMC.end_date}
                                        onChange={(e) => setNewAMC({ ...newAMC, end_date: e.target.value })}
                                        required
                                        data-testid="amc-end-date-input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Assign Engineer (Optional)</Label>
                                <Select
                                    value={newAMC.assigned_engineer_id}
                                    onValueChange={(value) => setNewAMC({ ...newAMC, assigned_engineer_id: value })}
                                >
                                    <SelectTrigger data-testid="amc-engineer-select">
                                        <SelectValue placeholder="Select engineer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None (Assign later)</SelectItem>
                                        {engineers.map((eng) => (
                                            <SelectItem key={eng.id} value={eng.id}>
                                                {eng.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={saving || !newAMC.pool_id || !newAMC.amc_plan_id} data-testid="save-amc-btn">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Assign AMC & Generate Services
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
