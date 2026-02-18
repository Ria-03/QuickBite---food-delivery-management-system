import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Bike, Lock, Mail, ArrowRight } from 'lucide-react';

const DeliveryLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const res = await login(formData.email, formData.password);
        setIsLoading(false);

        if (res.success) {
            if (res.user.role === 'delivery') {
                showToast(`Welcome back, Rider ${res.user.name}! 🛵`, 'success');
                navigate("/delivery/dashboard");
            } else {
                showToast("This login is for Delivery Partners only.", "error");
                setError("Access Denied: Rider Partners only.");
                await logout();
            }
        } else {
            showToast(res.message, 'error');
            setError(res.message);
        }
    };

    return (
        <AuthLayout
            title="Rider Partner"
            subtitle="Join our fleet. Deliver happiness and earn on your schedule."
            image="https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80" // Delivery rider or bike image
            backLink="/"
            backText="Back to Site"
        >
            {error && (
                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="animate-slide-up delay-200">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Rider Email</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                        <Mail size={20} className="input-icon" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', zIndex: 1 }} />
                        <input
                            type="email"
                            className="form-input"
                            style={{ paddingLeft: '3rem' }}
                            placeholder="rider@quickbite.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Password</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                        <Lock size={20} className="input-icon" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', zIndex: 1 }} />
                        <input
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: '3rem' }}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Starting Engine...' : (
                        <>Start Riding <Bike size={20} /></>
                    )}
                </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link to="/register" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                    Become a Rider Partner
                </Link>
                <div style={{ marginTop: '1rem' }}>
                    <Link to="/login" style={{ fontSize: '0.9rem', color: 'var(--gray)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        Not a rider? Go to main login <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};

export default DeliveryLogin;
