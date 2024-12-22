const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialisatie
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Verbind met SQLite database
const dbPath = path.resolve(__dirname, '../database/Database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Endpoints
// Registreren
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Vul alle velden in!' });
    }

    const role = 'user'; // Default rol
    const createdAt = new Date().toISOString();

    const query = `
        INSERT INTO USERS (name, email, password, role, created_at) 
        VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [name, email, password, role, createdAt], function (err) {
        if (err) {
            console.error(err.message);
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ message: 'Email bestaat al!' });
            }
            return res.status(500).json({ message: 'Registratie mislukt!' });
        }
        res.status(200).json({ message: 'Gebruiker succesvol geregistreerd!' });
    });
});

// Inloggen
app.post('/login', (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: 'Vul alle velden in!' });
    }

    const query = 'SELECT * FROM USERS WHERE name = ? AND password = ?';
    db.get(query, [name, password], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Login mislukt!' });
        }

        if (row) {
            res.status(200).json({ message: 'Succesvol ingelogd!', user: row });
        } else {
            res.status(401).json({ message: 'Onjuiste gebruikersnaam of wachtwoord!' });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
