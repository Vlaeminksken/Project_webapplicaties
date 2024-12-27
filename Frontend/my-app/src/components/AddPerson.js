import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AddPerson() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // Voor de zoekbalk
    const [selectedUsers, setSelectedUsers] = useState([]); // Voor de 2e kolom
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        // Haal gebruikers op van de server
        fetch('http://localhost:5000/users', {
            method: 'GET',
            headers: { Authorization: token },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Fout bij het ophalen van gebruikers.');
                }
                return response.json();
            })
            .then((data) => {
                setUsers(data);
                setFilteredUsers(data); // Toon alle gebruikers standaard
            })
            .catch((err) => {
                console.error(err.message);
                alert('Fout bij het ophalen van gebruikers.');
            });
    }, [navigate]);

    // Filter de gebruikerslijst op basis van de zoekterm
    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        setFilteredUsers(
            users.filter((user) =>
                user.name.toLowerCase().includes(term.toLowerCase())
            )
        );
    };

    // Voeg een gebruiker toe aan de geselecteerde lijst
    const handleUserSelect = (user) => {
        if (!selectedUsers.some((selected) => selected.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    // Verwijder een gebruiker uit de originele lijst bij selectie
    const handleRemoveUser = (user) => {
        setSelectedUsers(selectedUsers.filter((selected) => selected.id !== user.id));
    };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Eerste Kolom */}
            <div
                style={{
                    width: '40%',
                    borderRight: '1px solid #ddd',
                    padding: '20px',
                    overflowY: 'auto',
                }}
            >
                <h2>Beschikbare Personen</h2>
                {/* Zoekbalk */}
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Zoek een gebruiker..."
                    style={{
                        width: '100%',
                        padding: '10px',
                        marginBottom: '20px',
                        borderRadius: '5px',
                        border: '1px solid #ddd',
                    }}
                />
                {/* Gebruikerslijst */}
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {filteredUsers.map((user) => (
                        <li
                            key={user.id}
                            style={{
                                padding: '10px',
                                borderBottom: '1px solid #ddd',
                                cursor: 'pointer',
                            }}
                            onDoubleClick={() => handleUserSelect(user)} // Verplaats naar 2e kolom bij dubbelklikken
                        >
                            {user.name}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Tweede Kolom */}
            <div
                style={{
                    width: '60%',
                    padding: '20px',
                }}
            >
                <h2>Geselecteerde Personen</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {selectedUsers.map((user) => (
                        <li
                            key={user.id}
                            style={{
                                padding: '10px',
                                borderBottom: '1px solid #ddd',
                                cursor: 'pointer',
                            }}
                            onDoubleClick={() => handleRemoveUser(user)} // Verwijder bij dubbelklikken
                        >
                            {user.name}
                        </li>
                    ))}
                </ul>
                <button
                    style={{
                        marginTop: '20px',
                        padding: '10px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                    onClick={() => alert('Personen toegevoegd aan project!')}
                >
                    Voeg toe aan Project
                </button>
            </div>
        </div>
    );
}

export default AddPerson;
