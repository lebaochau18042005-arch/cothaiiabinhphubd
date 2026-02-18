import React from 'react';
import MapViewer from '../components/MapViewer';

const MapTool: React.FC = () => {
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">Bản đồ Địa Lý</h2>
                <p className="text-gray-500 mt-1">Khám phá bản đồ Việt Nam và thế giới phục vụ giảng dạy.</p>
            </div>
            <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100" style={{ minHeight: '500px' }}>
                <MapViewer />
            </div>
        </div>
    );
};

export default MapTool;
