import React, { useState, useEffect } from 'react';
import '../styles/Settings.css';

export default function Settings() {
    const [email, setEmail] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [tempEmail, setTempEmail] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // טען מייל משמור
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

    const isValidEmail = (emailToCheck) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailToCheck);
    };

    const handleEditClick = () => {
        setTempEmail(email);
        setEditMode(true);
        setError('');
        setSaved(false);
    };

    const handleSave = () => {
        setError('');

        if (!tempEmail.trim()) {
            setError('❌ אנא הזן מייל');
            return;
        }

        if (!isValidEmail(tempEmail)) {
            setError('❌ מייל לא חוקי');
            return;
        }

        // שמור ב-localStorage
        localStorage.setItem('userEmail', tempEmail);
        setEmail(tempEmail);
        setEditMode(false);
        setSaved(true);

        // הסר ה"שמור בהצלחה" אחרי 3 שניות
        setTimeout(() => setSaved(false), 3000);
    };

    const handleCancel = () => {
        setEditMode(false);
        setError('');
    };

    return (
        <div className="settings-container">
            <div className="settings-card">
                <h2>⚙️ הגדרות</h2>

                <div className="settings-section">
                    <h3>📧 מייל לתראות</h3>
                    <p className="section-description">
                        קבל התראות דחופות בנוגע לטיפולים וביטוח
                    </p>

                    {!editMode ? (
                        <div className="email-display">
                            {email ? (
                                <>
                                    <div className="email-box">
                                        <span className="label">מייל שלך:</span>
                                        <span className="email-value">{email}</span>
                                    </div>
                                    <button onClick={handleEditClick} className="btn-edit">
                                        ✏️ עדכן מייל
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="no-email">📭 לא הגדרת מייל עדיין</p>
                                    <button onClick={handleEditClick} className="btn-add">
                                        ➕ הוסף מייל
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="email-edit">
                            <input
                                type="email"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                placeholder="הזן את המייל שלך"
                                className="email-input"
                            />
                            {error && <p className="error-message">{error}</p>}
                            <div className="button-group">
                                <button onClick={handleSave} className="btn-save">
                                    💾 שמור
                                </button>
                                <button onClick={handleCancel} className="btn-cancel">
                                    ביטול
                                </button>
                            </div>
                        </div>
                    )}

                    {saved && (
                        <div className="success-message">
                            ✅ המייל נשמר בהצלחה!
                        </div>
                    )}
                </div>

                <div className="settings-section info-section">
                    <h3>ℹ️ מידע</h3>
                    <ul className="info-list">
                        <li>🔔 תקבל התראות בנוגע לטיפולים קרובים</li>
                        <li>🛡️ תקבל התראות על ביטוח שעומד להיגמר</li>
                        <li>⏰ התראות ישלחו כאשר תכנס למערכת</li>
                        <li>📧 בדוק את תיקייה "Spam" אם לא קיבלת</li>
                    </ul>
                </div>

                <div className="settings-section warning-section">
                    <p className="warning-text">
                        ⚠️ וודא שהמייל שהזנת נכון. זה כרחי לקבלת התראות!
                    </p>
                </div>
            </div>
        </div>
    );
}