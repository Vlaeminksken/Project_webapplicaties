const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Initialisatie
const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_secret_key'; // Gebruik een veilige geheime sleutel!

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

// Middleware om beveiligde routes te beschermen
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Geen token verstrekt!' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token ongeldig!' });
        req.user = user;
        next();
    });
}

// Endpoints
// Registreren
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Vul alle velden in!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'user'; // Default rol
        const createdAt = new Date().toISOString();

        const query = `
            INSERT INTO USERS (name, email, password, role, created_at) 
            VALUES (?, ?, ?, ?, ?)`;

        db.run(query, [name, email, hashedPassword, role, createdAt], function (err) {
            if (err) {
                console.error(err.message);
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ message: 'Email bestaat al!' });
                }
                return res.status(500).json({ message: 'Registratie mislukt!' });
            }
            res.status(200).json({ message: 'Gebruiker succesvol geregistreerd!' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Er is een fout opgetreden!' });
    }
});

// Inloggen
app.post('/login', (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: 'Vul alle velden in!' });
    }

    const query = 'SELECT * FROM USERS WHERE name = ?';
    db.get(query, [name], async (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Login mislukt!' });
        }

        if (row) {
            const passwordMatch = await bcrypt.compare(password, row.password);
            if (passwordMatch) {
                const token = jwt.sign({ id: row.id, name: row.name, role: row.role }, SECRET_KEY, { expiresIn: '1h' });
                res.status(200).json({ message: 'Succesvol ingelogd!', token });
            } else {
                res.status(401).json({ message: 'Onjuiste gebruikersnaam of wachtwoord!' });
            }
        } else {
            res.status(401).json({ message: 'Onjuiste gebruikersnaam of wachtwoord!' });
        }
    });
});

// Beveiligde route
app.get('/home', authenticateToken, (req, res) => {
    res.status(200).json({ message: 'Welkom op de homepagina!', user: req.user });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Taak toevoegen
app.post('/tasks', authenticateToken, (req, res) => {
    const { title, description, due_date } = req.body;
    const userId = req.user.id; // Gebruiker ID van de ingelogde gebruiker
    const createdAt = new Date().toISOString();

    if (!title || !description) {
        return res.status(400).json({ message: 'Titel en beschrijving zijn verplicht!' });
    }

    const query = `
        INSERT INTO TASKS (title, description, status, assigned_to, due_date, created_at) 
        VALUES (?, ?, 'pending', ?, ?, ?)`;

    db.run(query, [title, description, userId, due_date, createdAt], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Taak toevoegen mislukt!' });
        }
        res.status(200).json({ message: 'Taak succesvol toegevoegd!' });
    });
});

// Taken ophalen
app.get('/tasks', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = 'SELECT * FROM TASKS WHERE assigned_to = ?';
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Taken ophalen mislukt!' });
        }
        res.status(200).json(rows);
    });
});







