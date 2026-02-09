import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { crmAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
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
} from '../../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/ui/select';
import { 
    Plus, 
    FileText, 
    Trash2, 
    Eye, 
    Loader2,
    CheckCircle,
    XCircle,
    ArrowRight,
    Send,
    Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../../lib/utils';

const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
    { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-700' },
    { value: 'revised', label: 'Revised', color: 'bg-amber-100 text-amber-700' },
    { value: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];

export default function QuotationsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const leadIdFromUrl = searchParams.get('lead_id');
    
    const [quotations, setQuotations] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(!!leadIdFromUrl);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [saving, setSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    const [formData, setFormData] = useState({
        lead_id: leadIdFromUrl || '',
        title: '',
        items: [{ description: '', quantity: 1, unit: 'nos', unit_price: 0, amount: 0 }],
        tax_percent: 18,
        validity_days: 30,
        terms: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        try {
            const [quotationsRes, leadsRes] = await Promise.all([
                crmAPI.getQuotations({ status: statusFilter !== 'all' ? statusFilter : undefined }),
                crmAPI.getLeads()
            ]);
            setQuotations(quotationsRes.data);
            setLeads(leadsRes.data);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error('CRM module not enabled');
            } else {
                toast.error('Failed to load data');
            }
        } finally {
            setLoading(false);
        }
    };

    const addLineItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, unit: 'nos', unit_price: 0, amount: 0 }]
        });
    };

    const updateLineItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        
        // Auto-calculate amount
        if (field === 'quantity' || field === 'unit_price') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
        }
        
        setFormData({ ...formData, items: newItems });
    };

    const removeLineItem = (index) => {
        if (formData.items.length > 1) {
            setFormData({
                ...formData,
                items: formData.items.filter((_, i) => i !== index)
            });
        }
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        const taxAmount = subtotal * (formData.tax_percent / 100);
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.lead_id) {
            toast.error('Please select a lead');
            return;
        }
        
        if (formData.items.some(item => !item.description || item.amount <= 0)) {
            toast.error('Please fill all line items');
            return;
        }

        setSaving(true);
        try {
            await crmAPI.createQuotation(formData);
            toast.success('Quotation created successfully');
            setShowCreateModal(false);
            setFormData({
                lead_id: '',
                title: '',
                items: [{ description: '', quantity: 1, unit: 'nos', unit_price: 0, amount: 0 }],
                tax_percent: 18,
                validity_days: 30,
                terms: '',
                notes: ''
            });
            loadData();
            navigate('/admin/crm/quotations');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create quotation');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (quotationId, newStatus) => {
        try {
            await crmAPI.updateQuotationStatus(quotationId, newStatus);
            toast.success('Status updated');
            loadData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleCreateWorkOrder = async (quotation) => {
        try {
            await crmAPI.createWorkOrder({
                quotation_id: quotation.id,
                scope_of_work: quotation.title,
                notes: quotation.notes
            });
            toast.success('Work order created successfully');
            navigate('/admin/crm/work-orders');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create work order');
        }
    };

    const getStatusColor = (status) => {
        const option = statusOptions.find(o => o.value === status);
        return option?.color || 'bg-slate-100 text-slate-700';
    };

    const { subtotal, taxAmount, total } = calculateTotals();

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
            <div className="space-y-6" data-testid="quotations-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold">Quotations</h1>
                        <p className="text-muted-foreground">Create and manage sales quotations</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {statusOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={() => setShowCreateModal(true)} data-testid="add-quotation-btn">
                            <Plus className="h-4 w-4 mr-2" />
                            New Quotation
                        </Button>
                    </div>
                </div>

                {/* Quotations List */}
                {quotations.length > 0 ? (
                    <div className="grid gap-4">
                        {quotations.map((quotation) => (
                            <Card key={quotation.id} className="card-hover" data-testid={`quotation-${quotation.id}`}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="font-mono text-sm font-medium">{quotation.quotation_number}</span>
                                                <Badge className={getStatusColor(quotation.status)}>
                                                    {statusOptions.find(o => o.value === quotation.status)?.label}
                                                </Badge>
                                                {quotation.revision > 1 && (
                                                    <Badge variant="outline">Rev {quotation.revision}</Badge>
                                                )}
                                            </div>
                                            <h3 className="font-semibold">{quotation.title}</h3>
                                            <p className="text-sm text-muted-foreground">{quotation.lead_name}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>Valid until: {formatDate(quotation.valid_until)}</span>
                                                <span className="font-semibold text-foreground">₹{quotation.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {quotation.status === 'draft' && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleStatusChange(quotation.id, 'sent')}
                                                >
                                                    <Send className="h-4 w-4 mr-1" />
                                                    Send
                                                </Button>
                                            )}
                                            {quotation.status === 'sent' && (
                                                <>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="text-emerald-600"
                                                        onClick={() => handleStatusChange(quotation.id, 'approved')}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="text-red-600"
                                                        onClick={() => handleStatusChange(quotation.id, 'rejected')}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {quotation.status === 'approved' && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleCreateWorkOrder(quotation)}
                                                >
                                                    <Briefcase className="h-4 w-4 mr-1" />
                                                    Create Work Order
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setSelectedQuotation(quotation); setShowDetailModal(true); }}
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
                            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No quotations found. Create from lead details.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Create Quotation Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Quotation</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Select Lead *</Label>
                                    <Select
                                        value={formData.lead_id}
                                        onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                                    >
                                        <SelectTrigger data-testid="quotation-lead-select">
                                            <SelectValue placeholder="Choose lead" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leads.filter(l => l.status !== 'lost').map(lead => (
                                                <SelectItem key={lead.id} value={lead.id}>
                                                    {lead.customer_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Pool Installation & Setup"
                                        required
                                        data-testid="quotation-title-input"
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div>
                                <Label className="mb-2 block">Line Items</Label>
                                <div className="space-y-2">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-4">
                                                <Input
                                                    placeholder="Description"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                    data-testid={`item-description-${index}`}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    data-testid={`item-qty-${index}`}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    placeholder="Unit"
                                                    value={item.unit}
                                                    onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    data-testid={`item-price-${index}`}
                                                />
                                            </div>
                                            <div className="col-span-1 text-right font-medium">
                                                ₹{item.amount.toLocaleString()}
                                            </div>
                                            <div className="col-span-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLineItem(index)}
                                                    disabled={formData.items.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addLineItem}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Item
                                </Button>
                            </div>

                            {/* Totals */}
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center gap-2">
                                    <span>Tax</span>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={formData.tax_percent}
                                            onChange={(e) => setFormData({ ...formData, tax_percent: parseFloat(e.target.value) || 0 })}
                                            className="w-16 h-8"
                                        />
                                        <span>%</span>
                                        <span className="ml-2">₹{taxAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                    <span>Total</span>
                                    <span className="text-primary">₹{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="validity_days">Validity (Days)</Label>
                                    <Input
                                        id="validity_days"
                                        type="number"
                                        value={formData.validity_days}
                                        onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 30 })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="terms">Terms & Conditions</Label>
                                <Textarea
                                    id="terms"
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                    placeholder="Payment terms, warranty, etc."
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={saving} data-testid="save-quotation-btn">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Quotation
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Detail Modal */}
                <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Quotation Details</DialogTitle>
                        </DialogHeader>
                        {selectedQuotation && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono">{selectedQuotation.quotation_number}</span>
                                    <Badge className={getStatusColor(selectedQuotation.status)}>
                                        {statusOptions.find(o => o.value === selectedQuotation.status)?.label}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Customer</p>
                                    <p className="font-medium">{selectedQuotation.lead_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Title</p>
                                    <p className="font-medium">{selectedQuotation.title}</p>
                                </div>

                                {/* Items */}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Line Items</p>
                                    <div className="space-y-2">
                                        {selectedQuotation.items.map((item, i) => (
                                            <div key={i} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                                                <span>{item.description} x {item.quantity} {item.unit}</span>
                                                <span>₹{item.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>₹{selectedQuotation.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax ({selectedQuotation.tax_percent}%)</span>
                                        <span>₹{selectedQuotation.tax_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-base border-t pt-1">
                                        <span>Total</span>
                                        <span className="text-primary">₹{selectedQuotation.total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    Valid until: {formatDate(selectedQuotation.valid_until)}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
