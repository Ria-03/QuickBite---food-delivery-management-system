import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setIsLoading(true);

        try {
            await axios.put(`http://localhost:5000/api/auth/resetpassword/${token}`, { password });
            setIsSuccess(true);
            showToast('Password reset successfully!', 'success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <AuthLayout
                title="Success!"
                subtitle="Your password has been reset successfully."
                image="https://images.unsplash.com/photo-1557264337-e8a93017fe92?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            >
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem', color: '#10b981'
                    }}>
                        <CheckCircle size={40} />
                    </div>
                    <h3 style={{ marginBottom: '1rem' }}>You're all set!</h3>
                    <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>
                        Redirecting you to the login page in a few seconds...
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        Go to Login Now
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Please create a new password that you don't use on any other site."
            image="https://images.unsplash.com/photo-1557264337-e8a93017fe92?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            backLink="/login"
            backText="Cancel"
        >
            <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                        <input
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                        <input
                            type="password"
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="6"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '0.875rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {isLoading ? 'Resetting...' : (
                        <>Reset Password <ArrowRight size={18} /></>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
};

export default ResetPassword;
