import { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type}`}
                        onClick={() => removeToast(toast.id)}
                    >
                        <div className="toast-content">
                            <span className="toast-icon">
                                {toast.type === 'success' && '✅'}
                                {toast.type === 'error' && '❌'}
                                {toast.type === 'info' && 'ℹ️'}
                            </span>
                            <span className="toast-message">{toast.message}</span>
                        </div>
                        <div className="toast-progress"></div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
