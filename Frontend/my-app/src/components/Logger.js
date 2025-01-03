import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Form.css';

function Login({ setNotification }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
    
        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username, password }),
            });
    
            const data = await response.json();
            console.log('Server Response:', response.status, data);
    
            setNotification(data.message);
    
            if (response.ok) {
                localStorage.setItem('token', data.token); // Token opslaan
                navigate('/home');
            } else {
                alert(`Fout: ${data.message}`);
            }
        } catch (error) {
            console.error('Fout bij inloggen:', error);
            alert('Er is een fout opgetreden. Controleer je verbinding.');
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
                    <h2>Login</h2>
                    <form onSubmit={handleLogin}>
                        <label>Gebruikersnaam:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Voer je gebruikersnaam in"
                            required
                        />
                        <label>Wachtwoord:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Voer je wachtwoord in"
                            required
                        />
                        <button type="submit">Inloggen</button>
                    </form>
                    <div className="register-link">
                        <span>Geen account?</span>
                        <a href="/register"> Registreer hier</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
