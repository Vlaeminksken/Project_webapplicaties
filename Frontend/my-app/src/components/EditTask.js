import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditTask() {
    const { taskId } = useParams();
    const [task, setTask] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTask = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Je bent niet ingelogd.');
                navigate('/');
                return;
            }
        
            try {
                const response = await fetch(`http://localhost:5000/tasks/${taskId}`, {
                    method: 'GET',
                    headers: { Authorization: token },
                });
        
                if (!response.ok) {
                    throw new Error('Fout bij het ophalen van de taak.');
                }
        
                const data = await response.json();
                setTask(data);
            } catch (error) {
                setError(error.message);
            }
        };
        

        fetchTask();
    }, [taskId, navigate]);

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Je bent niet ingelogd.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify(task),
            });

            if (!response.ok) {
                throw new Error('Fout bij het opslaan van de taak.');
            }

            alert('Taak succesvol bijgewerkt!');
            navigate('/assigned-to-me');
        } catch (error) {
            alert(error.message);
        }
    };

    if (error) {
        return <p>{error}</p>;
    }

    if (!task) {
        return <p>Taak wordt geladen...</p>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Taak Bewerken</h2>
            <form>
                <label>Titel:</label>
                <input
                    type="text"
                    value={task.title}
                    onChange={(e) => setTask({ ...task, title: e.target.value })}
                    style={{ display: 'block', marginBottom: '10px', width: '100%' }}
                />
                <label>Beschrijving:</label>
                <textarea
                    value={task.description}
                    onChange={(e) => setTask({ ...task, description: e.target.value })}
                    style={{ display: 'block', marginBottom: '10px', width: '100%' }}
                />
                <label>Deadline:</label>
                <input
                    type="date"
                    value={task.due_date || ''}
                    onChange={(e) => setTask({ ...task, due_date: e.target.value })}
                    style={{ display: 'block', marginBottom: '10px', width: '100%' }}
                />
                <label>Status:</label>
                <select
                    value={task.status || 'pending'}
                    onChange={(e) => setTask({ ...task, status: e.target.value })}
                    style={{ display: 'block', marginBottom: '10px', width: '100%' }}
                >
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <button
                    type="button"
                    onClick={handleSave}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Opslaan
                </button>
            </form>
        </div>
    );
}

export default EditTask;
