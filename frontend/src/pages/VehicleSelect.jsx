import React, { useState, useEffect } from 'react';
import '../styles/VehicleSelect.css';

const API_BASE = 'http://localhost:3088/api';

export default function VehicleSelect({ onVehicleSelected }) {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const [formData, setFormData] = useState({
        license_plate: '',
        make: '',
        model: '',
        year: '',
        vin: '',
        current_mileage: 0,
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/vehicles`);
            if (!response.ok) throw new Error('Failed to fetch vehicles');
            const data = await response.json();
            setVehicles(data);
        } catch (err) {
            setError(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.license_plate || !formData.make || !formData.model) {
            setError('❌ אנא מלא את השדות הנדרשים (רישום, מותג, דגם)');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    license_plate: formData.license_plate,
                    make: formData.make,
                    model: formData.model,
                    year: formData.year ? parseInt(formData.year) : null,
                    vin: formData.vin || null,
                    current_mileage: parseInt(formData.current_mileage) || 0,
                }),
            });

            if (!response.ok) throw new Error('Failed to add vehicle');

            const newVehicle = await response.json();
            setVehicles([newVehicle, ...vehicles]);
            onVehicleSelected(newVehicle);

            // Reset form
            setFormData({
                license_plate: '',
                make: '',
                model: '',
                year: '',
                vin: '',
                current_mileage: 0,
            });
            setShowAddForm(false);
        } catch (err) {
            setError(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getLastService = (maintenance) => {
        if (!maintenance || maintenance.length === 0) return null;
        return maintenance[0];
    };

    const handleSelectVehicle = (vehicle) => {
        console.log('✅ Vehicle selected:', vehicle);
        onVehicleSelected(vehicle);
    };

    return (
        <div className="vehicle-select">
            <div className="header">
                <h1>🚗 ניהול רכבים</h1>
                <div className="subtitle">בחר או הוסף רכב</div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* הוספת רכב חדש */}
            {!showAddForm ? (
                <button onClick={() => setShowAddForm(true)} className="btn-add-new">
                    ➕ הוסף רכב חדש
                </button>
            ) : (
                <form onSubmit={handleAddVehicle} className="add-vehicle-form">
                    <h2>הוסף רכב חדש</h2>

                    <div className="form-group">
                        <label>מספר רישום *</label>
                        <input
                            type="text"
                            value={formData.license_plate}
                            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                            placeholder="לדוגמה: 32544904"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>מותג *</label>
                            <input
                                type="text"
                                value={formData.make}
                                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                placeholder="Toyota, Honda, וכו'"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>דגם *</label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                placeholder="Corolla, Civic, וכו'"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>שנה</label>
                            <input
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                placeholder="2015"
                                min="1990"
                                max={new Date().getFullYear()}
                            />
                        </div>
                        <div className="form-group">
                            <label>VIN</label>
                            <input
                                type="text"
                                value={formData.vin}
                                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                                placeholder="מספר זיהוי הרכב (אופציונלי)"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>קילומטראז' נוכחי</label>
                        <input
                            type="number"
                            value={formData.current_mileage}
                            onChange={(e) => setFormData({ ...formData, current_mileage: e.target.value })}
                            placeholder="0"
                            min="0"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading} className="btn-submit">
                            {loading ? '⏳ הוספה...' : '💾 הוסף רכב'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddForm(false);
                                setFormData({
                                    license_plate: '',
                                    make: '',
                                    model: '',
                                    year: '',
                                    vin: '',
                                    current_mileage: 0,
                                });
                            }}
                            className="btn-cancel"
                        >
                            ביטול
                        </button>
                    </div>
                </form>
            )}

            {/* רשימת רכבים */}
            {vehicles.length > 0 ? (
                <div className="vehicles-list">
                    <h2>הרכביים שלך ({vehicles.length})</h2>
                    <div className="vehicles-grid">
                        {vehicles.map((vehicle) => {
                            const lastService = getLastService(vehicle.maintenance);
                            return (
                                <div
                                    key={vehicle.id}
                                    className="vehicle-card"
                                    onClick={() => handleSelectVehicle(vehicle)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleSelectVehicle(vehicle);
                                    }}
                                >
                                    <div className="vehicle-header">
                                        <div className="license-plate">{vehicle.license_plate}</div>
                                        <div className="vehicle-year">{vehicle.year}</div>
                                    </div>

                                    <div className="vehicle-info">
                                        <h3>{vehicle.make} {vehicle.model}</h3>
                                        <p className="mileage">📍 {vehicle.current_mileage?.toLocaleString('he-IL')} ק"מ</p>
                                    </div>

                                    {lastService && (
                                        <div className="last-service">
                                            <div className="service-label">טיפול אחרון:</div>
                                            <div className="service-date">
                                                {new Date(lastService.service_date).toLocaleDateString('he-IL')}
                                            </div>
                                            {lastService.workshop_name && (
                                                <div className="workshop-name">
                                                    מוסך: {lastService.workshop_name}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button className="btn-select" onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectVehicle(vehicle);
                                    }}>
                                        בחר רכב →
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                !showAddForm && (
                    <div className="no-vehicles">
                        <p>📭 אין רכבים עדיין</p>
                        <p className="hint">הוסף רכב חדש כדי להתחיל</p>
                    </div>
                )
            )}
        </div>
    );
}