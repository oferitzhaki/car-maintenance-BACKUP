import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:3088/api';

export default function EmailNotifications({ vehicle, alerts, userEmail }) {
    const [sentAlerts, setSentAlerts] = useState([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!alerts || alerts.length === 0 || !userEmail) {
            return;
        }

        // בדוק רק alert-ים דחופים (priority 2 ו-3)
        const urgentAlerts = alerts.filter(alert => alert.priority >= 2);

        urgentAlerts.forEach(alert => {
            // בדוק אם כבר שלחנו email לhash של ה-alert הזה
            const alertHash = JSON.stringify(alert);

            if (!sentAlerts.includes(alertHash)) {
                sendEmailAlert(alert, alertHash);
            }
        });
    }, [alerts, userEmail, sentAlerts]);

    const sendEmailAlert = async (alert, alertHash) => {
        setSending(true);

        try {
            const subject = `⚠️ התראה דחופה - ${vehicle.make} ${vehicle.model}`;

            const message = `
        <h3>התראה דחופה!</h3>
        <p><strong>רכב:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</p>
        <p><strong>בעיה:</strong> ${alert.title}</p>
        <p><strong>פרטים:</strong> ${alert.message}</p>
        ${alert.daysLeft > 0 ? `<p><strong>ימים נותרו:</strong> ${alert.daysLeft}</p>` : ''}
        <hr>
        <p style="color: #999; font-size: 12px;">
          אנא בדוק את המערכת שלך בהקדם!
        </p>
      `;

            const response = await fetch(`${API_BASE}/notifications/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: userEmail,
                    subject: subject,
                    message: message,
                }),
            });

            if (response.ok) {
                console.log(`✅ Email sent for: ${alert.title}`);
                setSentAlerts([...sentAlerts, alertHash]);
            } else {
                console.error('Failed to send email:', await response.json());
            }
        } catch (err) {
            console.error('Error sending email:', err);
        } finally {
            setSending(false);
        }
    };

    // Component זה מעבד emails בעמוד הרקע, לא מציג כלום
    return null;
}