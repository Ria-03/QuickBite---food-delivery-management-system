import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine/dist/leaflet-routing-machine.js";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useMap } from "react-leaflet";

const LeafletRoutingMachine = ({ pickup, drop }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !pickup || !drop) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(pickup[0], pickup[1]),
                L.latLng(drop[0], drop[1])
            ],
            routeWhileDragging: false,
            geocoder: L.Control.Geocoder?.nominatim(),
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            lineOptions: {
                styles: [{ color: "#6FA1EC", weight: 4 }]
            },
            createMarker: function (i, waypoint, n) {
                const markerIcon = L.icon({
                    iconUrl: i === 0
                        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' // Pickup
                        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', // Drop
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
                return L.marker(waypoint.latLng, { icon: markerIcon });
            }
        }).addTo(map);

        return () => map.removeControl(routingControl);
    }, [map, pickup, drop]);

    return null;
};

export default LeafletRoutingMachine;
