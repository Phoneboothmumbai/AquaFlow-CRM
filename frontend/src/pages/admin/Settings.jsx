import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { companyAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Loader2, Building, Palette, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState({
        name: '',
        address: '',
        phone: '',
        logo_url: '',
        primary_color: '#007AFF',
        crm_enabled: false
    });

    useEffect(() => {
        loadCompany();
    }, []);

    const loadCompany = async () => {
        try {
            const res = await companyAPI.get();
            setCompany(res.data);
        } catch (error) {
            console.error('Failed to load company');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await companyAPI.update(company);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
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
            <div className="space-y-6 max-w-2xl" data-testid="settings-page">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage your company profile and branding</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Company Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input
                                    id="name"
                                    value={company.name}
                                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                    data-testid="company-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={company.phone || ''}
                                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                                    data-testid="company-phone-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={company.address || ''}
                                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                                    data-testid="company-address-input"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Branding */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Branding
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="logo_url">Logo URL</Label>
                                <Input
                                    id="logo_url"
                                    value={company.logo_url || ''}
                                    onChange={(e) => setCompany({ ...company, logo_url: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    data-testid="company-logo-input"
                                />
                                {company.logo_url && (
                                    <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                                        <img 
                                            src={company.logo_url} 
                                            alt="Logo preview" 
                                            className="h-12 object-contain"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primary_color">Primary Color</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="primary_color"
                                        type="color"
                                        value={company.primary_color}
                                        onChange={(e) => setCompany({ ...company, primary_color: e.target.value })}
                                        className="w-16 h-10 p-1 cursor-pointer"
                                        data-testid="company-color-input"
                                    />
                                    <Input
                                        value={company.primary_color}
                                        onChange={(e) => setCompany({ ...company, primary_color: e.target.value })}
                                        className="font-mono"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CRM Module */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Sales CRM Module
                            </CardTitle>
                            <CardDescription>
                                Enable sales pipeline management with leads, quotations, and work orders
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Enable CRM Module</p>
                                    <p className="text-sm text-muted-foreground">
                                        Manage leads, quotations, work orders, and convert to AMC
                                    </p>
                                </div>
                                <Switch
                                    checked={company.crm_enabled}
                                    onCheckedChange={(checked) => setCompany({ ...company, crm_enabled: checked })}
                                    data-testid="crm-enabled-switch"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={saving} data-testid="save-settings-btn">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Settings
                    </Button>
                </form>
            </div>
        </AdminLayout>
    );
}
