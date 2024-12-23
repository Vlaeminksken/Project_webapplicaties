import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddTask() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const navigate = useNavigate();

    const handleAddTask = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ title, description, due_date: dueDate }),
        });

        const data = await response.json();
        if (response.ok) {
            navigate('/home');
        } else {
            alert(data.message);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Nieuwe Taak</h2>
            <form onSubmit={handleAddTask}>
                <label>Titel:</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <br />
                <label>Beschrijving:</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <br />
                <label>Deadline:</label>
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
                <br />
                <button type="submit">Add</button>
            </form>
        </div>
    );
}

export default AddTask;
