import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await axios.post('http://localhost:5000/api/auth/forgotpassword', { email });
            setIsSent(true);
            showToast('Reset link sent to your email', 'success');
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to send email', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <AuthLayout
                title="Check Your Email"
                subtitle="We have sent a password reset link to your email address."
                image="https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80"
                backLink="/login"
                backText="Back to Login"
            >
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem', color: '#10b981'
                    }}>
                        <CheckCircle size={40} />
                    </div>
                    <h3 style={{ marginBottom: '1rem' }}>Email Sent!</h3>
                    <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>
                        Please check your inbox and follow the instructions to reset your password.
                    </p>
                    <button
                        onClick={() => setIsSent(false)}
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                    >
                        Resend Email
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot Password?"
            subtitle="Don't worry! It happens. Please enter the email associated with your account."
            image="https://images.unsplash.com/photo-1584905066893-7d5c142dd95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80"
            backLink="/login"
            backText="Back to Login"
        >
            <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                        <input
                            type="email"
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        padding: '0.875rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {isLoading ? 'Sending...' : (
                        <>Send Reset Link <ArrowRight size={18} /></>
                    )}
                </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                    Remember your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Log in</Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
