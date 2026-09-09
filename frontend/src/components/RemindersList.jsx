import React from 'react';
import '../styles/RemindersList.css';

const MAINTENANCE_INTERVALS = {
    oil_change: { km: 10000, months: 6, label: '🛢️ החלפת שמן' },
    filters: { km: 15000, months: 12, label: '🌊 מסננים' },
    tires: { km: 40000, months: 24, label: '🛞 גלגלים' },
    brakes: { km: 50000, months: 24, label: '🛑 בלמים' },
    battery: { km: null, months: 36, label: '🔋 סוללה' },
    inspection: { km: 20000, months: 12, label: '🔍 בדיקה' },
};

export default function RemindersList({ vehicle, maintenance }) {
    const calculateReminders = () => {
        const reminders = [];
        const now = new Date();

        // בדיקת ביטוח
        if (vehicle.insurance_expiry) {
            const insuranceDate = new Date(vehicle.insurance_expiry);
            const daysUntilExpiry = Math.floor((insuranceDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
                reminders.push({
                    type: 'insurance',
                    category: 'insurance',
                    label: '🛡️ חידוש ביטוח',
                    value: daysUntilExpiry,
                    unit: 'ימים',
                    severity: daysUntilExpiry <= 30 ? 'urgent' : 'soon',
                    date: insuranceDate.toLocaleDateString('he-IL'),
                });
            } else if (daysUntilExpiry <= 0) {
                reminders.push({
                    type: 'insurance',
                    category: 'insurance',
                    label: '🛡️ ביטוח פג תוקף',
                    value: Math.abs(daysUntilExpiry),
                    unit: 'ימים',
                    severity: 'urgent',
                    date: insuranceDate.toLocaleDateString('he-IL'),
                    expired: true,
                });
            }
        }

        // בדיקת טיפולים
        maintenance.forEach((service) => {
            const interval = MAINTENANCE_INTERVALS[service.category];
            if (!interval) return;

            // בדיקה לפי קילומטראז'
            if (interval.km) {
                const nextKm = service.mileage + interval.km;
                const kmRemaining = nextKm - vehicle.current_mileage;

                if (kmRemaining > 0 && kmRemaining <= interval.km * 0.2) {
                    reminders.push({
                        type: 'km',
                        category: service.category,
                        label: interval.label,
                        value: kmRemaining,
                        unit: 'ק"מ',
                        severity: kmRemaining <= interval.km * 0.1 ? 'urgent' : 'soon',
                    });
                }
            }

            // בדיקה לפי תאריך
            if (interval.months) {
                const lastService = new Date(service.service_date);
                const nextService = new Date(lastService.getFullYear(), lastService.getMonth() + interval.months, lastService.getDate());
                const daysRemaining = Math.floor((nextService - now) / (1000 * 60 * 60 * 24));

                if (daysRemaining > 0 && daysRemaining <= interval.months * 30 * 0.2) {
                    reminders.push({
                        type: 'date',
                        category: service.category,
                        label: interval.label,
                        value: daysRemaining,
                        unit: 'ימים',
                        severity: daysRemaining <= interval.months * 30 * 0.1 ? 'urgent' : 'soon',
                    });
                }
            }
        });

        // מיון לפי זדיחות
        return reminders.sort((a, b) => {
            if (a.severity !== b.severity) {
                return a.severity === 'urgent' ? -1 : 1;
            }
            return a.value - b.value;
        });
    };

    const reminders = calculateReminders();

    if (reminders.length === 0) {
        return (
            <div className="reminders-container">
                <div className="no-reminders">
                    <p>✅ אין תזכורות קרובות</p>
                    <p className="hint">כל הטיפולים וביטוח תקריים!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reminders-container">
            <h2>🔔 תזכורות קרובות ({reminders.length})</h2>
            <div className="reminders-list">
                {reminders.map((reminder, index) => (
                    <div
                        key={index}
                        className={`reminder-item reminder-${reminder.severity} ${reminder.expired ? 'expired' : ''}`}
                    >
                        <div className="reminder-icon">{reminder.label.split(' ')[0]}</div>
                        <div className="reminder-content">
                            <div className="reminder-title">{reminder.label.substring(2)}</div>
                            <div className="reminder-value">
                                {reminder.expired ? (
                                    <span className="expired-text">❌ פג תוקף - דחוף!</span>
                                ) : (
                                    <>בעוד <strong>{reminder.value}</strong> {reminder.unit}</>
                                )}
                            </div>
                            {reminder.date && (
                                <div className="reminder-date">📅 {reminder.date}</div>
                            )}
                        </div>
                        <div className={`reminder-badge ${reminder.severity}`}>
                            {reminder.expired ? '❌' : reminder.severity === 'urgent' ? '⚠️' : '⏰'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}