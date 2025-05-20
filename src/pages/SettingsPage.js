import React, { useState } from 'react';
import './SettingsPage.css';
import { Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';

const SettingsPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: ""
    });

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Saving updated settings:", formData);
        alert("Settings updated successfully!");
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        console.log("Logging out");
        navigate('/login');
    };

    return (
        <div className="settings-container">
            <TopBar />

            {/* Header */}
            <div className="settings-header">
                <SettingsIcon className="settings-icon-large"/>
                <h1 className="settings-title">Settings</h1>
            </div>

            {/* Profile Info */}
            <div className="profile-info-section">
                <img
                    className="profile-photo-large"
                    src="/images/profile-pic.jpg"
                    alt="User Profile"
                />
                <div className="profile-text-info">
                    <h2 className="profile-name">{formData.fullName || "Amelia Smith"}</h2>
                    <p className="profile-email">{formData.email || "AmySmith@gmail.com"}</p>
                </div>
            </div>

            <div className="settings-page">
                <div className="settings-content">
                    <form className="settings-form" onSubmit={handleSubmit}>
                        <div className="form-columns">
                            <div className="form-column">
                                <div className="input-group">
                                    <label htmlFor="email">Username</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-column">
                                <div className="input-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="input-group">
                                    <button type="button" className="logout-button" onClick={handleLogout}>
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {showLogoutModal && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <p>Are you sure you want to<br/><strong>Log Out?</strong></p>
                        <div className="modal-buttons">
                            <button className="modal-yes" onClick={confirmLogout}>Yes</button>
                            <button className="modal-no" onClick={() => setShowLogoutModal(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;