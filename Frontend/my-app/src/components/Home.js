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
    
        // Taken ophalen
        fetch('http://localhost:5000/tasks', {
            method: 'GET',
            headers: { Authorization: token },
        })
            .then((response) => response.json())
            .then((data) => {
                setTasks(data);
                setFilteredTasks(data); // Toon alle taken standaard
            })
            .catch(() => {
                console.error('Fout bij het ophalen van taken.');
                navigate('/');
            });
    
        // Projecten ophalen
        fetch('http://localhost:5000/projects', {
            method: 'GET',
            headers: { Authorization: token },
        })
            .then((response) => response.json())
            .then((data) => {
                setProjects(data); // Zet alleen de projecten
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
        localStorage.removeItem('token'); // Verwijdert het opgeslagen token
        navigate('/'); // Navigeert naar de loginpagina
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

    
    return (
        <div className="home-container">
            {/* Sidebar */}
            <div className="sidebar">
                <button onClick={handleLogout}>Log Out</button>
                <button onClick={() => navigate('/profile')}>Profiel</button>
                <button onClick={() => alert('Toegewezen aan mij functie wordt later toegevoegd.')}>Toegewezen aan mij</button>
                <button onClick={() => alert('Belangrijk functie wordt later toegevoegd.')}>Belangrijk</button>
                <hr style={{ width: '100%', margin: '20px 0', borderColor: '#ddd' }} />
            
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
                                    backgroundColor: selectedProject === project.id ? '#e0e0e0' : '#f9f9f9',
                                    cursor: 'pointer',
                                }}
                            >
                                <strong>{project.name}</strong>
                                <p>{project.description || 'Geen beschrijving'}</p>
                            </li>
                        ))}
                    </ul>

                    {/* Voeg project toe knop */}
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
            <div className="main-content">
                <h1>My Tasks</h1>
                <button
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        fontSize: '24px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                    }}
                    onClick={() => navigate('/add-task', { state: { projectId: selectedProject } })} // Geef projectId mee
                >
                    +
                </button>
                <ul className="task-list">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <li
                                key={task.id}
                                onClick={() => openEditPanel(task)} // Open bewerkingspaneel
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '15px',
                                    marginBottom: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    backgroundColor: '#f9f9f9',
                                    cursor: 'pointer',
                                }}
                            >
                                <input type="checkbox" style={{ marginRight: '10px' }} />
                                <div>
                                    <h3>{task.title}</h3>
                                    <p>{task.description}</p>
                                    <small>Deadline: {task.due_date || 'Geen'}</small>
                                </div>
                            </li>
                        ))
                    ) : (
                        <p>Geen taken gevonden.</p>
                    )}
                </ul>
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
                                    onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                                    style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <label>Beschrijving:</label>
                                <textarea
                                    value={selectedTask.description}
                                    onChange={(e) =>
                                        setSelectedTask({ ...selectedTask, description: e.target.value })
                                    }
                                    style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <label>Deadline:</label>
                                <input
                                    type="date"
                                    value={selectedTask.due_date || ''}
                                    onChange={(e) =>
                                        setSelectedTask({ ...selectedTask, due_date: e.target.value })
                                    }
                                    style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveChanges} // Zorg dat de functie hier wordt aangeroepen
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
                                    const response = await fetch(`http://localhost:5000/tasks/${selectedTask.id}`, {
                                        method: 'DELETE',
                                        headers: {
                                            Authorization: token,
                                        },
                                    });

                                    if (response.ok) {
                                        setTasks((prevTasks) =>
                                            prevTasks.filter((task) => task.id !== selectedTask.id)
                                        );
                                        setFilteredTasks((prevFilteredTasks) =>
                                            prevFilteredTasks.filter((task) => task.id !== selectedTask.id)
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
