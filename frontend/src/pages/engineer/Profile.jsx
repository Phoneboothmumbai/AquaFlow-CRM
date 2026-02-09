import React from 'react';
import { EngineerLayout } from '../../components/layout/EngineerLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { User, Mail, Phone, Building } from 'lucide-react';

export default function EngineerProfile() {
    const { user } = useAuth();

    return (
        <EngineerLayout>
            <div className="space-y-6" data-testid="engineer-profile">
                <div>
                    <h1 className="text-xl font-heading font-bold">My Profile</h1>
                    <p className="text-sm text-muted-foreground">Your account details</p>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-heading font-semibold">{user?.name}</h2>
                                <p className="text-sm text-muted-foreground">Field Engineer</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="font-medium">{user?.email}</p>
                                </div>
                            </div>

                            {user?.phone && (
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="font-medium">{user.phone}</p>
                                    </div>
                                </div>
                            )}

                            {user?.company_name && (
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Building className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Company</p>
                                        <p className="font-medium">{user.company_name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </EngineerLayout>
    );
}
