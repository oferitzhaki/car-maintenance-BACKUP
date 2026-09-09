import { useState } from 'react';
import VehicleSelect from './pages/VehicleSelect';
import MaintenanceManager from './pages/MaintenanceManager';
import Settings from './components/Settings';
import './App.css';

function App() {
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [currentPage, setCurrentPage] = useState('vehicles'); // 'vehicles', 'maintenance', 'settings'

    const handleVehicleSelected = (vehicle) => {
        setSelectedVehicle(vehicle);
        setCurrentPage('maintenance');
        console.log('✅ Selected vehicle:', vehicle);
    };

    const handleBackToVehicles = () => {
        setSelectedVehicle(null);
        setCurrentPage('vehicles');
    };

    const handleSettingsClick = () => {
        setCurrentPage('settings');
    };

    const handleBackFromSettings = () => {
        if (selectedVehicle) {
            setCurrentPage('maintenance');
        } else {
            setCurrentPage('vehicles');
        }
    };

    // Settings Page
    if (currentPage === 'settings') {
        return (
            <div style={{ position: 'relative' }}>
                <button
                    onClick={handleBackFromSettings}
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        padding: '10px 20px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        zIndex: 10,
                        fontWeight: '600',
                    }}
                >
                    ← חזור
                </button>
                <Settings />
            </div>
        );
    }

    // Maintenance Manager Page
    if (currentPage === 'maintenance' && selectedVehicle) {
        return (
            <div style={{ position: 'relative' }}>
                <button
                    onClick={handleSettingsClick}
                    style={{
                        position: 'fixed',
                        bottom: 20,
                        left: 20,
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        zIndex: 10,
                        fontWeight: '600',
                        fontSize: '1em',
                    }}
                >
                    ⚙️ הגדרות
                </button>
                <MaintenanceManager
                    vehicle={selectedVehicle}
                    onBack={handleBackToVehicles}
                />
            </div>
        );
    }

    // Vehicle Select Page
    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={handleSettingsClick}
                style={{
                    position: 'fixed',
                    bottom: 20,
                    left: 20,
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    zIndex: 10,
                    fontWeight: '600',
                    fontSize: '1em',
                }}
            >
                ⚙️ הגדרות
            </button>
            <VehicleSelect onVehicleSelected={handleVehicleSelected} />
        </div>
    );
}

export default App;