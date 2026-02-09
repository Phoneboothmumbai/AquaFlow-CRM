import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { engineerAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { Plus, Trash2, Loader2, Wrench, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';

export default function EngineersPage() {
    const [engineers, setEngineers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        loadEngineers();
    }, []);

    const loadEngineers = async () => {
        try {
            const res = await engineerAPI.getAll();
            setEngineers(res.data);
        } catch (error) {
            toast.error('Failed to load engineers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await engineerAPI.create(formData);
            toast.success('Engineer added successfully. They can now login with their email and password.');
            setShowModal(false);
            setFormData({ name: '', email: '', phone: '', password: '' });
            loadEngineers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add engineer');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this engineer?')) return;
        try {
            await engineerAPI.delete(id);
            toast.success('Engineer removed');
            loadEngineers();
        } catch (error) {
            toast.error('Failed to remove engineer');
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
            <div className="space-y-6" data-testid="engineers-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold">Engineers</h1>
                        <p className="text-muted-foreground">Manage your service technicians</p>
                    </div>
                    <Dialog open={showModal} onOpenChange={setShowModal}>
                        <DialogTrigger asChild>
                            <Button data-testid="add-engineer-btn">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Engineer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Engineer</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Rajesh Kumar"
                                        required
                                        data-testid="engineer-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="engineer@company.com"
                                        required
                                        data-testid="engineer-email-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone *</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        required
                                        data-testid="engineer-phone-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Login Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min 6 characters"
                                        required
                                        minLength={6}
                                        data-testid="engineer-password-input"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Engineer will use this password to login to their portal
                                    </p>
                                </div>
                                <Button type="submit" className="w-full" disabled={saving} data-testid="save-engineer-btn">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Add Engineer
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Engineers List */}
                {engineers.length > 0 ? (
                    <>
                        {/* Mobile Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {engineers.map((engineer) => (
                                <Card key={engineer.id} data-testid={`engineer-card-${engineer.id}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Wrench className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{engineer.name}</p>
                                                    <Badge variant="outline" className={engineer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : ''}>
                                                        {engineer.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => handleDelete(engineer.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                {engineer.email}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                {engineer.phone}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <Card className="hidden md:block">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {engineers.map((engineer) => (
                                            <TableRow key={engineer.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Wrench className="h-4 w-4 text-primary" />
                                                        </div>
                                                        {engineer.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{engineer.email}</TableCell>
                                                <TableCell>{engineer.phone}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={engineer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : ''}>
                                                        {engineer.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(engineer.created_at)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(engineer.id)}
                                                        data-testid={`delete-engineer-${engineer.id}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Wrench className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No engineers added yet. Add your first engineer!</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
