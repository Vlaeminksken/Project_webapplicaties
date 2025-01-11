import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        fetch('http://localhost:5000/tasks', {
            method: 'GET',
            headers: { Authorization: token },
        })
            .then((response) => response.json())
            .then((data) => {
                setTasks(data);
                setFilteredTasks(data);
            })
            .catch(() => {
                console.error('Fout bij het ophalen van taken.');
                navigate('/');
            });

        fetch('http://localhost:5000/projects', {
            method: 'GET',
            headers: { Authorization: token },
        })
            .then((response) => response.json())
            .then((data) => {
                setProjects(data);
            })
            .catch(() => {
                console.error('Fout bij het ophalen van projecten.');
                setProjects([]);
            });
    }, [navigate]);

    const openEditPanel = (task) => {
        setSelectedTask(task);
        setIsEditing(true);
    };

    const closeEditPanel = () => {
        setSelectedTask(null);
        setIsEditing(false);
    };

    const handleSaveChanges = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        const response = await fetch(`http://localhost:5000/tasks/${selectedTask.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify(selectedTask),
        });

        if (response.ok) {
            const updatedTasks = tasks.map((task) =>
                task.id === selectedTask.id ? selectedTask : task
            );
            setTasks(updatedTasks);
            closeEditPanel();
        } else {
            alert('Fout bij het opslaan van wijzigingen!');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    const handleSelectProject = (projectId) => {
        setSelectedProject(projectId);
        const tasksForProject = tasks.filter((task) => task.project_id === projectId);
        setFilteredTasks(tasksForProject);
    };

    const [filteredTasks, setFilteredTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const handleDeleteProject = async () => {
        if (!selectedProject) {
            alert('Selecteer een project om te verwijderen.');
            return;
        }

        const token = localStorage.getItem('token');
        const confirmDelete = window.confirm(
            'Weet je zeker dat je dit project wilt verwijderen? Dit kan niet ongedaan worden gemaakt.'
        );

        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5000/projects/${selectedProject}`, {
                method: 'DELETE',
                headers: {
                    Authorization: token,
                },
            });

            if (response.ok) {
                setProjects((prevProjects) =>
                    prevProjects.filter((project) => project.id !== selectedProject)
                );
                setSelectedProject(null);
                setFilteredTasks([]);
                navigate('/home');
            } else {
                const data = await response.json();
                alert(`Fout bij het verwijderen van project: ${data.message}`);
            }
        } catch (error) {
            console.error('Fout bij het verwijderen van project:', error.message);
            alert('Er is een fout opgetreden. Probeer het opnieuw.');
        }
    };

    const handleToggleStatus = async (taskId, currentStatus) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Je bent niet ingelogd.');
            return;
        }

        const newStatus = currentStatus === 'pending' ? 'ended' : 'pending';

        try {
            const response = await fetch(`http://localhost:5000/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Fout bij het bijwerken van de status.');
            }

            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                )
            );
        } catch (error) {
            console.error(error.message);
            alert('Er is een fout opgetreden bij het bijwerken van de status.');
        }
    };

    return (
        <div className="home-container" style={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar */}
            <div
                className="sidebar"
                style={{
                    width: '33.33%',
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    overflowY: 'auto',
                    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
                }}
            >
                <button onClick={handleLogout}>Log Out</button>
                <button onClick={() => navigate('/profile')}>Profiel</button>
                <button
                    onClick={() => navigate('/assigned-to-me')}
                    style={{
                        marginBottom: '10px',
                        padding: '10px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#007bff',
                        color: '#fff',
                    }}
                >
                    Toegewezen aan mij
                </button>

                <div>
                    <h3>Mijn Projecten</h3>
                    <input
                        type="text"
                        placeholder="Zoek projecten..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                        }}
                    />
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                        {filteredProjects.map((project) => (
                            <li
                                key={project.id}
                                onClick={() => handleSelectProject(project.id)}
                                style={{
                                    marginBottom: '10px',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    backgroundColor:
                                        selectedProject === project.id ? '#e0e0e0' : '#f9f9f9',
                                    cursor: 'pointer',
                                }}
                            >
                                <strong>{project.name}</strong>
                                <p>{project.description || 'Geen beschrijving'}</p>
                            </li>
                        ))}
                    </ul>
                    <button
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #007bff',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            width: '100%',
                            cursor: 'pointer',
                            marginTop: '10px',
                        }}
                        onClick={() => navigate('/add-project')}
                    >
                        Voeg project toe
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div
                className="main-content"
                style={{
                    flex: 1,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={toggleDropdown}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                        }}
                    >
                        &#x22EE;
                    </button>
                    {isDropdownOpen && (
                        <ul
                            style={{
                                position: 'absolute',
                                top: '40px',
                                right: '20px',
                                listStyle: 'none',
                                padding: '10px',
                                margin: 0,
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                borderRadius: '5px',
                                zIndex: 10,
                            }}
                        >
                            <li
                                style={{ marginBottom: '10px', cursor: 'pointer' }}
                                onClick={() => {
                                    if (selectedProject) {
                                        navigate('/edit-project', {
                                            state: { projectId: selectedProject },
                                        });
                                    } else {
                                        alert('Selecteer eerst een project om te bewerken.');
                                    }
                                }}
                            >
                                Bewerk project
                            </li>
                            <li
                                style={{ marginBottom: '10px', cursor: 'pointer' }}
                                onClick={handleDeleteProject}
                            >
                                Verwijder project
                            </li>
                            <li
                                style={{ marginBottom: '10px', cursor: 'pointer' }}
                                onClick={() => {
                                    if (selectedProject) {
                                        navigate('/add-person', {
                                            state: { projectId: selectedProject },
                                        });
                                    } else {
                                        alert('Selecteer eerst een project om personen toe te voegen.');
                                    }
                                }}
                            >
                                Voeg persoon toe
                            </li>
                        </ul>
                    )}
                    <h1>My Tasks</h1>
                </div>

                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        overflowY: 'auto',
                        paddingBottom: '20px',
                    }}
                >
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={(e) => {
                                if (e.target.type !== 'checkbox') openEditPanel(task);
                            }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                padding: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                backgroundColor: '#f9f9f9',
                                textDecoration: task.status === 'ended' ? 'line-through' : 'none',
                                opacity: task.status === 'ended' ? 0.6 : 1,
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ marginBottom: '10px' }}>
                                <input
                                    type="checkbox"
                                    checked={task.status === 'ended'}
                                    onChange={() => handleToggleStatus(task.id, task.status)}
                                    style={{ marginRight: '10px' }}
                                />
                                <h3>{task.title}</h3>
                                <p>{task.description}</p>
                                <small>Deadline: {task.due_date || 'Geen'}</small>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        fontSize: '24px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                    onClick={() => navigate('/add-task', { state: { projectId: selectedProject } })}
                >
                    +
                </button>

                {isEditing && (
                    <>
                        <div
                            className="overlay"
                            onClick={closeEditPanel}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 10,
                            }}
                        ></div>
                        <div
                            className="edit-panel"
                            style={{
                                position: 'fixed',
                                top: '10%',
                                right: '10%',
                                width: '300px',
                                padding: '20px',
                                backgroundColor: '#fff',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 11,
                            }}
                        >
                            <h2>Taak Bewerken</h2>
                            <form>
                                <label>Titel:</label>
                                <input
                                    type="text"
                                    value={selectedTask.title}
                                    onChange={(e) =>
                                        setSelectedTask({ ...selectedTask, title: e.target.value })
                                    }
                                    style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <label>Beschrijving:</label>
                                <textarea
                                    value={selectedTask.description}
                                    onChange={(e) =>
                                        setSelectedTask({
                                            ...selectedTask,
                                            description: e.target.value,
                                        })
                                    }
                                    style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <label>Deadline:</label>
                                <input
                                    type="date"
                                    value={selectedTask.due_date || ''}
                                    onChange={(e) =>
                                        setSelectedTask({
                                            ...selectedTask,
                                            due_date: e.target.value,
                                        })
                                    }
                                    style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveChanges}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        backgroundColor: '#007bff',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        marginRight: '10px',
                                    }}
                                >
                                    Opslaan
                                </button>
                                <button
                                    type="button"
                                    onClick={closeEditPanel}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        backgroundColor: '#6c757d',
                                        color: '#fff',
                                    }}
                                >
                                    Annuleren
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const token = localStorage.getItem('token');
                                        const response = await fetch(
                                            `http://localhost:5000/tasks/${selectedTask.id}`,
                                            {
                                                method: 'DELETE',
                                                headers: {
                                                    Authorization: token,
                                                },
                                            }
                                        );

                                        if (response.ok) {
                                            setTasks((prevTasks) =>
                                                prevTasks.filter(
                                                    (task) => task.id !== selectedTask.id
                                                )
                                            );
                                           

                                            setFilteredTasks((prevFilteredTasks) =>
                                                prevFilteredTasks.filter(
                                                    (task) => task.id !== selectedTask.id
                                                )
                                            );
                                            closeEditPanel();
                                        } else {
                                            alert('Fout bij het verwijderen van de taak!');
                                        }
                                    }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        backgroundColor: '#dc3545',
                                        color: '#fff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Verwijderen
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Home;
