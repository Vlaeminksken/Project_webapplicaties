import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        fetch('http://localhost:5000/home', {
            method: 'GET',
            headers: { Authorization: token },
        })
            .then((response) => {
                if (!response.ok) {
                    navigate('/');
                }
                return response.json();
            })
            .then((data) => {
                setMessage(data.message);
            })
            .catch(() => {
                navigate('/');
            });
    }, [navigate]);

    return <h1>{message}</h1>;
}

export default Home;
