import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Mail, Lock, LogIn, KeyRound, Smartphone } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    const [step, setStep] = useState(1); // 1: Email, 2: OTP (only for OTP method)

    const [formData, setFormData] = useState({ email: '', password: '', otp: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/otp/send', { email: formData.email });
            setStep(2);
            // Optionally set success message or toast here
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/otp/verify', {
                email: formData.email,
                otp: formData.otp
            });

            if (res.data.token) {
                // Manually handle login success since useAuth might not have OTP method
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));

                // Force reload or update context (assuming app reloads on token change or we manually reload)
                // Better: update AuthContext to have a verifyOtpLogin method, but for now exact same storage logic works
                // We can't access setUser from here without exposing it in context, so we might need a full reload
                // OR: just navigate and let App.jsx init check the token. 
                // Let's try standard navigation logic:

                const role = res.data.user.role.toUpperCase();
                window.location.href = role === "ADMIN" ? "/admin/dashboard" :
                    role === "RESTAURANT" ? "/restaurant/dashboard" :
                        role === "DELIVERY" ? "/delivery/dashboard" :
                            "/customer/home";
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await login(formData.email, formData.password);
            if (res.success) {
                const role = res.user.role.toUpperCase();
                if (role === "ADMIN") navigate("/admin/dashboard");
                else if (role === "RESTAURANT") navigate("/restaurant/dashboard");
                else if (role === "DELIVERY") navigate("/delivery/dashboard");
                else navigate("/customer/home");
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 2 ? "Enter OTP" : "Welcome Back"}
            subtitle={step === 2 ? `We sent a code to ${formData.email}` : "Order your favorite meals from the best restaurants in town."}
            image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        >
            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

            {/* Toggle Login Method */}
            {step === 1 && (
                <div style={{ display: 'flex', background: '#f3f4f6', padding: '0.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <button
                        type="button"
                        onClick={() => setLoginMethod('password')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: '6px',
                            background: loginMethod === 'password' ? 'white' : 'transparent',
                            boxShadow: loginMethod === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: loginMethod === 'password' ? '600' : '500',
                            color: loginMethod === 'password' ? 'var(--primary)' : 'var(--gray)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Password
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginMethod('otp')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: '6px',
                            background: loginMethod === 'otp' ? 'white' : 'transparent',
                            boxShadow: loginMethod === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: loginMethod === 'otp' ? '600' : '500',
                            color: loginMethod === 'otp' ? 'var(--primary)' : 'var(--gray)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        OTP
                    </button>
                </div>
            )}

            <form onSubmit={
                loginMethod === 'otp'
                    ? (step === 1 ? handleSendOTP : handleVerifyOTP)
                    : handlePasswordLogin
            } className="animate-slide-up delay-200">

                {/* Email Input - Always visible in Step 1 */}
                {step === 1 && (
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Email Address</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <Mail size={20} className="input-icon" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', zIndex: 1 }} />
                            <input
                                type="email"
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Password Input - Only for Password Method */}
                {loginMethod === 'password' && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ marginBottom: 0.5 }}>Password</label>
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
                )}

                {/* OTP Input - Only for Step 2 */}
                {step === 2 && (
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">One-Time Password</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                            <KeyRound size={20} className="input-icon" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', zIndex: 1 }} />
                            <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: '3rem', letterSpacing: '0.25rem', fontWeight: 'bold' }}
                                placeholder="123456"
                                maxLength="6"
                                value={formData.otp}
                                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                required
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.5rem', cursor: 'pointer', padding: 0 }}
                        >
                            Change Email
                        </button>
                    </div>
                )}

                {/* Remember Me & Forgot Password - Only for Password Method */}
                {loginMethod === 'password' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--gray)', fontWeight: 500 }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input type="checkbox" style={{
                                    width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)',
                                    cursor: 'pointer', borderRadius: '4px'
                                }} />
                            </div>
                            Remember me
                        </label>
                        <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.5px', marginTop: loginMethod === 'otp' ? '2rem' : '0' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : (
                        loginMethod === 'password' ? (
                            <>Sign In <LogIn size={20} /></>
                        ) : (
                            step === 1 ? <>Send OTP <Smartphone size={20} /></> : <>Verify & Login <LogIn size={20} /></>
                        )
                    )}
                </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--gray)', fontSize: '0.95rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Sign up</Link>
                </p>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-light)', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                <Link to="/delivery/login" style={{ fontSize: '0.9rem', color: 'var(--gray)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '20px' }}>
                    🛵 Rider Login
                </Link>
                <Link to="/admin/login" style={{ fontSize: '0.9rem', color: 'var(--gray)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '20px' }}>
                    🛡️ Admin Login
                </Link>
            </div>
        </AuthLayout>
    );
};

export default Login;
