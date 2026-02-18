import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomerLayout from '../components/CustomerLayout';
import AddressCard from '../components/AddressCard';
import AddressForm from '../components/AddressForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AddressManager = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchAddresses();
    }, [user, navigate]);

    const fetchAddresses = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/addresses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(data.addresses);
        } catch (error) {
            console.error('Error fetching addresses:', error);
            showToast('Failed to load addresses', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingAddress(null);
        setShowForm(true);
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setShowForm(true);
    };

    const handleSave = async (formData) => {
        try {
            const token = localStorage.getItem('token');

            if (editingAddress) {
                // Update existing address
                await axios.put(
                    `http://localhost:5000/api/addresses/${editingAddress._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showToast('Address updated successfully', 'success');
            } else {
                // Create new address
                await axios.post(
                    'http://localhost:5000/api/addresses',
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showToast('Address added successfully', 'success');
            }

            setShowForm(false);
            setEditingAddress(null);
            fetchAddresses();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save address', 'error');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingAddress(null);
    };

    return (
        <CustomerLayout>
            <div style={{ padding: '2rem' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            📍 My Addresses
                        </h1>
                        <p style={{ color: 'var(--gray)', fontSize: '1rem' }}>
                            Manage your delivery addresses
                        </p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                    >
                        ➕ Add New Address
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '1.2rem', color: 'var(--gray)' }}>Loading addresses...</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && addresses.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px dashed var(--gray-light)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📍</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            No Addresses Yet
                        </h3>
                        <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>
                            Add your first delivery address to get started
                        </p>
                        <button
                            onClick={handleAddNew}
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 2rem' }}
                        >
                            ➕ Add Address
                        </button>
                    </div>
                )}

                {/* Address Grid */}
                {!isLoading && addresses.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {addresses.map(address => (
                            <AddressCard
                                key={address._id}
                                address={address}
                                onEdit={handleEdit}
                                onDelete={fetchAddresses}
                                onSetDefault={fetchAddresses}
                            />
                        ))}
                    </div>
                )}

                {/* Address Form Modal */}
                {showForm && (
                    <AddressForm
                        address={editingAddress}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                )}
            </div>
        </CustomerLayout>
    );
};

export default AddressManager;
