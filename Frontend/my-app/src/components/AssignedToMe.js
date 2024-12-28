import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AssignedToMe() {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        // Haal projecten op waar de gebruiker lid van is
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

    const checkUserRole = async (projectId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Je bent niet ingelogd.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/project-role/${projectId}`, {
                method: 'GET',
                headers: { Authorization: token },
            });

            if (!response.ok) {
                throw new Error('Fout bij het ophalen van gebruikersrol.');
            }

            const data = await response.json();
            setUserRole(data.role);
        } catch (error) {
            console.error(error.message);
            alert('Er is een fout opgetreden bij het ophalen van gebruikersrol.');
        }
    };

    const fetchProjectTasks = async (projectId) => {
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
        } catch (error) {
            console.error(error.message);
            alert('Er is een fout opgetreden bij het ophalen van taken.');
        }
    };

    useEffect(() => {
        if (selectedProject) {
            checkUserRole(selectedProject);
            fetchProjectTasks(selectedProject);
        }
    }, [selectedProject]);

    const handleProjectClick = (projectId) => {
        setSelectedProject(projectId);
    };

    const handleEditTask = (taskId) => {
        if (userRole !== 'operator') {
            alert('Je hebt geen rechten om deze taak te bewerken.');
            return;
        }
        navigate(`/edit-task/${taskId}`);
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
            <h2>Projecten Toegewezen aan Mij</h2>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                {/* Projectlijst */}
                <div style={{ width: '30%', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                    <h3>Projecten</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {projects.map((project) => (
                            <li
                                key={project.id}
                                onClick={() => handleProjectClick(project.id)}
                                style={{
                                    padding: '10px',
                                    borderBottom: '1px solid #ddd',
                                    cursor: 'pointer',
                                    backgroundColor: selectedProject === project.id ? '#f0f0f0' : 'transparent',
                                }}
                            >
                                <strong>{project.name}</strong>
                                <p>{project.description}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Takenlijst */}
                <div style={{ width: '70%', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                    <h3>Taken voor Project {selectedProject || ''}</h3>
                    {tasks.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {tasks.map((task) => (
                                <li
                                    key={task.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px',
                                        borderBottom: '1px solid #ddd',
                                    }}
                                >
                                    <div>
                                        <h4>{task.title}</h4>
                                        <p>{task.description}</p>
                                        <p>
                                            <strong>Status:</strong> {task.status || 'Niet gespecificeerd'}
                                        </p>
                                        <p>
                                            <strong>Deadline:</strong> {task.due_date || 'Geen deadline'}
                                        </p>
                                    </div>
                                    {userRole === 'operator' && (
                                        <button
                                            onClick={() => handleEditTask(task.id)}
                                            style={{
                                                padding: '5px 10px',
                                                borderRadius: '5px',
                                                border: 'none',
                                                backgroundColor: '#007bff',
                                                color: '#fff',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Bewerk
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Geen taken beschikbaar.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssignedToMe;
