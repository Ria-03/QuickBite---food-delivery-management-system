import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const AddressContext = createContext();

export const useAddress = () => useContext(AddressContext);

export const AddressProvider = ({ children }) => {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchAddresses();
        } else {
            setAddresses([]);
            setSelectedAddress(null);
        }
    }, [user]);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/addresses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(data.addresses);

            // Set default address or first address as selected if none selected
            if (!selectedAddress && data.addresses.length > 0) {
                const defaultAddr = data.addresses.find(addr => addr.isDefault) || data.addresses[0];
                setSelectedAddress(defaultAddr);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectAddress = (address) => {
        setSelectedAddress(address);
    };

    // Helper to refresh addresses (e.g., after adding/editing)
    const refreshAddresses = () => {
        fetchAddresses();
    };

    return (
        <AddressContext.Provider value={{
            addresses,
            selectedAddress,
            loading,
            selectAddress,
            refreshAddresses
        }}>
            {children}
        </AddressContext.Provider>
    );
};
