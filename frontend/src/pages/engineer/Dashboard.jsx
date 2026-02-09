import React, { useState, useEffect } from 'react';
import { EngineerLayout } from '../../components/layout/EngineerLayout';
import { engineerServiceAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { MapPin, Clock, Play, Square, CheckCircle, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentPosition, formatTime, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function EngineerDashboard() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [showStartModal, setShowStartModal] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [serviceLog, setServiceLog] = useState(null);

    const [endFormData, setEndFormData] = useState({
        checklist_completed: [],
        readings: { ph: '', chlorine: '' },
        remarks: ''
    });

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await engineerServiceAPI.getMyServices(today);
            setServices(res.data);
        } catch (error) {
            console.error('Failed to load services:', error);
            toast.error('Failed to load today\'s services');
        } finally {
            setLoading(false);
        }
    };

    const handleStartClick = async (service) => {
        setSelectedService(service);
        setLocationError(null);
        setCurrentLocation(null);
        setShowStartModal(true);

        try {
            const location = await getCurrentPosition();
            setCurrentLocation(location);
        } catch (error) {
            setLocationError('Unable to get your location. Please enable GPS and try again.');
        }
    };

    const handleStartService = async () => {
        if (!currentLocation) {
            toast.error('Location is required to start service');
            return;
        }

        setActionLoading(true);
        try {
            await engineerServiceAPI.startService({
                service_id: selectedService.id,
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude
            });
            toast.success('Service started! Location recorded.');
            setShowStartModal(false);
            loadServices();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to start service');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEndClick = async (service) => {
        setSelectedService(service);
        setLocationError(null);
        setCurrentLocation(null);
        setEndFormData({
            checklist_completed: [],
            readings: { ph: '', chlorine: '' },
            remarks: ''
        });
        setShowEndModal(true);

        // Load service log for checklist items
        try {
            const logRes = await engineerServiceAPI.getServiceLog(service.id);
            setServiceLog(logRes.data);
        } catch (error) {
            console.error('Failed to load service log');
        }

        try {
            const location = await getCurrentPosition();
            setCurrentLocation(location);
        } catch (error) {
            setLocationError('Unable to get your location. Please enable GPS and try again.');
        }
    };

    const handleEndService = async () => {
        if (!currentLocation) {
            toast.error('Location is required to end service');
            return;
        }

        setActionLoading(true);
        try {
            await engineerServiceAPI.endService({
                service_id: selectedService.id,
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                checklist_completed: endFormData.checklist_completed,
                readings: {
                    ph: endFormData.readings.ph ? parseFloat(endFormData.readings.ph) : null,
                    chlorine: endFormData.readings.chlorine ? parseFloat(endFormData.readings.chlorine) : null
                },
                remarks: endFormData.remarks,
                photos: []
            });
            toast.success('Service completed! Great job.');
            setShowEndModal(false);
            loadServices();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to end service');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleChecklistItem = (item) => {
        setEndFormData(prev => ({
            ...prev,
            checklist_completed: prev.checklist_completed.includes(item)
                ? prev.checklist_completed.filter(i => i !== item)
                : [...prev.checklist_completed, item]
        }));
    };

    const scheduledServices = services.filter(s => s.status === 'scheduled');
    const inProgressServices = services.filter(s => s.status === 'in_progress');
    const completedServices = services.filter(s => s.status === 'completed');

    if (loading) {
        return (
            <EngineerLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </EngineerLayout>
        );
    }

    return (
        <EngineerLayout>
            <div className="space-y-6" data-testid="engineer-dashboard">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-heading font-bold">Today's Jobs</h1>
                    <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card>
                        <CardContent className="p-3 text-center">
                            <p className="text-xl font-bold text-blue-500">{scheduledServices.length}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 text-center">
                            <p className="text-xl font-bold text-amber-500">{inProgressServices.length}</p>
                            <p className="text-xs text-muted-foreground">In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 text-center">
                            <p className="text-xl font-bold text-emerald-500">{completedServices.length}</p>
                            <p className="text-xs text-muted-foreground">Done</p>
                        </CardContent>
                    </Card>
                </div>

                {/* In Progress Services - Priority */}
                {inProgressServices.length > 0 && (
                    <div>
                        <h2 className="font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            In Progress
                        </h2>
                        <div className="space-y-3">
                            {inProgressServices.map((service) => (
                                <Card key={service.id} className="border-amber-200 bg-amber-50/50" data-testid={`in-progress-service-${service.id}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-medium">{service.customer_name}</p>
                                                <p className="text-sm text-muted-foreground">{service.pool_name}</p>
                                            </div>
                                            <Badge className="status-in-progress">In Progress</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                            <MapPin className="h-4 w-4" />
                                            <span className="truncate">{service.address}</span>
                                        </div>
                                        <Button
                                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => handleEndClick(service)}
                                            data-testid={`end-service-btn-${service.id}`}
                                        >
                                            <Square className="h-4 w-4 mr-2" />
                                            End Service
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Scheduled Services */}
                {scheduledServices.length > 0 && (
                    <div>
                        <h2 className="font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Scheduled ({scheduledServices.length})
                        </h2>
                        <div className="space-y-3">
                            {scheduledServices.map((service) => (
                                <Card key={service.id} data-testid={`scheduled-service-${service.id}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-medium">{service.customer_name}</p>
                                                <p className="text-sm text-muted-foreground">{service.pool_name}</p>
                                            </div>
                                            <Badge className="status-scheduled">Scheduled</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                            <MapPin className="h-4 w-4" />
                                            <span className="truncate">{service.address}</span>
                                        </div>
                                        {service.amc_plan_name && (
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Plan: {service.amc_plan_name}
                                            </p>
                                        )}
                                        <Button
                                            className="w-full"
                                            onClick={() => handleStartClick(service)}
                                            data-testid={`start-service-btn-${service.id}`}
                                        >
                                            <Play className="h-4 w-4 mr-2" />
                                            Start Service
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Services */}
                {completedServices.length > 0 && (
                    <div>
                        <h2 className="font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Completed ({completedServices.length})
                        </h2>
                        <div className="space-y-3">
                            {completedServices.map((service) => (
                                <Card key={service.id} className="opacity-75" data-testid={`completed-service-${service.id}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{service.customer_name}</p>
                                                <p className="text-sm text-muted-foreground">{service.pool_name}</p>
                                            </div>
                                            <Badge className="status-completed">Completed</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {services.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                            <p className="text-muted-foreground">No services scheduled for today!</p>
                        </CardContent>
                    </Card>
                )}

                {/* Start Service Modal */}
                <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Start Service</DialogTitle>
                        </DialogHeader>
                        {selectedService && (
                            <div className="space-y-4">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="font-medium">{selectedService.customer_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedService.pool_name}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedService.address}</p>
                                </div>

                                <div className="p-3 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Navigation className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-sm">GPS Location</span>
                                    </div>
                                    {locationError ? (
                                        <div className="flex items-center gap-2 text-destructive text-sm">
                                            <AlertCircle className="h-4 w-4" />
                                            {locationError}
                                        </div>
                                    ) : currentLocation ? (
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Getting location...
                                        </div>
                                    )}
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleStartService}
                                    disabled={!currentLocation || actionLoading}
                                    data-testid="confirm-start-btn"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Play className="h-4 w-4 mr-2" />
                                    )}
                                    Confirm & Start Work
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* End Service Modal */}
                <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
                    <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Complete Service</DialogTitle>
                        </DialogHeader>
                        {selectedService && (
                            <div className="space-y-4">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="font-medium">{selectedService.customer_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedService.pool_name}</p>
                                </div>

                                {/* Checklist */}
                                {selectedService.checklist_items?.length > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium">Service Checklist</Label>
                                        <div className="space-y-2 mt-2">
                                            {selectedService.checklist_items.map((item, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`check-${index}`}
                                                        checked={endFormData.checklist_completed.includes(item)}
                                                        onCheckedChange={() => toggleChecklistItem(item)}
                                                        data-testid={`checklist-item-${index}`}
                                                    />
                                                    <label htmlFor={`check-${index}`} className="text-sm">
                                                        {item}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Readings */}
                                <div>
                                    <Label className="text-sm font-medium">Water Readings (Optional)</Label>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <div>
                                            <Label htmlFor="ph" className="text-xs text-muted-foreground">pH Level</Label>
                                            <Input
                                                id="ph"
                                                type="number"
                                                step="0.1"
                                                placeholder="7.2"
                                                value={endFormData.readings.ph}
                                                onChange={(e) => setEndFormData(prev => ({
                                                    ...prev,
                                                    readings: { ...prev.readings, ph: e.target.value }
                                                }))}
                                                data-testid="ph-reading-input"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="chlorine" className="text-xs text-muted-foreground">Chlorine (ppm)</Label>
                                            <Input
                                                id="chlorine"
                                                type="number"
                                                step="0.1"
                                                placeholder="2.5"
                                                value={endFormData.readings.chlorine}
                                                onChange={(e) => setEndFormData(prev => ({
                                                    ...prev,
                                                    readings: { ...prev.readings, chlorine: e.target.value }
                                                }))}
                                                data-testid="chlorine-reading-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                <div>
                                    <Label htmlFor="remarks" className="text-sm font-medium">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        placeholder="Any issues or observations..."
                                        value={endFormData.remarks}
                                        onChange={(e) => setEndFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                        className="mt-1"
                                        data-testid="remarks-input"
                                    />
                                </div>

                                {/* Location */}
                                <div className="p-3 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Navigation className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-sm">End Location</span>
                                    </div>
                                    {locationError ? (
                                        <div className="flex items-center gap-2 text-destructive text-sm">
                                            <AlertCircle className="h-4 w-4" />
                                            {locationError}
                                        </div>
                                    ) : currentLocation ? (
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Getting location...
                                        </div>
                                    )}
                                </div>

                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    onClick={handleEndService}
                                    disabled={!currentLocation || actionLoading}
                                    data-testid="confirm-end-btn"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Complete Service
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </EngineerLayout>
    );
}
