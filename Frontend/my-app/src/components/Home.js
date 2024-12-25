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
                setProjects(data);
            })
            .catch(() => {
                navigate('/');
                setProjects([]);
            });
    }, [navigate]);

    const openEditPanel = (task) => {
        setSelectedTask(task);
        setIsEditing(true);
    };

    const closeEditPanel = () => {
        setIsEditing(false);
        setSelectedTask(null);
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
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                        {projects.length > 0 ? (
                            projects.map((project) => (
                                <li key={project.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                                    <strong>{project.name}</strong>
                                    <p>{project.description || 'Geen beschrijving'}</p>
                                </li>
                            ))
                        ) : (
                            <p>Geen projecten gevonden.</p>
                        )}
                    </ul>
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
                    onClick={() => navigate('/add-task')}
                >
                    +
                </button>
                <ul className="task-list">
                    {tasks.map((task) => (
                        <li key={task.id} className="task-item" onClick={() => openEditPanel(task)}>
                            <input type="checkbox" className="task-checkbox" />
                            <div>
                                <h3>{task.title}</h3>
                                <p>{task.description}</p>
                                <small>Deadline: {task.due_date || 'Geen'}</small>
                            </div>
                        </li>
                    ))}
                </ul>

                {isEditing && (
                    <>
                        <div className="overlay open" onClick={closeEditPanel}></div>
                        <div className={`edit-panel open`}>
                            <h2>Taak Bewerken</h2>
                            <form>
                                <label>Titel:</label>
                                <input
                                    type="text"
                                    value={selectedTask.title}
                                    onChange={(e) =>
                                        setSelectedTask({ ...selectedTask, title: e.target.value })
                                    }
                                    placeholder="Titel invoeren"
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
                                    placeholder="Beschrijving invoeren"
                                />

                                <label>Deadline:</label>
                                <input
                                    type="date"
                                    value={selectedTask.due_date}
                                    onChange={(e) =>
                                        setSelectedTask({ ...selectedTask, due_date: e.target.value })
                                    }
                                />

                                <button type="button" onClick={handleSaveChanges}>
                                    Opslaan
                                </button>
                                <button
                                    type="button"
                                    onClick={closeEditPanel}
                                    className="cancel-button"
                                >
                                    Annuleren
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
