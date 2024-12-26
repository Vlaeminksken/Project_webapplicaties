import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Form.css';

function Register({ setNotification }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setNotification('Wachtwoorden komen niet overeen. Probeer het opnieuw.');
            return;
        }
    
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: username, email, password }), // name in plaats van username
        });
    
        const data = await response.json();
        setNotification(data.message);
    
        if (response.ok) {
            navigate('/');
        }
    };

    return (
        <div className="container">
            <div className="image-container">
                <img
                    src="https://wallpapers.com/images/featured/david-goggins-logo-1gq4aw9mzcg58hd9.jpg"
                    alt="David Goggins Logo"
                />
            </div>
            <div className="form-section">
                <div className="form-container">
                    <h2>Registreer</h2>
                    <form onSubmit={handleRegister}>
                        <label>Gebruikersnaam:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Kies een gebruikersnaam"
                            required
                        />
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Voer je email in"
                            required
                        />
                        <label>Wachtwoord:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Kies een wachtwoord"
                            required
                        />
                        <label>Bevestig Wachtwoord:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Herhaal je wachtwoord"
                            required
                        />
                        <button type="submit">Registreer</button>
                    </form>
                    <div className="register-link">
                        <span>Heb je al een account?</span>
                        <a href="/"> Log hier in</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
