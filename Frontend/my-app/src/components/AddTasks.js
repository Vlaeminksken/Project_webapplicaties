import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AddTasks() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Haal het projectId op vanuit de locatie state
    const projectId = location.state?.projectId || null;

    const handleAddTask = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (!projectId) {
            alert('Geen project geselecteerd. Selecteer een project om een taak aan toe te voegen.');
            return;
        }

        const response = await fetch('http://localhost:5000/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ title, description, project_id: projectId }),
        });

        const data = await response.json();
        if (response.ok) {
            navigate('/home');
        } else {
            alert(data.message);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Nieuwe Taak</h2>
            <form onSubmit={handleAddTask}>
                <label>Titel:</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
                />
                <label>Beschrijving:</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
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
                    Toevoegen
                </button>
            </form>
        </div>
    );
}

export default AddTasks;
