import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function EditProfile() {
    const [profile, setProfile] = useState({ name: '', email: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Je bent niet ingelogd.');
                navigate('/');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/profile', {
                    method: 'GET',
                    headers: { Authorization: token },
                });

                if (!response.ok) {
                    throw new Error('Fout bij het ophalen van profielgegevens.');
                }

                const data = await response.json();
                setProfile(data);
            } catch (error) {
                console.error(error.message);
                alert('Fout bij het ophalen van profielgegevens.');
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Je bent niet ingelogd.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify(profile),
            });

            if (!response.ok) {
                throw new Error('Fout bij het bijwerken van profielgegevens.');
            }

            alert('Profiel succesvol bijgewerkt!');
            navigate('/profile');
        } catch (error) {
            console.error(error.message);
            alert('Er is een fout opgetreden bij het bijwerken van het profiel.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <button
                onClick={() => navigate('/home')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    padding: '10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    cursor: 'pointer',
                }}
            >
                Terug naar Home
            </button>
            <h2>Bewerk Profiel</h2>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                }}
            >
                <label>Naam:</label>
                <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    style={{
                        display: 'block',
                        marginBottom: '10px',
                        width: '100%',
                        padding: '8px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                    }}
                />
                <label>Email:</label>
                <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    style={{
                        display: 'block',
                        marginBottom: '10px',
                        width: '100%',
                        padding: '8px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: '10px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    Opslaan
                </button>
            </form>
        </div>
    );
}

export default EditProfile;
