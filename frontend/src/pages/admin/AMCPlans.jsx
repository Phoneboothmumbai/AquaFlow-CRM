import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { amcPlanAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
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
import { Plus, Trash2, Edit, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AMCPlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [checklistItem, setChecklistItem] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        frequency: 'weekly',
        visits_per_month: 4,
        price: '',
        checklist_items: []
    });

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const res = await amcPlanAPI.getAll();
            setPlans(res.data);
        } catch (error) {
            toast.error('Failed to load AMC plans');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            frequency: 'weekly',
            visits_per_month: 4,
            price: '',
            checklist_items: []
        });
        setEditingPlan(null);
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description || '',
            frequency: plan.frequency,
            visits_per_month: plan.visits_per_month,
            price: plan.price.toString(),
            checklist_items: plan.checklist_items || []
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const data = {
            ...formData,
            price: parseFloat(formData.price),
            visits_per_month: parseInt(formData.visits_per_month)
        };

        try {
            if (editingPlan) {
                await amcPlanAPI.update(editingPlan.id, data);
                toast.success('Plan updated successfully');
            } else {
                await amcPlanAPI.create(data);
                toast.success('Plan created successfully');
            }
            setShowModal(false);
            resetForm();
            loadPlans();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save plan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;
        try {
            await amcPlanAPI.delete(id);
            toast.success('Plan deleted');
            loadPlans();
        } catch (error) {
            toast.error('Failed to delete plan');
        }
    };

    const addChecklistItem = () => {
        if (checklistItem.trim()) {
            setFormData({
                ...formData,
                checklist_items: [...formData.checklist_items, checklistItem.trim()]
            });
            setChecklistItem('');
        }
    };

    const removeChecklistItem = (index) => {
        setFormData({
            ...formData,
            checklist_items: formData.checklist_items.filter((_, i) => i !== index)
        });
    };

    const frequencyLabel = {
        weekly: 'Weekly',
        biweekly: 'Bi-Weekly',
        monthly: 'Monthly'
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
            <div className="space-y-6" data-testid="amc-plans-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold">AMC Plans</h1>
                        <p className="text-muted-foreground">Define service plans with frequency and checklist</p>
                    </div>
                    <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button data-testid="add-plan-btn">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create AMC Plan'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Plan Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Premium Monthly Plan"
                                        required
                                        data-testid="plan-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Full maintenance including chemicals..."
                                        data-testid="plan-description-input"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Frequency *</Label>
                                        <Select
                                            value={formData.frequency}
                                            onValueChange={(value) => {
                                                const visits = value === 'weekly' ? 4 : value === 'biweekly' ? 2 : 1;
                                                setFormData({ ...formData, frequency: value, visits_per_month: visits });
                                            }}
                                        >
                                            <SelectTrigger data-testid="plan-frequency-select">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price (₹) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="5000"
                                            required
                                            data-testid="plan-price-input"
                                        />
                                    </div>
                                </div>

                                {/* Checklist Section */}
                                <div className="space-y-2">
                                    <Label>Service Checklist</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={checklistItem}
                                            onChange={(e) => setChecklistItem(e.target.value)}
                                            placeholder="Check pH level"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addChecklistItem();
                                                }
                                            }}
                                            data-testid="checklist-item-input"
                                        />
                                        <Button type="button" variant="outline" onClick={addChecklistItem} data-testid="add-checklist-item-btn">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {formData.checklist_items.length > 0 && (
                                        <div className="space-y-1 mt-2">
                                            {formData.checklist_items.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md">
                                                    <span className="text-sm">{item}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => removeChecklistItem(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" disabled={saving} data-testid="save-plan-btn">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Plans Grid */}
                {plans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <Card key={plan.id} className="card-hover" data-testid={`plan-card-${plan.id}`}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-heading font-semibold text-lg">{plan.name}</h3>
                                            <Badge variant="outline" className="mt-1">
                                                {frequencyLabel[plan.frequency]}
                                            </Badge>
                                        </div>
                                        <p className="text-xl font-bold text-primary">
                                            ₹{plan.price.toLocaleString()}
                                        </p>
                                    </div>
                                    
                                    {plan.description && (
                                        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                                    )}
                                    
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {plan.visits_per_month} visits/month
                                    </p>

                                    {plan.checklist_items?.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-medium text-muted-foreground mb-2">Checklist:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {plan.checklist_items.slice(0, 3).map((item, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        {item}
                                                    </Badge>
                                                ))}
                                                {plan.checklist_items.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{plan.checklist_items.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2 border-t border-border">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleEdit(plan)}
                                            data-testid={`edit-plan-${plan.id}`}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => handleDelete(plan.id)}
                                            data-testid={`delete-plan-${plan.id}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">No AMC plans created yet. Create your first plan!</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
