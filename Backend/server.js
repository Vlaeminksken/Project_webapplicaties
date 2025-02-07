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

// voor docker den deze 
const dbPath = process.env.DATABASE_PATH || './Database/Database.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log(`Connected to database at ${dbPath}`);
    }
});

/* 
const dbPath = path.resolve(__dirname, '../database/Database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});
*/
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
    const { title, description, due_date, status } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Titel en beschrijving zijn verplicht.' });
    }

    const query = `
        UPDATE TASKS
        SET title = ?, description = ?, due_date = ?, status = ?
        WHERE id = ?
    `;

    db.run(query, [title, description, due_date, status, id], function (err) {
        if (err) {
            console.error('Fout bij het bijwerken van de taak:', err.message);
            return res.status(500).json({ message: 'Fout bij het bijwerken van de taak.' });
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


app.get('/users', authenticateToken, (req, res) => {
    const query = `
        SELECT id, name
        FROM USERS
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Fout bij het ophalen van gebruikers:', err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van gebruikers.' });
        }

        res.status(200).json(rows || []);
    });
});

app.post('/project-members', authenticateToken, (req, res) => {
    const { userId, projectId, role } = req.body;
    const joined = new Date().toISOString();

    if (!userId || !projectId || !role) {
        return res.status(400).json({ message: 'Gebruikers-ID, project-ID en rol zijn verplicht.' });
    }

    const query = `
        INSERT INTO PROJECT_MEMBERS (user_id, project_id, role, joined)
        VALUES (?, ?, ?, ?)
    `;

    db.run(query, [userId, projectId, role, joined], function (err) {
        if (err) {
            console.error('Fout bij het toevoegen van projectlid:', err.message);
            return res.status(500).json({ message: 'Fout bij het toevoegen van projectlid.' });
        }

        res.status(200).json({ message: 'Projectlid succesvol toegevoegd!', memberId: this.lastID });
    });
});


app.get('/assigned-projects', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT p.id, p.name, p.description
        FROM PROJECTS p
        INNER JOIN PROJECT_MEMBERS pm ON p.id = pm.project_id
        WHERE pm.user_id = ?
    `;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error('Fout bij het ophalen van toegewezen projecten:', err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van projecten.' });
        }

        res.status(200).json(rows || []);
    });
});


app.get('/project-tasks/:projectId', authenticateToken, (req, res) => {
    const { projectId } = req.params;

    const query = `
        SELECT id, title, description, status, due_date
        FROM TASKS
        WHERE project_id = ?
    `;

    db.all(query, [projectId], (err, rows) => {
        if (err) {
            console.error('Fout bij het ophalen van taken:', err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van taken.' });
        }

        res.status(200).json(rows || []);
    });
});

app.get('/project-role/:projectId', authenticateToken, (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    const query = `
        SELECT role
        FROM PROJECT_MEMBERS
        WHERE project_id = ? AND user_id = ?
    `;

    db.get(query, [projectId, userId], (err, row) => {
        if (err) {
            console.error('Fout bij het ophalen van gebruikersrol:', err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van rol.' });
        }

        if (!row) {
            return res.status(404).json({ message: 'Gebruikersrol niet gevonden.' });
        }

        res.status(200).json({ role: row.role });
    });
});

app.get('/tasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT id, title, description, due_date, status
        FROM TASKS
        WHERE id = ?
    `;

    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Fout bij het ophalen van de taak:', err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van de taak.' });
        }

        if (!row) {
            return res.status(404).json({ message: 'Taak niet gevonden.' });
        }

        res.status(200).json(row);
    });
});

// Endpoint voor het ophalen van projectleden
app.get('/projects/:projectId/members', authenticateToken, (req, res) => {
    const { projectId } = req.params;

    const query = `
        SELECT PROJECT_MEMBERS.id, USERS.name, PROJECT_MEMBERS.role
        FROM PROJECT_MEMBERS
        JOIN USERS ON PROJECT_MEMBERS.user_id = USERS.id
        WHERE PROJECT_MEMBERS.project_id = ?
    `;

    db.all(query, [projectId], (err, rows) => {
        if (err) {
            console.error('Fout bij het ophalen van projectleden:', err.message);
            return res.status(500).json({ message: 'Fout bij het ophalen van projectleden.' });
        }

        res.status(200).json(rows);
    });
});

// Endpoint voor het verwijderen van een projectlid
app.delete('/projects/:projectId/members/:memberId', authenticateToken, (req, res) => {
    const { projectId, memberId } = req.params;

    const query = `
        DELETE FROM PROJECT_MEMBERS
        WHERE id = ? AND project_id = ?
    `;

    db.run(query, [memberId, projectId], function (err) {
        if (err) {
            console.error('Fout bij het verwijderen van projectlid:', err.message);
            return res.status(500).json({ message: 'Fout bij het verwijderen van projectlid.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Projectlid niet gevonden.' });
        }

        res.status(200).json({ message: 'Projectlid succesvol verwijderd!' });
    });
});

app.put('/profile', authenticateToken, (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!name || !email) {
        return res.status(400).json({ message: 'Naam en email zijn verplicht.' });
    }

    const query = `
        UPDATE USERS
        SET name = ?, email = ?
        WHERE id = ?
    `;

    db.run(query, [name, email, userId], function (err) {
        if (err) {
            console.error('Fout bij het bijwerken van profielgegevens:', err.message);
            return res.status(500).json({ message: 'Fout bij het bijwerken van profielgegevens.' });
        }

        res.status(200).json({ message: 'Profiel succesvol bijgewerkt!' });
    });
});


app.put('/tasks/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is verplicht.' });
    }

    const query = `
        UPDATE TASKS
        SET status = ?
        WHERE id = ?
    `;

    db.run(query, [status, id], function (err) {
        if (err) {
            console.error('Fout bij het bijwerken van de status:', err.message);
            return res.status(500).json({ message: 'Fout bij het bijwerken van de status.' });
        }

        res.status(200).json({ message: 'Status succesvol bijgewerkt!' });
    });
});


const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentatie',
            version: '1.0.0',
            description: 'Beschrijft alle beschikbare endpoints',
        },
        servers: [{ url: 'http://localhost:5000' }],
    },
    apis: ['./server.js'], // Geef het pad naar je bestand
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));



//-----

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registreer een nieuwe gebruiker
 *     tags: [Gebruikers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Naam van de gebruiker
 *               email:
 *                 type: string
 *                 description: E-mailadres van de gebruiker
 *               password:
 *                 type: string
 *                 description: Wachtwoord van de gebruiker
 *     responses:
 *       200:
 *         description: Gebruiker succesvol geregistreerd
 *       400:
 *         description: Validatiefout (bijvoorbeeld ontbrekende velden of al bestaande email)
 *       500:
 *         description: Interne serverfout
 */


/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Verwijder een taak op basis van ID
 *     tags: [Taken]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van de taak die verwijderd moet worden
 *     responses:
 *       200:
 *         description: Taak succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Taak niet gevonden
 *       500:
 *         description: Fout bij het verwijderen van de taak
 */


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log een gebruiker in
 *     tags: [Gebruikers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: De gebruikersnaam
 *               password:
 *                 type: string
 *                 description: Het wachtwoord
 *     responses:
 *       200:
 *         description: Succesvol ingelogd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: De gegenereerde JWT-token
 *       400:
 *         description: Ontbrekende velden in het verzoek
 *       401:
 *         description: Onjuiste gebruikersnaam of wachtwoord
 *       500:
 *         description: Interne serverfout
 */


/**
 * @swagger
 * /home:
 *   get:
 *     summary: Toegang tot de beveiligde homepagina
 *     tags: [Algemeen]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     responses:
 *       200:
 *         description: Welkom op de homepagina
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Welkomstbericht
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: De ID van de ingelogde gebruiker
 *       401:
 *         description: Geen geldige token verstrekt
 *       403:
 *         description: Toegang geweigerd
 */


/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Voeg een nieuwe taak toe
 *     tags: [Taken]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *                 description: Het ID van het project waaraan de taak is gekoppeld
 *               title:
 *                 type: string
 *                 description: De titel van de taak
 *               description:
 *                 type: string
 *                 description: De beschrijving van de taak
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 description: De deadline van de taak
 *     responses:
 *       201:
 *         description: Taak succesvol toegevoegd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 taskId:
 *                   type: integer
 *                   description: Het ID van de nieuw toegevoegde taak
 *       400:
 *         description: Validatiefout (bijvoorbeeld ontbrekende velden)
 *       500:
 *         description: Fout bij het toevoegen van de taak
 */


/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Verwijder een taak op basis van ID
 *     tags: [Taken]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van de taak die verwijderd moet worden
 *     responses:
 *       200:
 *         description: Taak succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Taak niet gevonden
 *       500:
 *         description: Fout bij het verwijderen van de taak
 */


/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Haal alle taken op die zijn toegewezen aan de ingelogde gebruiker
 *     tags: [Taken]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     responses:
 *       200:
 *         description: Lijst met taken van de ingelogde gebruiker
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID van de taak
 *                   project_id:
 *                     type: integer
 *                     description: ID van het project waaraan de taak is gekoppeld
 *                   title:
 *                     type: string
 *                     description: Titel van de taak
 *                   description:
 *                     type: string
 *                     description: Beschrijving van de taak
 *                   status:
 *                     type: string
 *                     description: Status van de taak
 *                   assigned_to:
 *                     type: integer
 *                     description: ID van de gebruiker aan wie de taak is toegewezen
 *                   due_date:
 *                     type: string
 *                     format: date-time
 *                     description: Deadline van de taak
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: Aanmaakdatum van de taak
 *       500:
 *         description: Fout bij het ophalen van taken
 */


/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update een bestaande taak op basis van ID
 *     tags: [Taken]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van de taak die moet worden bijgewerkt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nieuwe titel van de taak
 *               description:
 *                 type: string
 *                 description: Nieuwe beschrijving van de taak
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 description: Nieuwe deadline van de taak
 *               status:
 *                 type: string
 *                 description: Nieuwe status van de taak
 *     responses:
 *       200:
 *         description: Taak succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validatiefout (bijvoorbeeld ontbrekende titel of beschrijving)
 *       500:
 *         description: Fout bij het bijwerken van de taak
 */


/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Haal profielgegevens van de ingelogde gebruiker op
 *     tags: [Gebruikers]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     responses:
 *       200:
 *         description: Profielgegevens succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Naam van de gebruiker
 *                     email:
 *                       type: string
 *                       description: E-mailadres van de gebruiker
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Datum waarop het profiel is aangemaakt
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: string
 *                     description: Titels van taken toegewezen aan de gebruiker
 *       404:
 *         description: Gebruiker niet gevonden
 *       500:
 *         description: Fout bij het ophalen van profielgegevens of taken
 */


/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Haal projecten op die zijn aangemaakt door de ingelogde gebruiker
 *     tags: [Projecten]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     responses:
 *       200:
 *         description: Lijst met projecten die door de gebruiker zijn aangemaakt
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID van het project
 *                   name:
 *                     type: string
 *                     description: Naam van het project
 *                   description:
 *                     type: string
 *                     description: Beschrijving van het project
 *       500:
 *         description: Fout bij het ophalen van projecten
 */


/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Maak een nieuw project aan
 *     tags: [Projecten]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Naam van het project
 *               description:
 *                 type: string
 *                 description: Beschrijving van het project (optioneel)
 *     responses:
 *       201:
 *         description: Project succesvol aangemaakt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 projectId:
 *                   type: integer
 *                   description: Het ID van het aangemaakte project
 *       400:
 *         description: Validatiefout (bijvoorbeeld ontbrekende projectnaam)
 *       500:
 *         description: Fout bij het aanmaken van het project
 */

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Werk een bestaand project bij
 *     tags: [Projecten]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van het project dat moet worden bijgewerkt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nieuwe naam van het project
 *               description:
 *                 type: string
 *                 description: Nieuwe beschrijving van het project
 *     responses:
 *       200:
 *         description: Project succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validatiefout (bijvoorbeeld ontbrekende projectnaam)
 *       404:
 *         description: Project niet gevonden
 *       500:
 *         description: Fout bij het bijwerken van het project
 */


/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Haal gegevens van een specifiek project op
 *     tags: [Projecten]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van het project dat moet worden opgehaald
 *     responses:
 *       200:
 *         description: Projectgegevens succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Het ID van het project
 *                 name:
 *                   type: string
 *                   description: Naam van het project
 *                 description:
 *                   type: string
 *                   description: Beschrijving van het project
 *       404:
 *         description: Project niet gevonden
 *       500:
 *         description: Fout bij het ophalen van projectgegevens
 */


/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Verwijder een specifiek project
 *     tags: [Projecten]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van het project dat moet worden verwijderd
 *     responses:
 *       200:
 *         description: Project succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Project niet gevonden
 *       500:
 *         description: Fout bij het verwijderen van het project
 */


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Haal een lijst van alle gebruikers op
 *     tags: [Gebruikers]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     responses:
 *       200:
 *         description: Lijst van gebruikers succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Het ID van de gebruiker
 *                   name:
 *                     type: string
 *                     description: De naam van de gebruiker
 *       500:
 *         description: Fout bij het ophalen van gebruikers
 */

/**
 * @swagger
 * /project-members:
 *   post:
 *     summary: Voeg een nieuw lid toe aan een project
 *     tags: [Projectleden]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: Het ID van de gebruiker die wordt toegevoegd aan het project
 *               projectId:
 *                 type: integer
 *                 description: Het ID van het project waaraan de gebruiker wordt toegevoegd
 *               role:
 *                 type: string
 *                 description: De rol van de gebruiker binnen het project
 *     responses:
 *       200:
 *         description: Projectlid succesvol toegevoegd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 memberId:
 *                   type: integer
 *                   description: Het ID van het nieuw toegevoegde projectlid
 *       400:
 *         description: Validatiefout (bijvoorbeeld ontbrekende velden)
 *       500:
 *         description: Fout bij het toevoegen van het projectlid
 */


/**
 * @swagger
 * /assigned-projects:
 *   get:
 *     summary: Haal alle projecten op waaraan de ingelogde gebruiker is toegewezen
 *     tags: [Projecten]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     responses:
 *       200:
 *         description: Lijst met toegewezen projecten succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Het ID van het project
 *                   name:
 *                     type: string
 *                     description: De naam van het project
 *                   description:
 *                     type: string
 *                     description: De beschrijving van het project
 *       500:
 *         description: Fout bij het ophalen van toegewezen projecten
 */


/**
 * @swagger
 * /project-tasks/{projectId}:
 *   get:
 *     summary: Haal alle taken op voor een specifiek project
 *     tags: [Taken]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van het project waarvoor de taken moeten worden opgehaald
 *     responses:
 *       200:
 *         description: Taken van het project succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID van de taak
 *                   title:
 *                     type: string
 *                     description: Titel van de taak
 *                   description:
 *                     type: string
 *                     description: Beschrijving van de taak
 *                   status:
 *                     type: string
 *                     description: Status van de taak
 *                   due_date:
 *                     type: string
 *                     format: date-time
 *                     description: Deadline van de taak
 *       500:
 *         description: Fout bij het ophalen van taken
 */


/**
 * @swagger
 * /project-role/{projectId}:
 *   get:
 *     summary: Haal de rol van de gebruiker op in een specifiek project
 *     tags: [Projectleden]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van het project waarvan de rol moet worden opgehaald
 *     responses:
 *       200:
 *         description: Rol van de gebruiker succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                   description: De rol van de gebruiker in het project
 *       404:
 *         description: Gebruikersrol niet gevonden
 *       500:
 *         description: Fout bij het ophalen van de gebruikersrol
 */


/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Haal details op van een specifieke taak
 *     tags: [Taken]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van de taak die moet worden opgehaald
 *     responses:
 *       200:
 *         description: Details van de taak succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID van de taak
 *                 title:
 *                   type: string
 *                   description: Titel van de taak
 *                 description:
 *                   type: string
 *                   description: Beschrijving van de taak
 *                 due_date:
 *                   type: string
 *                   format: date-time
 *                   description: Deadline van de taak
 *                 status:
 *                   type: string
 *                   description: Status van de taak
 *       404:
 *         description: Taak niet gevonden
 *       500:
 *         description: Fout bij het ophalen van de taak
 */


/**
 * @swagger
 * /projects/{projectId}/members:
 *   get:
 *     summary: Haal alle leden van een specifiek project op
 *     tags: [Projectleden]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van het project waarvan de leden moeten worden opgehaald
 *     responses:
 *       200:
 *         description: Lijst van projectleden succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID van de projectlid-relatie
 *                   name:
 *                     type: string
 *                     description: Naam van de gebruiker
 *                   role:
 *                     type: string
 *                     description: Rol van de gebruiker in het project
 *       500:
 *         description: Fout bij het ophalen van projectleden
 */

/**
 * @swagger
 * /projects/{projectId}/members/{memberId}:
 *   delete:
 *     summary: Verwijder een specifiek lid van een project
 *     tags: [Projectleden]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van het project waar het lid uit moet worden verwijderd
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van het projectlid dat moet worden verwijderd
 *     responses:
 *       200:
 *         description: Projectlid succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Projectlid niet gevonden
 *       500:
 *         description: Fout bij het verwijderen van het projectlid
 */


/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Werk de profielgegevens van de ingelogde gebruiker bij
 *     tags: [Gebruikers]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: De nieuwe naam van de gebruiker
 *               email:
 *                 type: string
 *                 description: Het nieuwe e-mailadres van de gebruiker
 *     responses:
 *       200:
 *         description: Profielgegevens succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validatiefout (bijvoorbeeld ontbrekende naam of email)
 *       500:
 *         description: Fout bij het bijwerken van de profielgegevens
 */


/**
 * @swagger
 * /tasks/{id}/status:
 *   put:
 *     summary: Werk de status van een specifieke taak bij
 *     tags: [Taken]
 *     security:
 *       - bearerAuth: []  # Token authenticatie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Het ID van de taak waarvan de status moet worden bijgewerkt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: De nieuwe status van de taak
 *     responses:
 *       200:
 *         description: Status van de taak succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validatiefout (bijvoorbeeld ontbrekende status)
 *       500:
 *         description: Fout bij het bijwerken van de status
 */




