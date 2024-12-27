import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AddPerson() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [roles, setRoles] = useState({});
    const navigate = useNavigate();
    const location = useLocation();

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

    // Filter gebruikerslijst op zoekterm
    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        setFilteredUsers(
            users.filter((user) =>
                user.name.toLowerCase().includes(term.toLowerCase())
            )
        );
    };

    // Voeg gebruiker toe aan geselecteerde lijst
    const handleUserSelect = (user) => {
        if (!selectedUsers.some((selected) => selected.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    // Verwijder gebruiker uit geselecteerde lijst
    const handleRemoveUser = (user) => {
        setSelectedUsers(selectedUsers.filter((selected) => selected.id !== user.id));
        setRoles((prevRoles) => {
            const updatedRoles = { ...prevRoles };
            delete updatedRoles[user.id];
            return updatedRoles;
        });
    };

    // Verwerk rolwijziging
    const handleRoleChange = (userId, role) => {
        setRoles((prevRoles) => ({
            ...prevRoles,
            [userId]: role,
        }));
    };

    // Voeg geselecteerde gebruikers toe aan het project
    const handleAddToProject = async () => {
        if (selectedUsers.length === 0) {
            alert('Selecteer minstens één gebruiker om toe te voegen.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Je bent niet ingelogd.');
            return;
        }

        const projectId = location.state?.projectId;
        if (!projectId) {
            alert('Geen project geselecteerd.');
            return;
        }

        try {
            for (const user of selectedUsers) {
                const response = await fetch('http://localhost:5000/project-members', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: token,
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        projectId: projectId,
                        role: roles[user.id] || 'spectator', // Voeg de rol toe
                    }),
                });

                if (!response.ok) {
                    throw new Error('Fout bij het toevoegen van projectlid.');
                }
            }

            alert('Gebruikers succesvol toegevoegd aan het project!');
            setSelectedUsers([]); // Leeg de geselecteerde lijst
            setRoles({}); // Leeg de rollenlijst
        } catch (error) {
            console.error('Fout bij het toevoegen van gebruikers:', error.message);
            alert('Er is een fout opgetreden. Probeer het opnieuw.');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Retourknop */}
            <button
                onClick={() => navigate('/home')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#007bff',
                }}
            >
                Terug naar Home
            </button>

            {/* Eerste Kolom */}
            <div
                style={{
                    width: '30%',
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
                    width: '30%',
                    padding: '20px',
                    borderRight: '1px solid #ddd',
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
            </div>

            {/* Derde Kolom */}
            <div
                style={{
                    width: '40%',
                    padding: '20px',
                }}
            >
                <h2>Rollen Toewijzen</h2>
                {selectedUsers.map((user) => (
                    <div
                        key={user.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px',
                            borderBottom: '1px solid #ddd',
                        }}
                    >
                        <span>{user.name}</span>
                        <select
                            value={roles[user.id] || 'spectator'}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            style={{
                                padding: '5px',
                                borderRadius: '5px',
                                border: '1px solid #ddd',
                            }}
                        >
                            <option value="spectator">Spectator</option>
                            <option value="operator">Operator</option>
                        </select>
                    </div>
                ))}
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
                    onClick={handleAddToProject}
                >
                    Voeg toe aan Project
                </button>
            </div>
        </div>
    );
}

export default AddPerson;
