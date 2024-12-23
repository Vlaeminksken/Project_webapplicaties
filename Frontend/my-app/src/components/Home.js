import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [tasks, setTasks] = useState([]);
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
            })
            .catch(() => {
                navigate('/');
            });
    }, [navigate]);

    return (
        <div style={{ padding: '20px' }}>
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
            <ul>
                {tasks.map((task) => (
                    <li key={task.id}>
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <small>Deadline: {task.due_date || 'Geen'}</small>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Home;
