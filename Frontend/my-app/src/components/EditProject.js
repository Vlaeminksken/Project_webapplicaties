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

    const handleRemoveMember = async (memberId) => {
        const token = localStorage.getItem('token');
        if (!token || !projectId) return;

        try {
            const response = await fetch(`http://localhost:5000/projects/${projectId}/members/${memberId}`, {
                method: 'DELETE',
                headers: { Authorization: token },
            });

            if (!response.ok) {
                throw new Error('Fout bij het verwijderen van projectlid.');
            }

            alert('Projectlid succesvol verwijderd!');
            setMembers(members.filter((member) => member.id !== memberId));
        } catch (error) {
            console.error(error.message);
            alert('Er is een fout opgetreden bij het verwijderen van het projectlid.');
        }
    };

    const shareOnSocialMedia = (platform) => {
        const projectUrl = encodeURIComponent(`http://localhost:3000/projects/${project.id}`);
        const projectTitle = encodeURIComponent(project.name);
    
        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${projectTitle}&url=${projectUrl}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${projectUrl}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/shareArticle?url=${projectUrl}&title=${projectTitle}`;
                break;
            default:
                break;
        }
    
        window.open(shareUrl, '_blank');
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
            <button onClick={() => shareOnSocialMedia('twitter')}>Deel op Twitter</button>
            <button onClick={() => shareOnSocialMedia('facebook')}>Deel op Facebook</button>
            <button onClick={() => shareOnSocialMedia('linkedin')}>Deel op LinkedIn</button>

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
                    members.map((member) => (
                        <li
                            key={member.id}
                            style={{
                                padding: '10px',
                                borderBottom: '1px solid #ddd',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <strong>{member.name}</strong> - {member.role}
                            </div>
                            <button
                                onClick={() => handleRemoveMember(member.id)}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    backgroundColor: '#dc3545',
                                    color: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                Verwijder
                            </button>
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
