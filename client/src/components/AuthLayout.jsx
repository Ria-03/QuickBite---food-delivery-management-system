import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = ({ title, subtitle, image, children, backLink = '/', backText = 'Back to Home' }) => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
            {/* Left Side - Image/Brand */}
            <div style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                background: '#0f172a',
                color: 'white',
                overflow: 'hidden'
            }} className="auth-image-side animate-fade-in">

                {/* Background Image */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.7,
                    transform: 'scale(1.05)',
                    transition: 'transform 10s ease'
                }}></div>

                {/* Overlay Content */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '4rem',
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 50%, transparent 100%)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end'
                }}>
                    <div className="animate-slide-up">
                        <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                            QuickBite
                        </h1>
                        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '80%', lineHeight: 1.6, fontWeight: 300 }}>
                            {subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                flex: '0 0 500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '3rem',
                background: 'var(--bg-main)',
                position: 'relative'
            }} className="auth-form-side">

                <Link to={backLink} style={{
                    position: 'absolute',
                    top: '2rem',
                    left: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--gray)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                }}>
                    <ArrowLeft size={16} /> {backText}
                </Link>

                <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }} className="animate-slide-up delay-100">
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dark)', letterSpacing: '-0.01em' }}>
                        {title}
                    </h2>
                    <p style={{ color: 'var(--gray)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
                        Please enter your details to sign in.
                    </p>

                    {children}
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .auth-image-side {
                        display: none !important;
                    }
                    .auth-form-side {
                        flex: 1 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AuthLayout;
