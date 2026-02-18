import React, { useState, useEffect } from 'react';
import DeliveryLayout from '../components/DeliveryLayout';
import { useAuth } from '../context/AuthContext';
import { User, Truck, Shield, ChevronRight, LogOut, Moon, Sun } from 'lucide-react';

const DeliveryProfile = () => {
    const { user, logout, loading } = useAuth();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (newTheme) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    if (loading) return <div>Loading...</div>;

    const items = [
        { icon: Truck, label: 'Vehicle Details', value: 'Honda Activa (MH-02-AB-1234)' },
        { icon: Shield, label: 'Insurance & License', value: 'Verified' },
        { icon: User, label: 'Personal Information', value: user?.name || 'Rider' }
    ];

    return (
        <DeliveryLayout>
            <div className="fade-up">
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--secondary)' }}>My Profile</h1>
                </header>

                <div className="card glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 800 }}>
                        {user?.name?.charAt(0) || 'R'}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{user?.name}</h2>
                        <p style={{ color: 'var(--gray)', margin: 0 }}>{user?.email}</p>
                        <span className="badge badge-success" style={{ marginTop: '0.5rem', display: 'inline-block' }}>Verified Partner</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {items.map((item, idx) => (
                        <div key={idx} className="card hover-glow" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '10px', background: 'var(--gray-light)', borderRadius: '10px' }}>
                                    <item.icon size={20} color="var(--secondary)" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--secondary)' }}>{item.label}</p>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray)' }}>{item.value}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} color="var(--gray)" />
                        </div>
                    ))}

                    <button
                        onClick={logout}
                        className="card hover-glow"
                        style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700, marginTop: '1rem', border: '1px solid currentColor' }}
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </div>
        </DeliveryLayout>
    );
};

export default DeliveryProfile;
