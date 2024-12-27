import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AssignedToMe() {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        // Haal toegewezen projecten op
        fetch('http://localhost:5000/assigned-projects', {
            method: 'GET',
            headers: { Authorization: token },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Fout bij het ophalen van toegewezen projecten.');
                }
                return response.json();
            })
            .then((data) => setProjects(data))
            .catch((err) => {
                console.error(err.message);
                alert('Fout bij het ophalen van toegewezen projecten.');
            });
    }, [navigate]);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Projecten Toegewezen aan Mij</h2>
            <div style={{ marginTop: '20px' }}>
                {projects.map((project) => (
                    <div
                        key={project.id}
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            padding: '15px',
                            marginBottom: '15px',
                            backgroundColor: '#f9f9f9',
                        }}
                    >
                        <h3>{project.name}</h3>
                        <p>{project.description || 'Geen beschrijving beschikbaar.'}</p>
                    </div>
                ))}
            </div>
            <button
                onClick={() => navigate('/home')}
                style={{
                    marginTop: '20px',
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
        </div>
    );
}

export default AssignedToMe;
