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

    const [showPopup, setShowPopup] = useState(false);
const [tasks, setTasks] = useState([]);
const [selectedProject, setSelectedProject] = useState(null);

const handleProjectClick = async (projectId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Je bent niet ingelogd.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/project-tasks/${projectId}`, {
            method: 'GET',
            headers: { Authorization: token },
        });

        if (!response.ok) {
            throw new Error('Fout bij het ophalen van taken.');
        }

        const data = await response.json();
        setTasks(data);
        setSelectedProject(projectId);
        setShowPopup(true); // Open de pop-up
    } catch (error) {
        console.error(error.message);
        alert('Er is een fout opgetreden bij het ophalen van taken.');
    }
};

const closePopup = () => {
    setShowPopup(false);
    setTasks([]);
    setSelectedProject(null);
};


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
                        cursor: 'pointer',
                    }}
                    onClick={() => handleProjectClick(project.id)} // Open taken bij klik
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
            {showPopup && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                    }}
                    onClick={closePopup} // Klik buiten de pop-up om te sluiten
                >
                    <div
                        style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '5px',
                            width: '50%',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={(e) => e.stopPropagation()} // Voorkom sluiten bij klik binnen de pop-up
                    >
                        <h2>Taken voor Project {selectedProject}</h2>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {tasks.map((task) => (
                                <li
                                    key={task.id}
                                    style={{
                                        padding: '10px',
                                        borderBottom: '1px solid #ddd',
                                    }}
                                >
                                    <h4>{task.title}</h4>
                                    <p>{task.description}</p>
                                    <p>
                                        <strong>Status:</strong> {task.status || 'Niet gespecificeerd'}
                                    </p>
                                    <p>
                                        <strong>Deadline:</strong> {task.due_date || 'Geen deadline'}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={closePopup}
                            style={{
                                marginTop: '10px',
                                padding: '10px',
                                borderRadius: '5px',
                                border: 'none',
                                backgroundColor: '#007bff',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            Sluiten
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default AssignedToMe;
