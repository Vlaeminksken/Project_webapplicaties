import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const [profile, setProfile] = useState(null);
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        fetch('http://localhost:5000/profile', {
            method: 'GET',
            headers: { Authorization: token },
        })
            .then((response) => response.json())
            .then((data) => {
                setProfile(data.user);
                setTasks(data.tasks);
            })
            .catch(() => {
                navigate('/');
            });
    }, [navigate]);

    if (!profile) {
        return <h2>Profiel laden...</h2>;
    }

    return (
        <div style={{ padding: '20px', position: 'relative' }}>
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
            <h1>Profiel</h1>
            <p><strong>Gebruikersnaam:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Account aangemaakt op:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
            <h2>Mijn Taken</h2>
            <ul>
                {tasks.map((title, index) => (
                    <li key={index}>{title}</li>
                ))}
            </ul>
            <button
                onClick={() => navigate('/edit-profile')}
                style={{
                    padding: '10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    cursor: 'pointer',
                    marginTop: '20px',
                }}
            >
                Bewerk Profiel
            </button>

        </div>
    );
}

export default Profile;
