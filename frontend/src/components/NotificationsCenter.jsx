import React, { useMemo } from 'react';
import '../styles/NotificationsCenter.css';

export default function NotificationsCenter({ vehicle, maintenance }) {
    const alerts = useMemo(() => {
        const notifications = [];
        const today = new Date();

        // ===== טיפולים שקרבים =====
        const maintenanceCategories = {
            oil_change: { label: '🛢️ החלפת שמן', interval: 6000 }, // ק"מ
            inspection: { label: '🔍 בדיקה שנתית', interval: 365 }, // ימים
            tires: { label: '🛞 בדיקת גלגלים', interval: 3 },
            battery: { label: '🔋 בדיקת סוללה', interval: 1 },
            brakes: { label: '🛑 בדיקת בלמים', interval: 2 },
        };

        // טיפול אחרון מכל קטגוריה
        const lastServiceByCategory = {};
        if (maintenance && maintenance.length > 0) {
            maintenance.forEach(service => {
                if (!lastServiceByCategory[service.category]) {
                    lastServiceByCategory[service.category] = service;
                }
            });
        }

        // בדוק כל קטגוריה
        Object.entries(maintenanceCategories).forEach(([category, data]) => {
            const lastService = lastServiceByCategory[category];

            if (!lastService) {
                // אם אין טיפול בקטגוריה - דחוף!
                notifications.push({
                    type: 'urgent',
                    emoji: data.label.split(' ')[0],
                    title: data.label,
                    message: 'לא בוצע טיפול זה עדיין',
                    daysLeft: 0,
                    priority: 3,
                });
            } else {
                // חשב כמה ימים עברו
                const lastDate = new Date(lastService.service_date);
                const daysPassed = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

                // חשב כמה ימים נותרים
                let daysLeft = data.interval - daysPassed;

                if (daysLeft <= 0) {
                    // זמן לטיפול!
                    notifications.push({
                        type: 'urgent',
                        emoji: data.label.split(' ')[0],
                        title: data.label,
                        message: '⚠️ זמן לטיפול!',
                        daysLeft: 0,
                        priority: 3,
                    });
                } else if (daysLeft <= 7) {
                    // קרוב מאוד
                    notifications.push({
                        type: 'critical',
                        emoji: data.label.split(' ')[0],
                        title: data.label,
                        message: `בעוד ${daysLeft} ימים`,
                        daysLeft,
                        priority: 2,
                    });
                } else if (daysLeft <= 30) {
                    // קרוב
                    notifications.push({
                        type: 'warning',
                        emoji: data.label.split(' ')[0],
                        title: data.label,
                        message: `בעוד ${daysLeft} ימים`,
                        daysLeft,
                        priority: 1,
                    });
                }
            }
        });

        // ===== ביטוח שקרב לחידוש =====
        if (vehicle.insurance_expiry) {
            const expiryDate = new Date(vehicle.insurance_expiry);
            const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry <= 0) {
                notifications.push({
                    type: 'urgent',
                    emoji: '🛡️',
                    title: 'חידוש ביטוח',
                    message: '⚠️ הביטוח פג תוקף!',
                    daysLeft: 0,
                    priority: 3,
                });
            } else if (daysUntilExpiry <= 7) {
                notifications.push({
                    type: 'critical',
                    emoji: '🛡️',
                    title: 'חידוש ביטוח',
                    message: `בעוד ${daysUntilExpiry} ימים`,
                    daysLeft: daysUntilExpiry,
                    priority: 2,
                });
            } else if (daysUntilExpiry <= 30) {
                notifications.push({
                    type: 'warning',
                    emoji: '🛡️',
                    title: 'חידוש ביטוח',
                    message: `בעוד ${daysUntilExpiry} ימים`,
                    daysLeft: daysUntilExpiry,
                    priority: 1,
                });
            }
        }

        // מיין לפי עדיפות
        return notifications.sort((a, b) => b.priority - a.priority);
    }, [vehicle, maintenance]);

    if (alerts.length === 0) {
        return (
            <div className="notifications-center good">
                <div className="notification-item">
                    <span className="emoji">✅</span>
                    <div className="content">
                        <h3>הכל בסדר!</h3>
                        <p>אין התראות דחופות כרגע</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-center">
            <h2>📢 התראות</h2>
            <div className="alerts-list">
                {alerts.map((alert, index) => (
                    <div
                        key={index}
                        className={`notification-item alert-${alert.type}`}
                    >
                        <span className="emoji">{alert.emoji}</span>
                        <div className="content">
                            <h3>{alert.title}</h3>
                            <p>{alert.message}</p>
                            {alert.daysLeft > 0 && (
                                <div className="days-indicator">
                                    <span className={`days days-${alert.type}`}>
                                        {alert.daysLeft} ימים
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}