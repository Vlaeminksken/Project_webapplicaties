import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function EditProject() {
    const [project, setProject] = useState({ name: '', description: '' });
    const [members, setMembers] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    const projectId = location.state?.projectId || null;

    useEffect(() => {
        const fetchProject = async () => {
            const token = localStorage.getItem('token');
            if (!token || !projectId) {
                navigate('/home');
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/projects/${projectId}`, {
                    method: 'GET',
                    headers: { Authorization: token },
                });

                if (!response.ok) {
                    throw new Error('Fout bij het ophalen van projectgegevens.');
                }

                const data = await response.json();
                setProject(data);
            } catch (error) {
                console.error(error.message);
                alert('Fout bij het ophalen van projectgegevens.');
                navigate('/home');
            }
        };

        const fetchMembers = async () => {
            const token = localStorage.getItem('token');
            if (!token || !projectId) return;

            try {
                const response = await fetch(`http://localhost:5000/projects/${projectId}/members`, {
                    method: 'GET',
                    headers: { Authorization: token },
                });

                if (!response.ok) {
                    throw new Error('Fout bij het ophalen van projectleden.');
                }

                const data = await response.json();
                setMembers(data);
            } catch (error) {
                console.error(error.message);
            }
        };

        fetchProject();
        fetchMembers();
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
            <h3>Projectleden</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {members.length > 0 ? (
                    members.map((member, index) => (
                        <li
                            key={index}
                            style={{
                                padding: '10px',
                                borderBottom: '1px solid #ddd',
                            }}
                        >
                            <strong>{member.name}</strong> - {member.role}
                        </li>
                    ))
                ) : (
                    <p>Geen leden gevonden.</p>
                )}
            </ul>
        </div>
    );
}

export default EditProject;
