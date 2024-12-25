import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddProject() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();

    const handleAddProject = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ name, description }),
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
            <h2>Nieuw Project</h2>
            <form onSubmit={handleAddProject}>
                <label>Naam:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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

export default AddProject;
