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

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token ongeldig!' });
        req.user = { id: decoded.id }; // Alleen het gebruikers-ID wordt gebruikt
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

app.delete('/tasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM TASKS WHERE id = ?';
    db.run(query, [id], function (err) {
        if (err) {
            console.error('Fout bij het verwijderen van taak:', err.message);
            return res.status(500).json({ message: 'Fout bij het verwijderen van taak.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Taak niet gevonden!' });
        }

        res.status(200).json({ message: 'Taak succesvol verwijderd!' });
    });
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
                //res.status(200).json({ message: 'Succesvol ingelogd!', token });
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
    const { project_id, title, description, due_date } = req.body;
    const assignedTo = req.user.id;
    const createdAt = new Date().toISOString();
    const status = 'pending'; // Standaardwaarde voor status

    if (!title || !description || !project_id) {
        return res.status(400).json({ message: 'Titel, beschrijving en project_id zijn verplicht.' });
    }

    const query = `
        INSERT INTO TASKS (project_id, title, description, status, assigned_to, due_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [project_id, title, description, status, assignedTo, due_date, createdAt], function (err) {
        if (err) {
            console.error('Database fout bij taak toevoegen:', err.message);
            return res.status(500).json({ message: 'Fout bij het toevoegen van de taak.' });
        }

        res.status(201).json({ message: 'Taak succesvol toegevoegd!', taskId: this.lastID });
    });
});

// Taak verwijderen
app.delete('/tasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM TASKS WHERE id = ?`;

    db.run(query, [id], function (err) {
        if (err) {
            console.error('Fout bij het verwijderen van taak:', err.message);
            return res.status(500).json({ message: 'Verwijderen mislukt!' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Taak niet gevonden!' });
        }

        res.status(200).json({ message: 'Taak succesvol verwijderd!' });
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

app.put('/tasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, description, due_date } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Titel en beschrijving zijn verplicht!' });
    }

    const query = `
        UPDATE TASKS 
        SET title = ?, description = ?, due_date = ?
        WHERE id = ?`;

    db.run(query, [title, description, due_date, id], function (err) {
        if (err) {
            console.error('Fout bij het bijwerken van taak:', err.message);
            return res.status(500).json({ message: 'Bijwerken mislukt!' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Taak niet gevonden!' });
        }

        res.status(200).json({ message: 'Taak succesvol bijgewerkt!' });
    });
});


// Profiel gegevens ophalen
app.get('/profile', authenticateToken, (req, res) => {
    const query = 'SELECT name, email, created_at FROM USERS WHERE id = ?';

    db.get(query, [req.user.id], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van profielgegevens!' });
        }

        if (row) {
            const queryTasks = 'SELECT title FROM TASKS WHERE assigned_to = ?';
            db.all(queryTasks, [req.user.id], (err, tasks) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ message: 'Fout bij het ophalen van taken!' });
                }

                res.status(200).json({ user: row, tasks: tasks.map((task) => task.title) });
            });
        } else {
            res.status(404).json({ message: 'Gebruiker niet gevonden!' });
        }
    });
});

app.get('/projects', authenticateToken, (req, res) => {
    const query = 'SELECT id, name, description FROM PROJECTS WHERE created_by = ?';

    db.all(query, [req.user.id], (err, rows) => {
        if (err) {
            console.error('Database fout bij projecten ophalen:', err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van projecten.' });
        }

        res.status(200).json(rows || []); // Altijd een array retourneren, zelfs als er geen projecten zijn
    });
});

app.post('/projects', authenticateToken, (req, res) => {
    const { name, description } = req.body;
    const createdBy = req.user.id;
    const createdAt = new Date().toISOString();

    if (!name) {
        return res.status(400).json({ message: 'De projectnaam is verplicht!' });
    }

    const query = `
        INSERT INTO PROJECTS (name, description, created_by, created_at)
        VALUES (?, ?, ?, ?)`;

    db.run(query, [name, description, createdBy, createdAt], function (err) {
        if (err) {
            console.error('Database fout bij project toevoegen:', err.message);
            return res.status(500).json({ message: 'Project aanmaken mislukt!' });
        }

        res.status(201).json({ message: 'Project succesvol aangemaakt!', projectId: this.lastID });
    });
});

app.put('/projects/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'De projectnaam is verplicht!' });
    }

    const query = `
        UPDATE PROJECTS
        SET name = ?, description = ?
        WHERE id = ? AND created_by = ?`;

    db.run(query, [name, description, id, req.user.id], function (err) {
        if (err) {
            console.error('Fout bij het bijwerken van project:', err.message);
            return res.status(500).json({ message: 'Fout bij het bijwerken van project.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Project niet gevonden.' });
        }

        res.status(200).json({ message: 'Project succesvol bijgewerkt!' });
    });
});

app.get('/projects/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    console.log('Project ID ontvangen:', id);
    console.log('User ID ontvangen:', req.user.id);

    const query = `
        SELECT id, name, description
        FROM PROJECTS
        WHERE id = ? AND created_by = ?`;

    db.get(query, [id, req.user.id], (err, row) => {
        if (err) {
            console.error('Databasefout:', err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van projectgegevens.' });
        }

        if (!row) {
            console.log('Geen project gevonden.');
            return res.status(404).json({ message: 'Project niet gevonden.' });
        }

        console.log('Project gevonden:', row);
        res.status(200).json(row);
    });
});

app.delete('/projects/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    console.log('Ontvangen project ID:', id);
    console.log('Gebruikers ID:', req.user.id);

    const query = `
        DELETE FROM PROJECTS
        WHERE id = ? AND created_by = ?`;

    db.run(query, [id, req.user.id], function (err) {
        if (err) {
            console.error('Databasefout bij verwijderen van project:', err.message);
            return res.status(500).json({ message: 'Fout bij het verwijderen van project.' });
        }

        if (this.changes === 0) {
            console.log('Geen project gevonden om te verwijderen.');
            return res.status(404).json({ message: 'Project niet gevonden.' });
        }

        console.log('Project succesvol verwijderd.');
        res.status(200).json({ message: 'Project succesvol verwijderd!' });
    });
});







