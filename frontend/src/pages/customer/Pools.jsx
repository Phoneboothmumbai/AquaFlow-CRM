import React, { useState, useEffect } from 'react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { customerPortalAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Droplets } from 'lucide-react';

export default function CustomerPools() {
    const [pools, setPools] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPools();
    }, []);

    const loadPools = async () => {
        try {
            const res = await customerPortalAPI.getPools();
            setPools(res.data);
        } catch (error) {
            console.error('Failed to load pools');
        } finally {
            setLoading(false);
        }
    };

    const poolTypeColors = {
        residential: 'bg-blue-100 text-blue-700',
        commercial: 'bg-purple-100 text-purple-700',
        olympic: 'bg-amber-100 text-amber-700'
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
            <div className="space-y-6" data-testid="customer-pools-page">
                <div>
                    <h1 className="text-xl font-heading font-bold">My Pools</h1>
                    <p className="text-sm text-muted-foreground">Your registered swimming pools</p>
                </div>

                {pools.length > 0 ? (
                    <div className="space-y-3">
                        {pools.map((pool) => (
                            <Card key={pool.id} data-testid={`pool-card-${pool.id}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Droplets className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{pool.name}</p>
                                                <Badge className={poolTypeColors[pool.pool_type]}>
                                                    {pool.pool_type}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    {pool.size && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Size: {pool.size}
                                        </p>
                                    )}
                                    {pool.volume_liters && (
                                        <p className="text-sm text-muted-foreground">
                                            Volume: {pool.volume_liters.toLocaleString()} liters
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Droplets className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No pools registered yet</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </CustomerLayout>
    );
}
