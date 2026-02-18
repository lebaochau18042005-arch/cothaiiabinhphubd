import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapViewer: React.FC = () => {
    return (
        <div className="h-full w-full rounded-lg overflow-hidden border border-gray-300 shadow-md">
            <MapContainer center={[16.047079, 108.206230]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[21.028511, 105.804817]}>
                    <Popup>
                        Hà Nội <br /> Thủ đô Việt Nam.
                    </Popup>
                </Marker>
                <Marker position={[10.823099, 106.629664]}>
                    <Popup>
                        TP. Hồ Chí Minh <br /> Trung tâm kinh tế lớn nhất.
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapViewer;
