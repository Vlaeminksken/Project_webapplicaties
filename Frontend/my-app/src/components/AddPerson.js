import React from 'react';
import { useNavigate } from 'react-router-dom';

function AddPerson() {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '20px' }}>
            <h2>Personen Toevoegen</h2>
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
        </div>
    );
}

export default AddPerson;
