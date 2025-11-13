const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'task_manager',
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Error hashing password' });
        db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error registering user' });
            res.status(201).json({ message: 'User created successfully' });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error querying database' });
        if (results.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = results[0];
        bcrypt.compare(password, user.password, (err, match) => {
            if (!match) return res.status(400).json({ error: 'Incorrect password' });

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        });
    });
});


app.post('/tasks', upload.single('image'), (req, res) => {
    const { title, description } = req.body;
    let imageUrl = null;

    if (req.file) {
        imageUrl = '/uploads/' + req.file.filename;
    }

    db.query(
        'INSERT INTO tasks (title, description, image_url) VALUES (?, ?, ?)',
        [title, description, imageUrl],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Error creating task' });
            res.status(201).json({ id: result.insertId, title, description, imageUrl });
        }
    );
});

app.get('/tasks', (req, res) => {
    db.query('SELECT * FROM tasks ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching tasks' });
        res.json(results);
    });
});

app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.query('UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?', [status, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error updating task' });
        res.json({ message: 'Task updated successfully' });
    });
});

app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error deleting task' });
        res.json({ message: 'Task deleted successfully' });
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});