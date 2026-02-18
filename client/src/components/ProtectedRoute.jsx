import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary)', borderRadius: '50%', border: '4px solid var(--gray-light)', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on actual role
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'restaurant') return <Navigate to="/restaurant/dashboard" replace />;
        if (user.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />;
        if (user.role === 'customer') return <Navigate to="/customer/home" replace />;

        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
