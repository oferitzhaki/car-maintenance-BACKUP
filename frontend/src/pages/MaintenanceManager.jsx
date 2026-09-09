import React, { useState, useEffect, useMemo } from 'react';
import EmailNotifications from '../components/EmailNotifications';
import NotificationsCenter from '../components/NotificationsCenter';
import RemindersList from '../components/RemindersList';
import '../styles/MaintenanceManager.css';

const API_BASE = 'http://localhost:3088/api';

const CATEGORIES = [
    { value: 'oil_change', label: '🛢️ החלפת שמן' },
    { value: 'tires', label: '🛞 גלגלים' },
    { value: 'brakes', label: '🛑 בלמים' },
    { value: 'battery', label: '🔋 סוללה' },
    { value: 'filters', label: '🌊 מסננים' },
    { value: 'inspection', label: '🔍 בדיקה' },
    { value: 'wash', label: '🧼 ניקיון' },
    { value: 'repair', label: '🔧 תיקון' },
    { value: 'other', label: '📝 אחר' },
];

export default function MaintenanceManager({ vehicle, onBack }) {
    const [maintenance, setMaintenance] = useState(vehicle.maintenance || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [insuranceExpiry, setInsuranceExpiry] = useState(
        vehicle.insurance_expiry || ''
    );
    const [editingInsurance, setEditingInsurance] = useState(false);

    // Get user email from localStorage
    const userEmail = localStorage.getItem('userEmail');

    const [formData, setFormData] = useState({
        category: 'oil_change',
        description: '',
        cost: '',
        mileage: vehicle.current_mileage || '',
        service_date: new Date().toISOString().split('T')[0],
        workshop_name: '',
        notes: '',
        image_data: null,
    });

    // Calculate alerts for email notifications
    const alerts = useMemo(() => {
        const notifications = [];
        const today = new Date();

        // בדוק ביטוח
        if (vehicle.insurance_expiry) {
            const expiryDate = new Date(vehicle.insurance_expiry);
            const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysLeft <= 0) {
                notifications.push({
                    priority: 3,
                    type: 'urgent',
                    emoji: '🛡️',
                    title: 'חידוש ביטוח',
                    message: '⚠️ הביטוח פג תוקף!',
                    daysLeft: 0,
                });
            } else if (daysLeft <= 7) {
                notifications.push({
                    priority: 2,
                    type: 'critical',
                    emoji: '🛡️',
                    title: 'חידוש ביטוח',
                    message: `בעוד ${daysLeft} ימים`,
                    daysLeft,
                });
            } else if (daysLeft <= 30) {
                notifications.push({
                    priority: 1,
                    type: 'warning',
                    emoji: '🛡️',
                    title: 'חידוש ביטוח',
                    message: `בעוד ${daysLeft} ימים`,
                    daysLeft,
                });
            }
        }

        return notifications;
    }, [vehicle]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('❌ גודל התמונה גדול מדי (מקסימום 5MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            setFormData({ ...formData, image_data: imageData });
            setPreviewImage(imageData);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setFormData({ ...formData, image_data: null });
        setPreviewImage(null);
    };

    const startEdit = (item) => {
        setFormData({
            category: item.category,
            description: item.description,
            cost: item.cost || '',
            mileage: item.mileage,
            service_date: item.service_date,
            workshop_name: item.workshop_name || '',
            notes: item.notes || '',
            image_data: item.image_data || null,
        });
        setPreviewImage(item.image_data || null);
        setEditingId(item.id);
        setShowAddForm(true);
    };

    const resetForm = () => {
        setFormData({
            category: 'oil_change',
            description: '',
            cost: '',
            mileage: vehicle.current_mileage || '',
            service_date: new Date().toISOString().split('T')[0],
            workshop_name: '',
            notes: '',
            image_data: null,
        });
        setPreviewImage(null);
        setEditingId(null);
    };

    const handleAddMaintenance = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.service_date) {
            setError('❌ אנא בחר תאריך');
            return;
        }

        setLoading(true);
        try {
            const vehicleResponse = await fetch(`${API_BASE}/vehicles/${vehicle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    vin: vehicle.vin,
                    current_mileage: parseInt(formData.mileage) || vehicle.current_mileage,
                }),
            });

            if (!vehicleResponse.ok) throw new Error('Failed to update vehicle');

            if (editingId) {
                const updateResponse = await fetch(`${API_BASE}/maintenance/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        category: formData.category,
                        description: formData.description,
                        cost: formData.cost ? parseFloat(formData.cost) : null,
                        mileage: parseInt(formData.mileage),
                        service_date: formData.service_date,
                        workshop_name: formData.workshop_name,
                        notes: formData.notes,
                    }),
                });

                if (!updateResponse.ok) throw new Error('Failed to update maintenance');

                setMaintenance(maintenance.map(m =>
                    m.id === editingId
                        ? {
                            ...m,
                            category: formData.category,
                            description: formData.description,
                            cost: formData.cost ? parseFloat(formData.cost) : null,
                            mileage: parseInt(formData.mileage),
                            service_date: formData.service_date,
                            workshop_name: formData.workshop_name,
                            notes: formData.notes,
                            image_data: formData.image_data,
                        }
                        : m
                ));
                setEditingId(null);
            } else {
                const addResponse = await fetch(`${API_BASE}/maintenance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vehicle_id: vehicle.id,
                        category: formData.category,
                        description: formData.description,
                        cost: formData.cost ? parseFloat(formData.cost) : null,
                        mileage: parseInt(formData.mileage),
                        service_date: formData.service_date,
                        workshop_name: formData.workshop_name,
                        notes: formData.notes,
                    }),
                });

                if (!addResponse.ok) throw new Error('Failed to add maintenance');

                const newMaintenanceItem = await addResponse.json();
                setMaintenance([{ ...newMaintenanceItem, image_data: formData.image_data }, ...maintenance]);
            }

            resetForm();
            setShowAddForm(false);
        } catch (err) {
            setError(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMaintenance = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את הטיפול?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/maintenance/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete maintenance');

            setMaintenance(maintenance.filter(m => m.id !== id));
        } catch (err) {
            setError(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInsurance = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/vehicles/${vehicle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    vin: vehicle.vin,
                    current_mileage: vehicle.current_mileage,
                    insurance_expiry: insuranceExpiry,
                }),
            });

            if (!response.ok) throw new Error('Failed to save insurance');

            setEditingInsurance(false);
        } catch (err) {
            setError(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryLabel = (value) => {
        return CATEGORIES.find(c => c.value === value)?.label || value;
    };

    return (
        <div className="maintenance-manager">
            {/* Email Notifications - Send alerts if user has email set */}
            {userEmail && <EmailNotifications vehicle={vehicle} alerts={alerts} userEmail={userEmail} />}

            <div className="maintenance-header">
                <button onClick={onBack} className="btn-back">← חזור</button>
                <h1>🚗 {vehicle.make} {vehicle.model}</h1>
                <div className="current-mileage">
                    {vehicle.current_mileage?.toLocaleString('he-IL')} ק"מ
                </div>
            </div>

            <div className="maintenance-content">
                {error && <div className="error-message">{error}</div>}

                {/* Notifications */}
                <NotificationsCenter vehicle={vehicle} maintenance={maintenance} />

                {!showAddForm ? (
                    <button onClick={() => setShowAddForm(true)} className="btn-add-maintenance">
                        ➕ הוסף טיפול חדש
                    </button>
                ) : (
                    <form onSubmit={handleAddMaintenance} className="add-maintenance-form">
                        <h2>{editingId ? '✏️ עדכן טיפול' : 'הוסף טיפול חדש'}</h2>

                        <div className="form-group">
                            <label>קטגוריה *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>תיאור</label>
                            <input
                                type="text"
                                placeholder="לדוגמה: החלפה מלאה + סינון"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>תאריך *</label>
                                <input
                                    type="date"
                                    value={formData.service_date}
                                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>קילומטראז'</label>
                                <input
                                    type="number"
                                    value={formData.mileage}
                                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>שם מוסך</label>
                                <input
                                    type="text"
                                    placeholder="לדוגמה: מוסך דלק, סרוג"
                                    value={formData.workshop_name}
                                    onChange={(e) => setFormData({ ...formData, workshop_name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>עלות</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="₪"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>הערות</label>
                            <input
                                type="text"
                                placeholder="הערות נוספות"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>📸 תמונה או קבלה (אופציונלי)</label>
                            <div className="image-upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageSelect}
                                    className="file-input"
                                    id="image-input"
                                />
                                <label htmlFor="image-input" className="file-label">
                                    📸 בחר תמונה או צלם
                                </label>
                            </div>

                            {previewImage && (
                                <div className="image-preview">
                                    <img src={previewImage} alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="btn-remove-image"
                                    >
                                        🗑️ הסר תמונה
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="btn-submit">
                                {loading ? '⏳ שמירה...' : editingId ? '✏️ עדכן' : '💾 הוסף'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    resetForm();
                                }}
                                className="btn-cancel"
                            >
                                ביטול
                            </button>
                        </div>
                    </form>
                )}

                {maintenance.length > 0 ? (
                    <div className="maintenance-list">
                        <h2>📋 היסטוריית טיפולים ({maintenance.length})</h2>
                        <div className="table-wrapper">
                            <table className="maintenance-table">
                                <thead>
                                    <tr>
                                        <th>תאריך</th>
                                        <th>קטגוריה</th>
                                        <th>תיאור</th>
                                        <th>מוסך</th>
                                        <th>קילומטראז'</th>
                                        <th>עלות</th>
                                        <th>קבלה</th>
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {maintenance.map((m) => (
                                        <tr key={m.id}>
                                            <td>{new Date(m.service_date).toLocaleDateString('he-IL')}</td>
                                            <td>{getCategoryLabel(m.category)}</td>
                                            <td>{m.description || '-'}</td>
                                            <td className="workshop-cell">{m.workshop_name || '-'}</td>
                                            <td>{m.mileage?.toLocaleString('he-IL') || '-'}</td>
                                            <td>{m.cost ? `₪${m.cost.toFixed(2)}` : '-'}</td>
                                            <td className="image-cell">
                                                {m.image_data ? (
                                                    <a
                                                        href={m.image_data}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="image-link"
                                                        title="הצג קבלה"
                                                    >
                                                        📸
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    onClick={() => startEdit(m)}
                                                    className="btn-edit"
                                                    title="עדכן"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMaintenance(m.id)}
                                                    className="btn-delete"
                                                    title="מחק"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="no-maintenance">
                        <p>📭 אין טיפולים עדיין</p>
                        <p className="hint">הוסף את הטיפול הראשון שלך!</p>
                    </div>
                )}

                {/* ביטוח */}
                <div className="insurance-section">
                    <h2>🛡️ ביטוח</h2>
                    {!editingInsurance ? (
                        <div className="insurance-display">
                            {insuranceExpiry ? (
                                <>
                                    <p>
                                        <strong>תאריך חידוש:</strong> {new Date(insuranceExpiry).toLocaleDateString('he-IL')}
                                    </p>
                                    <button
                                        onClick={() => setEditingInsurance(true)}
                                        className="btn-edit-insurance"
                                    >
                                        ✏️ עדכן תאריך
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="no-insurance">📭 לא הוגדר תאריך ביטוח</p>
                                    <button
                                        onClick={() => setEditingInsurance(true)}
                                        className="btn-add-insurance"
                                    >
                                        ➕ הוסף תאריך ביטוח
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSaveInsurance}
                            className="insurance-form"
                        >
                            <div className="form-group">
                                <label>תאריך חידוש ביטוח</label>
                                <input
                                    type="date"
                                    value={insuranceExpiry}
                                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" disabled={loading} className="btn-submit">
                                    {loading ? '⏳ שמירה...' : '💾 שמור'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingInsurance(false)}
                                    className="btn-cancel"
                                >
                                    ביטול
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}