import React, { useState } from 'react';
import './SettingsPage.css';
import { Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';

const SettingsPage = ({ onClose }) => {
    const navigate = useNavigate();
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showPictureOptions, setShowPictureOptions] = useState(false);
    const [selectedPicture, setSelectedPicture] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null); // actual current picture
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
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
        console.log('Saving updated settings:', formData);
        setShowSaveSuccess(true);

        setTimeout(() => {
            setShowSaveSuccess(false);
            if (onClose) onClose();
        });
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        console.log('Logging out');
        navigate('/login');
    };

    return (
        <div className="settings-container">
            <TopBar />

            <div className="settings-header">
                <SettingsIcon className="settings-icon-large" />
                <h1 className="settings-title">Settings</h1>
            </div>

            <div className="profile-info-section">
                <div style={{position: "relative"}}>
                    <img
                        className="profile-photo-large"
                        src={profilePicture || "/images/green.png"}
                        alt="User Profile"
                    />
                    <button
                        onClick={() => setShowPictureOptions(true)}
                        className="edit-profile-picture-button"
                    >
                        ✎
                    </button>
                </div>
                <div className="profile-text-info">
                    <h2 className="profile-name">{formData.fullName || 'User Name'}</h2>
                    <h3 className="profile-email">{formData.email || 'username@gmail.com'}</h3>
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
                                    <button
                                        type="button"
                                        className="logout-button"
                                        onClick={handleLogout}
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button type="submit" className="save-button">
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showLogoutModal && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <p>Are you sure you want to log out?</p>
                        <div className="modal-buttons">
                            <button className="modal-yes" onClick={confirmLogout}>
                                Log Out
                            </button>
                            <button className="modal-no" onClick={() => setShowLogoutModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showPictureOptions && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <p>Choose new profile picture!</p>
                        <div className="profile-pic-options">
                            {["blue", "purple", "red", "pink", "orange", "yellow", "green"].map(color => (
                                <img
                                    key={color}
                                    src={`/images/${color}.png`}
                                    alt={color}
                                    className="profile-pic-option"
                                    onClick={() => {
                                        setSelectedPicture(`/images/${color}.png`);
                                        setShowConfirmModal(true);
                                        setShowPictureOptions(false);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {showSuccessMessage && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <p>Profile Picture update was successful!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
