import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function EditProject() {
    const [project, setProject] = useState({ name: '', description: '' });
    const navigate = useNavigate();
    const location = useLocation();

    // Haal het project ID op uit de locatie state
    const projectId = location.state?.projectId || null;

    useEffect(() => {
        console.log('Project ID:', projectId); // Debugging
        const token = localStorage.getItem('token');
        if (!token || !projectId) {
            console.log('Geen token of projectId gevonden.');
            navigate('/home');
            return;
        }

        // Haal de huidige projectgegevens op
        fetch(`http://localhost:5000/projects/${projectId}`, {
            method: 'GET',
            headers: {
                Authorization: token,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    console.error('Fetch failed:', response.status, response.statusText); // Debugging
                    throw new Error('Fout bij het ophalen van projectgegevens.');
                }
                return response.json();
            })
            .then((data) => setProject(data))
            .catch((error) => {
                console.error(error.message);
                alert('Fout bij het ophalen van projectgegevens.');
                navigate('/home');
            });
        
    }, [projectId, navigate]);

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const response = await fetch(`http://localhost:5000/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify(project),
        });

        if (response.ok) {
            //alert('Project succesvol bijgewerkt!');
            navigate('/home');
        } else {
            alert('Fout bij het bijwerken van het project.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Bewerk Project</h2>
            <form onSubmit={handleUpdateProject}>
                <label>Naam:</label>
                <input
                    type="text"
                    value={project.name}
                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                    required
                    style={{
                        display: 'block',
                        marginBottom: '10px',
                        width: '100%',
                        padding: '8px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                    }}
                />
                <label>Beschrijving:</label>
                <textarea
                    value={project.description}
                    onChange={(e) => setProject({ ...project, description: e.target.value })}
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
                    Bijwerken
                </button>
            </form>
        </div>
    );
}

export default EditProject;
