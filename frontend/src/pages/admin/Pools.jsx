import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { poolAPI, customerAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { Search, Droplets } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function PoolsPage() {
    const [pools, setPools] = useState([]);
    const [customers, setCustomers] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [poolsRes, customersRes] = await Promise.all([
                poolAPI.getAll(),
                customerAPI.getAll()
            ]);
            setPools(poolsRes.data);
            
            // Create customer lookup
            const customerMap = {};
            customersRes.data.forEach(c => {
                customerMap[c.id] = c;
            });
            setCustomers(customerMap);
        } catch (error) {
            console.error('Failed to load pools');
        } finally {
            setLoading(false);
        }
    };

    const filteredPools = pools.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers[p.customer_id]?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const poolTypeColors = {
        residential: 'bg-blue-100 text-blue-700',
        commercial: 'bg-purple-100 text-purple-700',
        olympic: 'bg-amber-100 text-amber-700'
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
            <div className="space-y-6" data-testid="pools-page">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold">Pools</h1>
                    <p className="text-muted-foreground">All registered swimming pools</p>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search pools or customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="search-pools-input"
                    />
                </div>

                {/* Pools Table */}
                <Card>
                    <CardContent className="p-0">
                        {filteredPools.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pool Name</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="hidden md:table-cell">Size</TableHead>
                                        <TableHead className="hidden md:table-cell">Added</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPools.map((pool) => (
                                        <TableRow key={pool.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Droplets className="h-4 w-4 text-primary" />
                                                    <span className="font-medium">{pool.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{customers[pool.customer_id]?.name || '-'}</TableCell>
                                            <TableCell>
                                                <Badge className={poolTypeColors[pool.pool_type]}>
                                                    {pool.pool_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{pool.size || '-'}</TableCell>
                                            <TableCell className="hidden md:table-cell">{formatDate(pool.created_at)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <Droplets className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p className="text-muted-foreground">No pools found. Add pools from customer details.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
