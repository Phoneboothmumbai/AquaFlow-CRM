import React, { useState, useEffect } from 'react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { customerPortalAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Clock, MapPin, CheckCircle, User, FileText } from 'lucide-react';
import { formatDate, formatDateTime, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function CustomerServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const res = await customerPortalAPI.getServices();
            setServices(res.data);
        } catch (error) {
            console.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <CustomerLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div className="space-y-6" data-testid="customer-services-page">
                <div>
                    <h1 className="text-xl font-heading font-bold">Service History</h1>
                    <p className="text-sm text-muted-foreground">View all your pool maintenance visits</p>
                </div>

                {services.length > 0 ? (
                    <div className="space-y-3">
                        {services.map((service) => (
                            <Card 
                                key={service.id} 
                                className="cursor-pointer card-hover"
                                onClick={() => {
                                    setSelectedService(service);
                                    setShowDetails(true);
                                }}
                                data-testid={`service-card-${service.id}`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium">{formatDate(service.scheduled_date)}</p>
                                            <p className="text-sm text-muted-foreground">{service.pool_name}</p>
                                        </div>
                                        <Badge className={getStatusColor(service.status)}>
                                            {getStatusLabel(service.status)}
                                        </Badge>
                                    </div>
                                    {service.engineer_name && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="h-4 w-4" />
                                            {service.engineer_name}
                                        </div>
                                    )}
                                    {service.status === 'completed' && service.service_log && (
                                        <div className="mt-2 pt-2 border-t border-border">
                                            <p className="text-xs text-muted-foreground">
                                                Duration: {service.service_log.duration_minutes} mins
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No services recorded yet</p>
                        </CardContent>
                    </Card>
                )}

                {/* Service Details Modal */}
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Service Details</DialogTitle>
                        </DialogHeader>
                        {selectedService && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">{formatDate(selectedService.scheduled_date)}</p>
                                    <Badge className={getStatusColor(selectedService.status)}>
                                        {getStatusLabel(selectedService.status)}
                                    </Badge>
                                </div>

                                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedService.pool_name}</span>
                                    </div>
                                    {selectedService.engineer_name && (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{selectedService.engineer_name}</span>
                                        </div>
                                    )}
                                </div>

                                {selectedService.service_log && (
                                    <>
                                        <div>
                                            <h4 className="font-medium text-sm mb-2">Service Timeline</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Started</span>
                                                    <span>{formatDateTime(selectedService.service_log.start_time)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Ended</span>
                                                    <span>{formatDateTime(selectedService.service_log.end_time)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Duration</span>
                                                    <span className="font-medium">{selectedService.service_log.duration_minutes} minutes</span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedService.service_log.checklist_completed?.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-sm mb-2">Completed Tasks</h4>
                                                <div className="space-y-1">
                                                    {selectedService.service_log.checklist_completed.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-sm">
                                                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedService.service_log.readings && (
                                            <div>
                                                <h4 className="font-medium text-sm mb-2">Water Readings</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {selectedService.service_log.readings.ph && (
                                                        <div className="p-2 bg-muted/50 rounded text-center">
                                                            <p className="text-xs text-muted-foreground">pH Level</p>
                                                            <p className="font-mono font-medium">{selectedService.service_log.readings.ph}</p>
                                                        </div>
                                                    )}
                                                    {selectedService.service_log.readings.chlorine && (
                                                        <div className="p-2 bg-muted/50 rounded text-center">
                                                            <p className="text-xs text-muted-foreground">Chlorine (ppm)</p>
                                                            <p className="font-mono font-medium">{selectedService.service_log.readings.chlorine}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {selectedService.service_log.remarks && (
                                            <div>
                                                <h4 className="font-medium text-sm mb-2">Remarks</h4>
                                                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                                    {selectedService.service_log.remarks}
                                                </p>
                                            </div>
                                        )}

                                        <div className="text-xs text-muted-foreground pt-2 border-t">
                                            <p>Service performed on-site with GPS verification</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </CustomerLayout>
    );
}
