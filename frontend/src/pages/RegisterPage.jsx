import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Droplets, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        company_name: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                company_name: formData.company_name,
                phone: formData.phone,
                role: 'company_admin'
            });
            toast.success('Registration successful! Welcome to AquaFlow CRM.');
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
            style={{
                backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1770387208660-ffc01897fd59?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBsdXh1cnklMjBzd2ltbWluZyUyMHBvb2x8ZW58MHx8fHwxNzcwNjI5NzE0fDA&ixlib=rb-4.1.0&q=85')`
            }}
        >
            <Card className="w-full max-w-md animate-fade-in">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
                        <Droplets className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-heading">Create Account</CardTitle>
                    <CardDescription>Register your pool service company</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input
                                id="company_name"
                                name="company_name"
                                placeholder="Your Pool Service Co."
                                value={formData.company_name}
                                onChange={handleChange}
                                required
                                data-testid="register-company-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                data-testid="register-name-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                data-testid="register-email-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                data-testid="register-phone-input"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Min 6 chars"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    data-testid="register-password-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Repeat"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    data-testid="register-confirm-password-input"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            data-testid="register-submit-btn"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Already have an account? </span>
                        <Link 
                            to="/login" 
                            className="text-primary font-medium hover:underline"
                            data-testid="login-link"
                        >
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
