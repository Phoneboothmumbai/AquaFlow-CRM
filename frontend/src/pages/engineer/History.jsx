import React, { useState, useEffect } from 'react';
import { EngineerLayout } from '../../components/layout/EngineerLayout';
import { engineerServiceAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Calendar, CheckCircle } from 'lucide-react';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function EngineerHistory() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        // Load last 7 days by default
        loadRecentServices();
    }, []);

    const loadRecentServices = async () => {
        try {
            // Get services from past 7 days
            const results = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                try {
                    const res = await engineerServiceAPI.getMyServices(dateStr);
                    results.push(...res.data);
                } catch (e) {
                    // Continue if no services for date
                }
            }
            setServices(results);
        } catch (error) {
            console.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const loadServicesByDate = async (date) => {
        setSelectedDate(date);
        setLoading(true);
        try {
            const res = await engineerServiceAPI.getMyServices(date);
            setServices(res.data);
        } catch (error) {
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="space-y-6" data-testid="engineer-history">
                <div>
                    <h1 className="text-xl font-heading font-bold">Service History</h1>
                    <p className="text-sm text-muted-foreground">Your completed services</p>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => loadServicesByDate(e.target.value)}
                        className="w-auto"
                        data-testid="history-date-input"
                    />
                </div>

                {/* Stats */}
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-500">{completedServices.length}</p>
                        <p className="text-sm text-muted-foreground">Services Completed</p>
                    </CardContent>
                </Card>

                {/* Services List */}
                {services.length > 0 ? (
                    <div className="space-y-3">
                        {services.map((service) => (
                            <Card key={service.id} data-testid={`history-service-${service.id}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium">{service.customer_name}</p>
                                            <p className="text-sm text-muted-foreground">{service.pool_name}</p>
                                        </div>
                                        <Badge className={getStatusColor(service.status)}>
                                            {getStatusLabel(service.status)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(service.scheduled_date)}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No services found for selected date</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </EngineerLayout>
    );
}
