import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const ScheduleOrderModal = ({ onSchedule, onClose, minAmount }) => {
    const { showToast } = useToast();
    const [orderType, setOrderType] = useState('now'); // 'now' or 'schedule'
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);

    useEffect(() => {
        // Generate time slots (15-min intervals)
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let min = 0; min < 60; min += 15) {
                const h = hour.toString().padStart(2, '0');
                const m = min.toString().padStart(2, '0');
                times.push(`${h}:${m}`);
            }
        }
        setAvailableTimes(times);

        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);

        // Set default time to 12:00 PM
        setSelectedTime('12:00');
    }, []);

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        return maxDate.toISOString().split('T')[0];
    };

    const handleConfirm = () => {
        if (orderType === 'now') {
            onSchedule(null); // Order now
        } else {
            // Validate scheduled time
            const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
            const now = new Date();
            const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

            if (scheduledDateTime < minTime) {
                showToast('Scheduled time must be at least 2 hours from now', 'error');
                return;
            }

            onSchedule(scheduledDateTime);
        }
    };

    const formatScheduledTime = () => {
        if (!selectedDate || !selectedTime) return '';
        const date = new Date(`${selectedDate}T${selectedTime}`);
        return date.toLocaleString('en-IN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '500px',
                width: '100%',
                padding: '2rem'
            }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
                    🕐 Schedule Your Order
                </h2>

                {/* Order Type Selection */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: orderType === 'now' ? '#ecfdf5' : 'white',
                        border: `2px solid ${orderType === 'now' ? 'var(--success)' : 'var(--gray-light)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        marginBottom: '0.75rem',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="radio"
                            name="orderType"
                            value="now"
                            checked={orderType === 'now'}
                            onChange={(e) => setOrderType(e.target.value)}
                            style={{ cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, marginBottom: '4px' }}>🚀 Order Now</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Delivery in 30-45 minutes</div>
                        </div>
                    </label>

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: orderType === 'schedule' ? '#ecfdf5' : 'white',
                        border: `2px solid ${orderType === 'schedule' ? 'var(--success)' : 'var(--gray-light)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="radio"
                            name="orderType"
                            value="schedule"
                            checked={orderType === 'schedule'}
                            onChange={(e) => setOrderType(e.target.value)}
                            style={{ cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, marginBottom: '4px' }}>📅 Schedule for Later</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Choose date and time</div>
                        </div>
                    </label>
                </div>

                {/* Date & Time Selection */}
                {orderType === 'schedule' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                📅 Select Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={getMinDate()}
                                max={getMaxDate()}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--gray-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                🕐 Select Time
                            </label>
                            <select
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--gray-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '1rem'
                                }}
                            >
                                {availableTimes.map(time => (
                                    <option key={time} value={time}>
                                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Preview */}
                        <div style={{
                            padding: '1rem',
                            background: 'var(--bg-main)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--gray-light)'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '4px' }}>
                                Scheduled Delivery:
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                {formatScheduledTime()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleConfirm}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.75rem' }}
                    >
                        {orderType === 'now' ? '✓ Confirm Order' : '✓ Schedule Order'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'var(--gray-light)',
                            color: 'var(--gray-dark)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleOrderModal;
