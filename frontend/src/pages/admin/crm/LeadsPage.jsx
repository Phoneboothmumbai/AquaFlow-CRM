import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { crmAPI } from '../../../lib/api';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { Plus, Search, Trash2, Eye, Loader2, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';

const leadStatusOptions = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
    { value: 'contacted', label: 'Contacted', color: 'bg-slate-100 text-slate-700' },
    { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-700' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-100 text-amber-700' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-700' },
    { value: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
];

const sourceOptions = ['website', 'referral', 'cold_call', 'social_media', 'exhibition', 'other'];
const poolTypes = ['residential', 'commercial', 'olympic'];

export default function LeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        customer_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        pool_type: '',
        pool_size: '',
        requirement: '',
        source: '',
        notes: ''
    });

    useEffect(() => {
        loadLeads();
    }, [statusFilter]);

    const loadLeads = async () => {
        try {
            const res = await crmAPI.getLeads(statusFilter !== 'all' ? statusFilter : undefined);
            setLeads(res.data);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error('CRM module not enabled. Please enable it in Settings.');
            } else {
                toast.error('Failed to load leads');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!formData.customer_name || !formData.phone) {
            toast.error('Please fill required fields (Name and Phone)');
            return;
        }
        
        setSaving(true);
        try {
            // Clean up empty string values - send only non-empty fields
            const cleanData = {};
            for (const [key, value] of Object.entries(formData)) {
                if (value !== '' && value !== null && value !== undefined) {
                    cleanData[key] = value;
                }
            }
            
            console.log('Submitting lead data:', cleanData);
            const response = await crmAPI.createLead(cleanData);
            console.log('Lead created:', response);
            
            toast.success('Lead created successfully');
            setFormData({
                customer_name: '', email: '', phone: '', address: '', city: '',
                pool_type: '', pool_size: '', requirement: '', source: '', notes: ''
            });
            setShowAddModal(false);
            loadLeads();
        } catch (error) {
            console.error('Lead creation error:', error.response || error);
            const errorMsg = error.response?.data?.detail || error.message || 'Failed to create lead';
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            await crmAPI.updateLead(leadId, { status: newStatus });
            toast.success('Status updated');
            loadLeads();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
        try {
            await crmAPI.deleteLead(id);
            toast.success('Lead deleted');
            loadLeads();
        } catch (error) {
            toast.error('Failed to delete lead');
        }
    };

    const handleCreateQuotation = (lead) => {
        navigate(`/admin/crm/quotations/new?lead_id=${lead.id}`);
    };

    const getStatusColor = (status) => {
        const option = leadStatusOptions.find(o => o.value === status);
        return option?.color || 'bg-slate-100 text-slate-700';
    };

    const filteredLeads = leads.filter(lead =>
        lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <div className="space-y-6" data-testid="leads-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold">Leads</h1>
                        <p className="text-muted-foreground">Manage your sales pipeline</p>
                    </div>
                    <Dialog open={showAddModal} onOpenChange={(open) => { if (!saving) setShowAddModal(open); }}>
                        <DialogTrigger asChild>
                            <Button data-testid="add-lead-btn">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lead
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => { if (saving) e.preventDefault(); }}>
                            <DialogHeader>
                                <DialogTitle>Add New Lead</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer_name">Customer Name *</Label>
                                    <Input
                                        id="customer_name"
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                        required
                                        data-testid="lead-name-input"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            data-testid="lead-email-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone *</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            data-testid="lead-phone-input"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        data-testid="lead-address-input"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            data-testid="lead-city-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Source</Label>
                                        <Select
                                            value={formData.source}
                                            onValueChange={(value) => setFormData({ ...formData, source: value })}
                                        >
                                            <SelectTrigger data-testid="lead-source-select">
                                                <SelectValue placeholder="Select source" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sourceOptions.map(s => (
                                                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Pool Type</Label>
                                        <Select
                                            value={formData.pool_type}
                                            onValueChange={(value) => setFormData({ ...formData, pool_type: value })}
                                        >
                                            <SelectTrigger data-testid="lead-pool-type-select">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {poolTypes.map(t => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pool_size">Pool Size</Label>
                                        <Input
                                            id="pool_size"
                                            value={formData.pool_size}
                                            onChange={(e) => setFormData({ ...formData, pool_size: e.target.value })}
                                            placeholder="e.g., 20x40 ft"
                                            data-testid="lead-pool-size-input"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="requirement">Requirement</Label>
                                    <Textarea
                                        id="requirement"
                                        value={formData.requirement}
                                        onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                                        placeholder="Describe customer requirements..."
                                        data-testid="lead-requirement-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        data-testid="lead-notes-input"
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={saving} data-testid="save-lead-btn">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save Lead
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="search-leads-input"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]" data-testid="status-filter-select">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {leadStatusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Leads Table */}
                <Card>
                    <CardContent className="p-0">
                        {filteredLeads.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                                        <TableHead className="hidden lg:table-cell">Pool</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden sm:table-cell">Source</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{lead.customer_name}</p>
                                                    <p className="text-xs text-muted-foreground">{lead.city}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="text-sm">
                                                    <p>{lead.phone}</p>
                                                    <p className="text-muted-foreground">{lead.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                {lead.pool_type && (
                                                    <Badge variant="outline">{lead.pool_type}</Badge>
                                                )}
                                                {lead.pool_size && (
                                                    <p className="text-xs text-muted-foreground mt-1">{lead.pool_size}</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={lead.status}
                                                    onValueChange={(value) => handleStatusChange(lead.id, value)}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8">
                                                        <Badge className={getStatusColor(lead.status)}>
                                                            {leadStatusOptions.find(o => o.value === lead.status)?.label}
                                                        </Badge>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {leadStatusOptions.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                <Badge className={opt.color}>{opt.label}</Badge>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell capitalize">
                                                {lead.source?.replace('_', ' ') || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                                                        data-testid={`view-lead-${lead.id}`}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleCreateQuotation(lead)}
                                                        title="Create Quotation"
                                                        data-testid={`quote-lead-${lead.id}`}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(lead.id)}
                                                        data-testid={`delete-lead-${lead.id}`}
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
                                <p className="text-muted-foreground">No leads found. Create your first lead!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lead Detail Modal */}
                <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Lead Details</DialogTitle>
                        </DialogHeader>
                        {selectedLead && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg">{selectedLead.customer_name}</h3>
                                    <Badge className={getStatusColor(selectedLead.status)}>
                                        {leadStatusOptions.find(o => o.value === selectedLead.status)?.label}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                    {selectedLead.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            {selectedLead.phone}
                                        </div>
                                    )}
                                    {selectedLead.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            {selectedLead.email}
                                        </div>
                                    )}
                                    {selectedLead.address && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {selectedLead.address}, {selectedLead.city}
                                        </div>
                                    )}
                                </div>

                                {(selectedLead.pool_type || selectedLead.pool_size) && (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Pool Details</p>
                                        <p className="font-medium">
                                            {selectedLead.pool_type} {selectedLead.pool_size && `• ${selectedLead.pool_size}`}
                                        </p>
                                    </div>
                                )}

                                {selectedLead.requirement && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Requirement</p>
                                        <p className="text-sm">{selectedLead.requirement}</p>
                                    </div>
                                )}

                                {selectedLead.notes && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                        <p className="text-sm">{selectedLead.notes}</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t flex gap-2">
                                    <Button 
                                        className="flex-1" 
                                        onClick={() => { setShowDetailModal(false); handleCreateQuotation(selectedLead); }}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Create Quotation
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
