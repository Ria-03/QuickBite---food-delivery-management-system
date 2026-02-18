import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const AddressForm = ({ address, onSave, onCancel }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        label: 'Home',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: '',
        phoneNumber: '',
        isDefault: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (address) {
            setFormData({
                label: address.label || 'Home',
                addressLine1: address.addressLine1 || '',
                addressLine2: address.addressLine2 || '',
                city: address.city || '',
                state: address.state || '',
                zipCode: address.zipCode || '',
                landmark: address.landmark || '',
                phoneNumber: address.phoneNumber || '',
                isDefault: address.isDefault || false
            });
        }
    }, [address]);

    const indianStates = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        if (!formData.addressLine1.trim()) {
            showToast('Address Line 1 is required', 'error');
            return false;
        }
        if (!formData.city.trim()) {
            showToast('City is required', 'error');
            return false;
        }
        if (!formData.state) {
            showToast('State is required', 'error');
            return false;
        }
        if (!/^\d{6}$/.test(formData.zipCode)) {
            showToast('Please enter a valid 6-digit zip code', 'error');
            return false;
        }
        if (!/^\d{10}$/.test(formData.phoneNumber)) {
            showToast('Please enter a valid 10-digit phone number', 'error');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        await onSave(formData);
        setIsSubmitting(false);
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
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '2rem'
            }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
                    {address ? '✏️ Edit Address' : '➕ Add New Address'}
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Label Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                            Address Type *
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['Home', 'Work', 'Other'].map(type => (
                                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="label"
                                        value={type}
                                        checked={formData.label === type}
                                        onChange={handleChange}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>{type === 'Home' ? '🏠' : type === 'Work' ? '🏢' : '📍'} {type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Address Line 1 */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                            Address Line 1 *
                        </label>
                        <input
                            type="text"
                            name="addressLine1"
                            value={formData.addressLine1}
                            onChange={handleChange}
                            placeholder="House/Flat No., Building Name"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--gray-light)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Address Line 2 */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                            Address Line 2
                        </label>
                        <input
                            type="text"
                            name="addressLine2"
                            value={formData.addressLine2}
                            onChange={handleChange}
                            placeholder="Street, Area, Colony (Optional)"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--gray-light)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* City & State */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                City *
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Mumbai"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--gray-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                State *
                            </label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--gray-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Select State</option>
                                {indianStates.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Zip Code & Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Zip Code *
                            </label>
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                placeholder="400001"
                                maxLength="6"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--gray-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="9876543210"
                                maxLength="10"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--gray-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Landmark */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                            Landmark
                        </label>
                        <input
                            type="text"
                            name="landmark"
                            value={formData.landmark}
                            onChange={handleChange}
                            placeholder="Near XYZ Mall (Optional)"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--gray-light)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Set as Default */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                name="isDefault"
                                checked={formData.isDefault}
                                onChange={handleChange}
                                style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 600 }}>Set as default address</span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary"
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                opacity: isSubmitting ? 0.7 : 1,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSubmitting ? '⏳ Saving...' : address ? '✓ Update Address' : '✓ Save Address'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'var(--gray-light)',
                                color: 'var(--gray-dark)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressForm;
