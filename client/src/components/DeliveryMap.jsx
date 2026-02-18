import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DeliveryLayout from '../components/DeliveryLayout';
import LeafletRoutingMachine from './LeafletRoutingMachine';

// Fix for default marker icon in React-Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const DeliveryMap = ({ pickupLocation, dropLocation }) => {
    // Mock data for now - center on "Mumbai" as example base
    const position = [19.0760, 72.8777];

    // Mock active orders with locations (If no props provided)
    const orders = [
        { id: 1, lat: 19.0760, lng: 72.8777, type: 'pickup', name: 'Spicy Treats' },
        { id: 2, lat: 19.0800, lng: 72.8800, type: 'drop', name: 'Customer A' }
    ];

    return (
        <DeliveryLayout>
            <div style={{ height: 'calc(100vh - 100px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--gray-light)', margin: '1rem 0' }}>
                <MapContainer center={pickupLocation || position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {pickupLocation && dropLocation ? (
                        <LeafletRoutingMachine pickup={pickupLocation} drop={dropLocation} />
                    ) : (
                        orders.map(order => (
                            <Marker key={order.id} position={[order.lat, order.lng]}>
                                <Popup>
                                    <strong>{order.type.toUpperCase()}</strong>: {order.name}
                                </Popup>
                            </Marker>
                        ))
                    )}
                </MapContainer>
            </div>
            <div className="card" style={{ padding: '1rem', marginTop: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Live Zone</h3>
                <p style={{ color: 'var(--gray)' }}>High demand detected in Bandra West.</p>
            </div>
        </DeliveryLayout>
    );
};

export default DeliveryMap;
