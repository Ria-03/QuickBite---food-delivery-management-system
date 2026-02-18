import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Shield, Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
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
            if (res.user.role === 'admin') {
                showToast(`Welcome back, Admin ${res.user.name}!`, 'success');
                navigate("/admin/dashboard");
            } else {
                setError("Access Denied: This portal is for Administrators only.");
                showToast("Access Denied: Admins Only", "error");
                await logout();
            }
        } else {
            setError(res.message);
            showToast(res.message, 'error');
        }
    };

    return (
        <AuthLayout
            title="Admin Portal"
            subtitle="Manage your restaurant platform, users, and global settings."
            image="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1932&q=80" // High-tech office or dashboard abstract
            backLink="/"
            backText="Back to Site"
        >
            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem'
                }}>
                    <AlertTriangle size={20} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="animate-slide-up delay-200">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Administrator Email</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                        <Mail size={20} className="input-icon" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', zIndex: 1 }} />
                        <input
                            type="email"
                            className="form-input"
                            style={{ paddingLeft: '3rem' }}
                            placeholder="admin@quickbite.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Secure Key / Password</label>
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
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#0f172a', /* Keep dark theme for admin */
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.75rem',
                        letterSpacing: '0.5px'
                    }}
                >
                    {isLoading ? 'Verifying...' : (
                        <>Access Dashboard <Shield size={18} /></>
                    )}
                </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: '0.9rem', color: 'var(--gray)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    Not an admin? Go to main login <ArrowRight size={14} />
                </Link>
            </div>
        </AuthLayout>
    );
};

export default AdminLogin;
